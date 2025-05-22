/**
 * Unified Email Processing Controller
 * 
 * This controller handles routes related to the unified processing
 * of emails to extract both tasks and follow-ups simultaneously.
 */

const User = require('../models/userModel');
const Email = require('../models/emailModel');
const { processUserEmails } = require('../services/unifiedEmailProcessor');

/**
 * Process unprocessed emails for the authenticated user
 * @route POST /api/email/process-unified
 * @access Private
 */
const processEmails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get limit from request or use default
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    
    // Process emails
    const results = await processUserEmails(user, limit);
    
    return res.status(200).json({
      message: 'Email processing completed',
      stats: {
        processed: results.processed,
        tasksExtracted: results.tasks.length,
        followupsExtracted: results.followups.length,
        errors: results.errors.length
      },
      tasks: results.tasks.map(task => ({
        id: task._id,
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate
      })),
      followups: results.followups.map(followup => ({
        id: followup._id,
        title: followup.title,
        contactPerson: followup.contactPerson,
        deadline: followup.deadline
      })),
      errors: results.errors
    });
    
  } catch (error) {
    console.error('Error in processEmails controller:', error);
    return res.status(500).json({ 
      message: 'Error processing emails', 
      error: error.message 
    });
  }
};

/**
 * Get statistics on unprocessed emails
 * @route GET /api/email/unprocessed-stats
 * @access Private
 */
const getUnprocessedStats = async (req, res) => {
  try {
    const user = req.user._id;
    
    // Count unprocessed emails
    const unprocessedCount = await Email.countDocuments({ 
      user, 
      processed: false 
    });
    
    // Get most recent unprocessed email date
    const mostRecent = await Email.findOne({ 
      user, 
      processed: false 
    }).sort({ date: -1 });
    
    return res.status(200).json({
      unprocessedCount,
      mostRecentDate: mostRecent ? mostRecent.date : null,
      mostRecentSubject: mostRecent ? mostRecent.subject : null
    });
    
  } catch (error) {
    console.error('Error in getUnprocessedStats controller:', error);
    return res.status(500).json({ 
      message: 'Error getting unprocessed email stats', 
      error: error.message 
    });
  }
};

/**
 * Process a specific email by ID
 * @route POST /api/email/:emailId/process-unified
 * @access Private
 */
const processSingleEmail = async (req, res) => {
  try {
    const { emailId } = req.params;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find the email
    const email = await Email.findOne({ 
      _id: emailId, 
      user: user._id 
    });
    
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Create mock processUserEmails function that only processes this email
    const mockProcessUserEmails = async () => {
      const extracted = await require('../services/unifiedEmailProcessor').processEmailContent(email, user);
      
      // Save tasks and follow-ups
      const savedTasks = await require('../services/unifiedEmailProcessor').saveTasks(extracted.tasks, user, email);
      const savedFollowups = await require('../services/unifiedEmailProcessor').saveFollowups(extracted.followups, user, email);
      
      return {
        processed: 1,
        tasks: savedTasks,
        followups: savedFollowups,
        errors: []
      };
    };
    
    // Process the single email
    const results = await mockProcessUserEmails();
    
    return res.status(200).json({
      message: 'Email processed successfully',
      email: {
        id: email._id,
        subject: email.subject,
        from: email.from,
        date: email.date
      },
      tasks: results.tasks.map(task => ({
        id: task._id,
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate
      })),
      followups: results.followups.map(followup => ({
        id: followup._id,
        title: followup.title,
        contactPerson: followup.contactPerson,
        deadline: followup.deadline
      }))
    });
    
  } catch (error) {
    console.error('Error in processSingleEmail controller:', error);
    return res.status(500).json({ 
      message: 'Error processing email', 
      error: error.message 
    });
  }
};

module.exports = {
  processEmails,
  getUnprocessedStats,
  processSingleEmail
};
