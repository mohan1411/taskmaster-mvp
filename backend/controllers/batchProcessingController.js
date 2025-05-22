/**
 * Batch Email Processing Controller
 * 
 * Handles API routes for batch processing of large email volumes
 */

const User = require('../models/userModel');
const Email = require('../models/emailModel');
const { 
  createProcessingJob, 
  getJobStatus 
} = require('../services/batchEmailProcessor');

/**
 * Start a batch processing job for the user's emails
 * @route POST /api/unified-email/batch-process
 * @access Private
 */
const startBatchProcessing = async (req, res) => {
  try {
    const { maxEmails, batchSize, concurrentBatches } = req.body;
    
    // Create batch processing job for the user
    const jobInfo = await createProcessingJob(req.user._id, {
      maxEmails: parseInt(maxEmails) || 1000,
      batchSize: parseInt(batchSize) || 10,
      concurrentBatches: parseInt(concurrentBatches) || 2
    });
    
    return res.status(200).json({
      message: 'Batch processing started',
      job: jobInfo
    });
  } catch (error) {
    console.error('Error starting batch processing:', error);
    return res.status(500).json({
      message: 'Error starting batch processing',
      error: error.message
    });
  }
};

/**
 * Get status of a processing job
 * @route GET /api/unified-email/job/:jobId
 * @access Private
 */
const getProcessingJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Check if job exists and belongs to the user
    const jobStatus = getJobStatus(jobId);
    
    // Verify job belongs to the requesting user
    if (jobStatus.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to job status' });
    }
    
    return res.status(200).json({
      message: 'Job status retrieved',
      job: jobStatus
    });
  } catch (error) {
    console.error('Error retrieving job status:', error);
    return res.status(500).json({
      message: 'Error retrieving job status',
      error: error.message
    });
  }
};

/**
 * Get email processing statistics
 * @route GET /api/unified-email/stats
 * @access Private
 */
const getProcessingStats = async (req, res) => {
  try {
    const user = req.user._id;
    
    // Count emails by processing status
    const totalEmails = await Email.countDocuments({ user });
    const processedEmails = await Email.countDocuments({ user, processed: true });
    const unprocessedEmails = await Email.countDocuments({ user, processed: false });
    
    // Count extracted items
    const withTasks = await Email.countDocuments({ 
      user, 
      tasks: { $exists: true, $ne: [] } 
    });
    
    const withFollowups = await Email.countDocuments({ 
      user, 
      followups: { $exists: true, $ne: [] } 
    });
    
    // Get most recent email date
    const mostRecent = await Email.findOne({ user })
      .sort({ date: -1 })
      .select('date subject');
    
    return res.status(200).json({
      totalEmails,
      processedEmails,
      unprocessedEmails,
      processingPercentage: totalEmails ? Math.round((processedEmails / totalEmails) * 100) : 0,
      withTasks,
      withFollowups,
      mostRecentDate: mostRecent?.date || null,
      mostRecentSubject: mostRecent?.subject || null
    });
  } catch (error) {
    console.error('Error getting processing stats:', error);
    return res.status(500).json({
      message: 'Error getting processing stats',
      error: error.message
    });
  }
};

module.exports = {
  startBatchProcessing,
  getProcessingJobStatus,
  getProcessingStats
};
