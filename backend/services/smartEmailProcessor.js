/**
 * Smart Email Processing Options
 * 
 * Provides more selective processing options for users with large email volumes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Email = require('../models/emailModel');
const { processEmailContent, saveTasks, saveFollowups } = require('./unifiedEmailProcessor');

/**
 * Process emails with smart filtering options
 * @param {Object} user - User object
 * @param {Object} options - Processing options including filters
 * @returns {Promise<Object>} - Processing results
 */
const smartProcessEmails = async (user, options = {}) => {
  try {
    const {
      // Time filters
      startDate,
      endDate,
      lastDays,
      
      // Content filters
      senders = [],
      keywords = [],
      excludeKeywords = [],
      includeLabels = [],
      excludeLabels = [],
      
      // Processing limits
      maxEmails = 100,
      batchSize = 10,
      
      // Progress tracking
      trackingCallback = null
    } = options;
    
    // Build query filters
    const filters = { user: user._id, processed: false };
    
    // Date filtering
    if (startDate || endDate || lastDays) {
      filters.date = {};
      
      if (startDate) {
        filters.date.$gte = new Date(startDate);
      } else if (lastDays) {
        filters.date.$gte = new Date(Date.now() - (lastDays * 24 * 60 * 60 * 1000));
      }
      
      if (endDate) {
        filters.date.$lte = new Date(endDate);
      }
    }
    
    // Sender filtering
    if (senders && senders.length > 0) {
      filters.from = { $in: senders.map(sender => new RegExp(sender, 'i')) };
    }
    
    // Content filtering with keywords
    const contentConditions = [];
    
    if (keywords && keywords.length > 0) {
      const keywordPatterns = keywords.map(keyword => new RegExp(keyword, 'i'));
      
      keywordPatterns.forEach(pattern => {
        contentConditions.push({ subject: pattern });
        contentConditions.push({ body: pattern });
      });
    }
    
    // Label filtering
    if (includeLabels && includeLabels.length > 0) {
      filters.labels = { $in: includeLabels };
    }
    
    if (excludeLabels && excludeLabels.length > 0) {
      filters.labels = { ...(filters.labels || {}), $nin: excludeLabels };
    }
    
    // Combine content conditions if any
    if (contentConditions.length > 0) {
      filters.$or = contentConditions;
    }
    
    // Exclude keywords if specified
    if (excludeKeywords && excludeKeywords.length > 0) {
      const excludePatterns = excludeKeywords.map(keyword => new RegExp(keyword, 'i'));
      
      filters.$and = filters.$and || [];
      
      excludePatterns.forEach(pattern => {
        filters.$and.push({ subject: { $not: pattern } });
        filters.$and.push({ body: { $not: pattern } });
      });
    }
    
    // Count matching emails
    const matchingCount = await Email.countDocuments(filters);
    console.log(`Found ${matchingCount} emails matching filters for user ${user.email}`);
    
    const emailsToProcess = Math.min(matchingCount, maxEmails);
    
    // Update progress tracker with total
    if (trackingCallback) {
      trackingCallback({
        type: 'init',
        total: emailsToProcess,
        batches: Math.ceil(emailsToProcess / batchSize)
      });
    }
    
    // Prepare result object
    const results = {
      matchingEmails: matchingCount,
      processedEmails: 0,
      tasks: [],
      followups: [],
      errors: [],
      startTime: new Date(),
      endTime: null
    };
    
    // If no emails to process, return early
    if (emailsToProcess === 0) {
      results.endTime = new Date();
      if (trackingCallback) {
        trackingCallback({ type: 'complete', totalProcessed: 0, tasksFound: 0, followupsFound: 0, errors: 0, duration: 0 });
      }
      return results;
    }
    
    // Process emails in batches
    let processedCount = 0;
    let batchCount = 0;
    
    while (processedCount < emailsToProcess) {
      const batchLimit = Math.min(batchSize, emailsToProcess - processedCount);
      
      // Get a batch of emails matching filters
      const emailBatch = await Email.find(filters)
        .sort({ date: -1 })
        .limit(batchLimit)
        .skip(processedCount);
      
      // If no more emails, break
      if (emailBatch.length === 0) break;
      
      // Update batch count
      batchCount++;
      
      // Update progress tracker with batch info
      if (trackingCallback) {
        trackingCallback({
          type: 'batch',
          batchNumber: batchCount,
          emailCount: emailBatch.length,
          totalProcessed: processedCount
        });
      }
      
      // Process each email in batch
      const batchResults = {
        processed: 0,
        tasks: [],
        followups: [],
        errors: []
      };
      
      for (const email of emailBatch) {
        try {
          // Extract content
          const extracted = await processEmailContent(email, user);
          
          // Save tasks and follow-ups
          const savedTasks = await saveTasks(extracted.tasks, user, email);
          const savedFollowups = await saveFollowups(extracted.followups, user, email);
          
          // Update batch results
          batchResults.tasks = batchResults.tasks.concat(savedTasks);
          batchResults.followups = batchResults.followups.concat(savedFollowups);
          batchResults.processed++;
          
          // Mark as processed even if no items found
          if (extracted.tasks.length === 0 && extracted.followups.length === 0) {
            await Email.findByIdAndUpdate(email._id, { processed: true });
          }
          
          // Update progress if callback provided
          if (trackingCallback) {
            trackingCallback({
              type: 'email',
              emailId: email._id,
              subject: email.subject,
              tasksFound: savedTasks.length,
              followupsFound: savedFollowups.length
            });
          }
          
        } catch (emailError) {
          console.error(`Error processing email ${email._id}:`, emailError);
          
          batchResults.errors.push({
            emailId: email._id,
            subject: email.subject,
            error: emailError.message
          });
          
          // Update progress for errors too
          if (trackingCallback) {
            trackingCallback({
              type: 'error',
              emailId: email._id,
              subject: email.subject,
              error: emailError.message
            });
          }
        }
      }
      
      // Update processed count
      processedCount += emailBatch.length;
      
      // Update results
      results.processedEmails += batchResults.processed;
      results.tasks = results.tasks.concat(batchResults.tasks);
      results.followups = results.followups.concat(batchResults.followups);
      results.errors = results.errors.concat(batchResults.errors);
    }
    
    results.endTime = new Date();
    results.duration = (results.endTime - results.startTime) / 1000; // seconds
    
    // Final progress update
    if (trackingCallback) {
      trackingCallback({
        type: 'complete',
        totalProcessed: results.processedEmails,
        tasksFound: results.tasks.length,
        followupsFound: results.followups.length,
        errors: results.errors.length,
        duration: results.duration
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('Error in smart processing:', error);
    throw error;
  }
};

module.exports = {
  smartProcessEmails
};
