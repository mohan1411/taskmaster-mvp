/**
 * Onboarding Routes
 * 
 * Routes for user onboarding experience, especially
 * for new users with large email volumes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getOnboardingExperience,
  startOnboardingProcessing
} = require('../controllers/onboardingController');

// Get personalized onboarding recommendations
router.get('/recommendations', protect, getOnboardingExperience);

// Start processing based on user's selected strategy
router.post('/process', protect, startOnboardingProcessing);

module.exports = router;
