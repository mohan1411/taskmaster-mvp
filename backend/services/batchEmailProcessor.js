/**
 * Batch Email Processor Service
 * 
 * Designed for processing large volumes of emails (1000+) efficiently
 * with proper batching, rate limiting, and progress tracking.
 */

const mongoose = require('mongoose');
const User = require('../models/userModel');
const Email = require('../models/emailModel');
const { processEmailContent, saveTasks, saveFollowups } = require('./unifiedEmailProcessor');
const queue = require('async/queue');

// Configuration
const BATCH_SIZE = 10; // Number of emails per batch
const CONCURRENT_BATCHES = 2; // Number of batches to process in parallel
const RATE_LIMIT_DELAY = 1000; // Milliseconds to wait between API calls
const MAX_EMAILS_PER_RUN = 1000; // Safety limit for maximum emails per run

/**
 * Process emails in batches with rate limiting
 * @param {Object} user - User object
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Processing results
 */
const batchProcessEmails = async (user, options = {}) => {
  const {
    batchSize = BATCH_SIZE,
    concurrentBatches = CONCURRENT_BATCHES,
    maxEmails = MAX_EMAILS_PER_RUN,
    trackingCallback = null
  } = options;
  
  // Create a processing queue with concurrency limit
  const processingQueue = queue(async (emailBatch, callback) => {
    try {
      console.log(`Processing batch of ${emailBatch.length} emails`);
      
      const batchResults = {
        processed: 0,
        tasks: [],
        followups: [],
        errors: []
      };
      
      // Process each email in the batch
      for (const email of emailBatch) {
        try {
          // Process with rate limiting
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
          
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
      
      callback(null, batchResults);
      
    } catch (batchError) {
      console.error('Batch processing error:', batchError);
      callback(batchError);
    }
  }, concurrentBatches);
  
  try {
    // Find unprocessed emails
    console.log(`Finding unprocessed emails for user ${user.email}`);
    const unprocessedCount = await Email.countDocuments({ 
      user: user._id, 
      processed: false 
    });
    
    const emailsToProcess = Math.min(unprocessedCount, maxEmails);
    console.log(`Found ${unprocessedCount} unprocessed emails, will process up to ${emailsToProcess}`);
    
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
      totalEmails: emailsToProcess,
      processed: 0,
      tasks: [],
      followups: [],
      errors: [],
      batches: 0,
      startTime: new Date(),
      endTime: null
    };
    
    // If no emails to process, return early
    if (emailsToProcess === 0) {
      results.endTime = new Date();
      return results;
    }
    
    // Process in batches
    let processedCount = 0;
    let batchCount = 0;
    
    while (processedCount < emailsToProcess) {
      const batchLimit = Math.min(batchSize, emailsToProcess - processedCount);
      
      // Get a batch of emails
      const emailBatch = await Email.find({
        user: user._id,
        processed: false
      })
      .sort({ date: -1 }) // Process newest first
      .limit(batchLimit)
      .skip(processedCount);
      
      // If no more emails, break
      if (emailBatch.length === 0) break;
      
      // Add batch to processing queue
      processingQueue.push(emailBatch);
      
      // Update counters
      processedCount += emailBatch.length;
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
    }
    
    // Wait for all batches to complete
    return new Promise((resolve, reject) => {
      processingQueue.drain(() => {
        // Combine all batch results
        const batchResults = processingQueue.results();
        
        for (const result of batchResults) {
          if (result) {
            results.processed += result.processed || 0;
            results.tasks = results.tasks.concat(result.tasks || []);
            results.followups = results.followups.concat(result.followups || []);
            results.errors = results.errors.concat(result.errors || []);
          }
        }
        
        results.batches = batchCount;
        results.endTime = new Date();
        results.duration = (results.endTime - results.startTime) / 1000; // seconds
        
        // Final progress update
        if (trackingCallback) {
          trackingCallback({
            type: 'complete',
            totalProcessed: results.processed,
            tasksFound: results.tasks.length,
            followupsFound: results.followups.length,
            errors: results.errors.length,
            duration: results.duration
          });
        }
        
        resolve(results);
      });
      
      processingQueue.error(reject);
    });
    
  } catch (error) {
    console.error('Error in batch processing:', error);
    throw error;
  }
};

/**
 * Create a processing job for a user and track progress
 * @param {string} userId - User ID
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Job information
 */
const createProcessingJob = async (userId, options = {}) => {
  try {
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Create job tracker in memory (in production, use a database)
    const jobId = new mongoose.Types.ObjectId().toString();
    const jobTracker = {
      id: jobId,
      userId: user._id,
      status: 'pending',
      progress: {
        total: 0,
        processed: 0,
        batches: {
          total: 0,
          completed: 0
        },
        items: {
          tasks: 0,
          followups: 0
        },
        errors: 0
      },
      startTime: new Date(),
      endTime: null,
      logs: []
    };
    
    // Store job in global registry (in production, use a database)
    global.processingJobs = global.processingJobs || {};
    global.processingJobs[jobId] = jobTracker;
    
    // Add initial log entry
    jobTracker.logs.push({
      time: new Date(),
      message: `Processing job created for user ${user.email}`
    });
    
    // Create update callback
    const updateProgress = (update) => {
      const job = global.processingJobs[jobId];
      if (!job) return;
      
      // Update based on event type
      switch (update.type) {
        case 'init':
          job.progress.total = update.total;
          job.progress.batches.total = update.batches;
          job.logs.push({
            time: new Date(),
            message: `Found ${update.total} emails to process in ${update.batches} batches`
          });
          break;
          
        case 'batch':
          job.progress.batches.completed = update.batchNumber;
          job.progress.processed = update.totalProcessed;
          job.logs.push({
            time: new Date(),
            message: `Batch ${update.batchNumber} started with ${update.emailCount} emails`
          });
          break;
          
        case 'email':
          job.progress.items.tasks += update.tasksFound;
          job.progress.items.followups += update.followupsFound;
          break;
          
        case 'error':
          job.progress.errors++;
          job.logs.push({
            time: new Date(),
            message: `Error processing email "${update.subject}": ${update.error}`
          });
          break;
          
        case 'complete':
          job.status = 'completed';
          job.endTime = new Date();
          job.progress.processed = update.totalProcessed;
          job.progress.items.tasks = update.tasksFound;
          job.progress.items.followups = update.followupsFound;
          job.progress.errors = update.errors;
          job.logs.push({
            time: new Date(),
            message: `Processing completed: ${update.totalProcessed} emails processed, ${update.tasksFound} tasks and ${update.followupsFound} follow-ups created, ${update.errors} errors encountered. Duration: ${update.duration.toFixed(2)} seconds`
          });
          break;
      }
      
      // Calculate overall progress percentage
      job.progress.percentage = Math.floor((job.progress.processed / job.progress.total) * 100) || 0;
    };
    
    // Start processing in background
    jobTracker.status = 'processing';
    process.nextTick(async () => {
      try {
        // Run batch processing
        const results = await batchProcessEmails(user, {
          ...options,
          trackingCallback: updateProgress
        });
        
        // Job should be marked as completed by the callback
        console.log(`Processing job ${jobId} completed successfully`);
      } catch (error) {
        // Update job status on error
        const job = global.processingJobs[jobId];
        if (job) {
          job.status = 'failed';
          job.logs.push({
            time: new Date(),
            message: `Processing job failed: ${error.message}`
          });
          console.error(`Processing job ${jobId} failed:`, error);
        }
      }
    });
    
    return {
      jobId,
      userId: user._id,
      status: 'processing',
      message: `Processing job started for user ${user.email}`,
      checkStatusAt: `/api/unified-email/job/${jobId}`
    };
    
  } catch (error) {
    console.error('Error creating processing job:', error);
    throw error;
  }
};

/**
 * Get the status of a processing job
 * @param {string} jobId - Job ID
 * @returns {Object} - Job status information
 */
const getJobStatus = (jobId) => {
  // In production, get this from a database
  const job = (global.processingJobs || {})[jobId];
  
  if (!job) {
    throw new Error('Job not found');
  }
  
  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    startTime: job.startTime,
    endTime: job.endTime,
    duration: job.endTime ? (job.endTime - job.startTime) / 1000 : null,
    recentLogs: job.logs.slice(-10) // Get 10 most recent logs
  };
};

module.exports = {
  batchProcessEmails,
  createProcessingJob,
  getJobStatus
};
