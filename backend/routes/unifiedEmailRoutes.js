/**
 * Updated Email Routes with Smart Processing - MVP Version
 * 
 * These routes include options for selective processing of emails.
 * For MVP: Smart processing routes are commented out but kept in codebase for future use.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Import controllers
const {
  processEmails,
  getUnprocessedStats,
  processSingleEmail
} = require('../controllers/unifiedEmailController');

const {
  startBatchProcessing,
  getProcessingJobStatus,
  getProcessingStats
} = require('../controllers/batchProcessingController');

const {
  smartProcess,
  getProcessingRecommendations
} = require('../controllers/smartProcessingController');

// Standard processing routes - Only manual processing for MVP
router.post('/process-unified', protect, processEmails);
router.get('/unprocessed-stats', protect, getUnprocessedStats);
router.post('/:emailId/process-unified', protect, processSingleEmail);

// Batch processing routes (disabled for MVP but kept in codebase)
// Will be enabled in future versions
/*
router.post('/batch-process', protect, startBatchProcessing);
router.get('/job/:jobId', protect, getProcessingJobStatus);
router.get('/stats', protect, getProcessingStats);
*/

// Smart processing routes (disabled for MVP but kept in codebase)
// Will be enabled in future versions
/*
router.post('/smart-process', protect, smartProcess);
router.get('/recommendations', protect, getProcessingRecommendations);
*/

module.exports = router;
