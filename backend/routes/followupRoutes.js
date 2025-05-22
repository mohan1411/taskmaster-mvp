// routes/followupRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getFollowUps,
  getFollowUpById,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  checkDueFollowUps,
  getFollowUpAnalytics
} = require('../controllers/followupController');

// Protect all routes
router.use(protect);

// GET /api/followups - Get all follow-ups for user with filtering
router.get('/', getFollowUps);

// GET /api/followups/check-due - Check for due follow-ups
router.get('/check-due', checkDueFollowUps);

// GET /api/followups/analytics - Get follow-up analytics
router.get('/analytics', getFollowUpAnalytics);

// GET /api/followups/:id - Get a specific follow-up
router.get('/:id', getFollowUpById);

// POST /api/followups - Create a new follow-up
router.post('/', createFollowUp);

// PUT /api/followups/:id - Update a follow-up
router.put('/:id', updateFollowUp);

// DELETE /api/followups/:id - Delete a follow-up
router.delete('/:id', deleteFollowUp);

module.exports = router;