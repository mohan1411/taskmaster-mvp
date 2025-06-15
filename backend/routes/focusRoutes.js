const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const focusController = require('../controllers/focusController');

// All routes require authentication
router.use(protect);

// Session management
router.post('/sessions/start', focusController.startSession);
router.get('/sessions/active', focusController.getActiveSession);
router.put('/sessions/:sessionId', focusController.updateSession);
router.post('/sessions/:sessionId/pause', focusController.pauseSession);
router.post('/sessions/:sessionId/resume', focusController.resumeSession);
router.post('/sessions/:sessionId/end', focusController.endSession);
router.post('/sessions/:sessionId/distraction', focusController.logDistraction);

// History and analytics
router.get('/sessions/history', focusController.getSessionHistory);
router.get('/stats', focusController.getFocusStats);
router.get('/pattern', focusController.getFocusPattern);
router.put('/preferences', focusController.updateFocusPreferences);

// Recommendations
router.get('/optimal-time', focusController.getOptimalTimeForTask);

module.exports = router;