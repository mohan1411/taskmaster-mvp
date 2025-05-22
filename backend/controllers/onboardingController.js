/**
 * Onboarding Controller
 * 
 * Handles the onboarding experience for new users,
 * especially those with large email volumes
 */

const { 
  getOnboardingRecommendations, 
  getProcessingStrategy,
  EMAIL_VOLUME_THRESHOLD
} = require('../services/onboardingRecommendationService');

/**
 * Get personalized onboarding experience based on user's email volume
 * @route GET /api/onboarding/recommendations
 * @access Private
 */
const getOnboardingExperience = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get processing strategy
    const strategy = await getProcessingStrategy(userId);
    
    return res.status(200).json({
      showRecommendation: strategy.showRecommendation,
      message: strategy.message,
      emailCounts: strategy.emailCounts,
      processingOptions: strategy.processingOptions,
      emailVolumeThreshold: EMAIL_VOLUME_THRESHOLD
    });
  } catch (error) {
    console.error('Error getting onboarding experience:', error);
    return res.status(500).json({
      message: 'Error getting onboarding experience',
      error: error.message
    });
  }
};

/**
 * Start processing based on user's selected strategy
 * @route POST /api/onboarding/process
 * @access Private
 */
const startOnboardingProcessing = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      processingType,
      options
    } = req.body;
    
    let result;
    
    // Different processing based on type
    if (processingType === 'all') {
      // Process all emails - use batch processor
      const batchProcessingController = require('./batchProcessingController');
      result = await batchProcessingController.startBatchProcessing({
        ...req,
        body: {
          maxEmails: options.maxEmails || 1000,
          batchSize: options.batchSize || 10,
          concurrentBatches: options.concurrentBatches || 2
        }
      }, res);
      
    } else if (processingType === 'smart') {
      // Smart processing - use smart processor
      const smartProcessingController = require('./smartProcessingController');
      result = await smartProcessingController.smartProcess({
        ...req,
        body: options
      }, res);
      
    } else {
      return res.status(400).json({
        message: 'Invalid processing type'
      });
    }
    
    // Controller already sent response
    return result;
    
  } catch (error) {
    console.error('Error starting onboarding processing:', error);
    return res.status(500).json({
      message: 'Error starting onboarding processing',
      error: error.message
    });
  }
};

module.exports = {
  getOnboardingExperience,
  startOnboardingProcessing
};
