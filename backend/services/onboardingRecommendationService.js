/**
 * Onboarding Recommendation Service
 * 
 * This service determines when to show smart processing recommendations
 * based on user's email volume and application state.
 */

const Email = require('../models/emailModel');
const User = require('../models/userModel');

// Thresholds for recommendations
const EMAIL_VOLUME_THRESHOLD = 500; // Show recommendations for users with >500 emails
const RECENT_EMAIL_THRESHOLD = 100; // Consider last 30 days "manageable" if <100 emails
const MAX_AUTO_PROCESS = 200; // Maximum emails to auto-process without asking

/**
 * Get onboarding recommendations for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Recommendation object
 */
const getOnboardingRecommendations = async (userId) => {
  try {
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get email counts
    const totalEmails = await Email.countDocuments({ user: userId });
    
    // Get counts for different time periods
    const now = new Date();
    const last30Days = new Date(now.setDate(now.getDate() - 30));
    const last90Days = new Date(now.setDate(now.getDate() - 60)); // already subtracted 30
    const last365Days = new Date(now.setDate(now.getDate() - 275)); // already subtracted 90
    
    const emailCounts = {
      total: totalEmails,
      last30Days: await Email.countDocuments({ 
        user: userId, 
        date: { $gte: last30Days } 
      }),
      last90Days: await Email.countDocuments({ 
        user: userId, 
        date: { $gte: last90Days } 
      }),
      last365Days: await Email.countDocuments({ 
        user: userId, 
        date: { $gte: last365Days } 
      }),
      unprocessed: await Email.countDocuments({ 
        user: userId, 
        processed: false 
      })
    };
    
    // Determine if we should show smart processing recommendation
    const showSmartProcessing = emailCounts.total > EMAIL_VOLUME_THRESHOLD;
    
    // Determine recommended processing approach
    let recommendedApproach;
    let recommendedTimeframe;
    
    if (emailCounts.last30Days < RECENT_EMAIL_THRESHOLD) {
      // If recent emails are manageable, process all of them
      recommendedApproach = 'recent';
      recommendedTimeframe = 30;
    } else if (emailCounts.last30Days < MAX_AUTO_PROCESS) {
      // If recent emails are many but under max threshold, still process them all
      recommendedApproach = 'recent';
      recommendedTimeframe = 30;
    } else if (emailCounts.last90Days < MAX_AUTO_PROCESS) {
      // Try 90 days if it's under max threshold
      recommendedApproach = 'selective';
      recommendedTimeframe = 90;
    } else {
      // Otherwise recommend highly selective approach
      recommendedApproach = 'selective';
      recommendedTimeframe = 30;
    }
    
    // Get top senders for selective processing
    const topSenders = await Email.aggregate([
      { $match: { user: userId } },
      { $group: { _id: "$from", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).exec();
    
    return {
      counts: emailCounts,
      showSmartProcessing,
      recommendation: {
        approach: recommendedApproach,
        timeframe: recommendedTimeframe,
        message: getRecommendationMessage(emailCounts, recommendedApproach, recommendedTimeframe),
        topSenders: topSenders.map(s => ({ email: s._id, count: s.count }))
      }
    };
  } catch (error) {
    console.error('Error getting onboarding recommendations:', error);
    throw error;
  }
};

/**
 * Generate recommendation message based on email volume
 * @param {Object} counts - Email counts
 * @param {string} approach - Recommended approach
 * @param {number} timeframe - Recommended timeframe
 * @returns {string} - Recommendation message
 */
const getRecommendationMessage = (counts, approach, timeframe) => {
  if (counts.total <= EMAIL_VOLUME_THRESHOLD) {
    return `Your email volume is manageable. We'll process all ${counts.total} emails for you.`;
  }
  
  if (approach === 'recent') {
    return `You have ${counts.total} emails. We recommend processing your last ${timeframe} days of emails (${counts['last'+timeframe+'Days']} emails) to get you started.`;
  }
  
  if (approach === 'selective') {
    return `You have ${counts.total} emails. We recommend being selective and processing only your last ${timeframe} days of emails from important senders (approximately ${Math.round(counts['last'+timeframe+'Days'] * 0.3)} emails).`;
  }
  
  return `You have ${counts.total} emails. Let's start by focusing on your most recent and relevant emails.`;
};

/**
 * Get processing strategy for a new user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Processing strategy
 */
const getProcessingStrategy = async (userId) => {
  const recommendations = await getOnboardingRecommendations(userId);
  
  // Default processing options
  const processingOptions = {
    // Time range
    lastDays: recommendations.recommendation.timeframe,
    
    // If selective, include these options
    useSelectiveProcessing: recommendations.recommendation.approach === 'selective',
    suggestedSenders: recommendations.recommendation.topSenders.slice(0, 3).map(s => s.email),
    
    // Common work-related keywords
    suggestedKeywords: ['urgent', 'action', 'deadline', 'required', 'task', 'meeting'],
    
    // Processing limits
    maxEmails: Math.min(recommendations.counts[`last${recommendations.recommendation.timeframe}Days`], MAX_AUTO_PROCESS),
    batchSize: 10
  };
  
  return {
    showRecommendation: recommendations.showSmartProcessing,
    message: recommendations.recommendation.message,
    emailCounts: recommendations.counts,
    processingOptions
  };
};

module.exports = {
  getOnboardingRecommendations,
  getProcessingStrategy,
  EMAIL_VOLUME_THRESHOLD
};
