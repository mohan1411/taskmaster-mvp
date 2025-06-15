// Production-specific configuration
module.exports = {
  // Security headers
  security: {
    // Force HTTPS in production
    forceHTTPS: true,
    
    // Session configuration
    session: {
      secure: true, // Cookies only over HTTPS
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    
    // CORS whitelist for production
    corsOrigins: [
      'https://fizztask.com',
      'https://www.fizztask.com',
      'https://app.fizztask.com'
    ],
    
    // Rate limiting multipliers for production (stricter than development)
    rateLimitMultiplier: 0.5, // Half the rate limits of development
    
    // Content Security Policy
    csp: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "https://www.googletagmanager.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://api.openai.com", "https://www.googleapis.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: true
    }
  },
  
  // Logging configuration
  logging: {
    level: 'error', // Only log errors in production
    format: 'json', // JSON format for log aggregation
    includeStackTrace: false
  },
  
  // Database configuration
  database: {
    // Connection pool settings for production
    poolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    
    // Indexes to ensure are created
    ensureIndexes: true,
    
    // Read preference for better performance
    readPreference: 'secondaryPreferred'
  },
  
  // Email configuration
  email: {
    // Rate limits for production
    maxEmailsPerHour: 100,
    maxEmailsPerDay: 1000,
    
    // Queue settings
    queueConcurrency: 5,
    retryAttempts: 3,
    retryDelay: 60000 // 1 minute
  },
  
  // File upload configuration
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    
    // Virus scanning (if available)
    scanForViruses: true
  },
  
  // API configuration
  api: {
    // API versioning
    version: 'v1',
    
    // Response compression
    enableCompression: true,
    
    // Response caching
    cacheControl: {
      public: 3600, // 1 hour for public resources
      private: 0 // No caching for private data
    }
  },
  
  // Performance optimizations
  performance: {
    // Enable clustering
    clustering: true,
    workers: 'auto', // Use number of CPU cores
    
    // Memory limits
    maxMemoryUsage: '1GB',
    
    // Request timeouts
    requestTimeout: 30000, // 30 seconds
    
    // Database query timeout
    queryTimeout: 10000 // 10 seconds
  },
  
  // Monitoring and alerting
  monitoring: {
    enabled: true,
    
    // Health check endpoint
    healthCheckPath: '/health',
    
    // Metrics collection
    collectMetrics: true,
    metricsInterval: 60000, // 1 minute
    
    // Error tracking
    errorTracking: {
      enabled: true,
      sampleRate: 1.0 // Track all errors in production
    }
  },
  
  // Feature flags
  features: {
    // Disable debug endpoints
    debugEndpoints: false,
    
    // Enable production optimizations
    caching: true,
    compression: true,
    
    // Security features
    auditLogging: true,
    encryptSensitiveData: true
  }
};