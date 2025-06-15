const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const focusController = require('../controllers/focusController');
const { focusValidationRules, sanitizeQuery } = require('../middleware/validationMiddleware');

// All routes require authentication
router.use(protect);

// Session management
router.post('/sessions/start', focusValidationRules.start, focusController.startSession);
router.get('/sessions/active', focusController.getActiveSession);
router.put('/sessions/:sessionId', focusValidationRules.update, focusController.updateSession);
router.post('/sessions/:sessionId/pause', focusValidationRules.update, focusController.pauseSession);
router.post('/sessions/:sessionId/resume', focusValidationRules.update, focusController.resumeSession);
router.post('/sessions/:sessionId/end', focusValidationRules.update, focusController.endSession);
router.post('/sessions/:sessionId/distraction', focusValidationRules.update, focusController.logDistraction);

// History and analytics
router.get('/sessions/history', sanitizeQuery, focusController.getSessionHistory);
router.get('/stats', sanitizeQuery, focusController.getFocusStats);
router.get('/pattern', focusController.getFocusPattern);
router.put('/preferences', focusController.updateFocusPreferences);

// Recommendations
router.get('/optimal-time', sanitizeQuery, focusController.getOptimalTimeForTask);

module.exports = router;