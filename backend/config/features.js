/**
 * Feature flags configuration
 * Controls which features are enabled based on environment
 */

const features = {
  // Development/Testing features
  enableDebugLogging: process.env.NODE_ENV !== 'production' || process.env.DEBUG_MODE === 'true',
  enableTestEndpoints: process.env.NODE_ENV === 'development',
  enableDetailedErrors: process.env.NODE_ENV !== 'production',
  
  // Document processing features
  enableDocumentBodyStorage: process.env.ENABLE_DOC_BODY === 'true',
  enableAITaskExtraction: process.env.ENABLE_AI_EXTRACTION !== 'false', // Default on
  documentParserMode: process.env.DOCUMENT_PARSER_MODE || 'simple-only',
  
  // Email features
  enableEmailBodyStorage: process.env.NODE_ENV !== 'production' && process.env.STORE_EMAIL_BODY === 'true',
  enableEmailAttachmentProcessing: true, // Always enabled
  maxEmailSyncCount: process.env.NODE_ENV === 'production' ? 50 : 10,
  
  // Performance features
  enableCaching: process.env.NODE_ENV === 'production',
  enableRateLimiting: process.env.NODE_ENV === 'production',
  
  // Security features
  enableCORS: true,
  corsOrigins: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:3000', 'http://localhost:3001'],
  
  // Database features
  enableSoftDeletes: true,
  enableDatabaseLogging: process.env.NODE_ENV !== 'production' && process.env.DB_LOGGING === 'true',
  
  // Task processing
  enableBatchTaskCreation: true,
  maxBatchSize: process.env.NODE_ENV === 'production' ? 100 : 20,
  
  // Analytics
  enableAnalytics: process.env.NODE_ENV === 'production',
  enableUserTracking: process.env.NODE_ENV === 'production' && process.env.ENABLE_TRACKING === 'true'
};

/**
 * Get feature flag value
 * @param {string} featureName 
 * @returns {any} Feature value or undefined
 */
function getFeature(featureName) {
  return features[featureName];
}

/**
 * Check if feature is enabled
 * @param {string} featureName 
 * @returns {boolean}
 */
function isEnabled(featureName) {
  const value = features[featureName];
  return value === true || value === 'true';
}

/**
 * Override feature flags (for testing)
 * @param {object} overrides 
 */
function override(overrides) {
  if (process.env.NODE_ENV === 'test') {
    Object.assign(features, overrides);
  }
}

/**
 * Get all features for debugging
 * @returns {object}
 */
function getAllFeatures() {
  if (process.env.NODE_ENV !== 'production') {
    return { ...features };
  }
  return { message: 'Feature list not available in production' };
}

module.exports = {
  features,
  getFeature,
  isEnabled,
  override,
  getAllFeatures
};