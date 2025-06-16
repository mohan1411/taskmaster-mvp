// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const config = require('./config/config');
const { scheduleReminderJob } = require('./jobs/reminderJob');
const { apiLimiter } = require('./middleware/rateLimitMiddleware');

// Security dependencies
let helmet, morgan, mongoSanitize, xss, hpp;
try {
  helmet = require('helmet');
  console.log('Helmet loaded successfully');
} catch (err) {
  console.warn('Helmet not available, security headers will not be set');
}

try {
  morgan = require('morgan');
  console.log('Morgan loaded successfully');
} catch (err) {
  console.warn('Morgan not available, HTTP logging will be disabled');
}

try {
  mongoSanitize = require('express-mongo-sanitize');
  xss = require('xss');
  hpp = require('hpp');
  console.log('Security middleware loaded successfully');
} catch (err) {
  console.warn('Some security middleware not available');
}

// Initialize Express app
const app = express();

// Trust proxy - Configure for Railway
// Railway uses specific proxy headers
app.set('trust proxy', 1); // Trust first proxy

// Connect to MongoDB
connectDB();

// Temporarily disable rate limiting to debug auth issues
// TODO: Re-enable after fixing Railway proxy configuration
// if (process.env.NODE_ENV === 'production') {
//   app.use(apiLimiter);
// }

// Body parser middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
if (mongoSanitize) {
  app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Blocked MongoDB operator in ${key}`);
    }
  }));
}

if (hpp) {
  app.use(hpp());
}

// CORS configuration for fizztask.com
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed origins
    if (config.allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Serve static files from uploads directory with security
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.set('X-Content-Type-Options', 'nosniff');
  }
}));

// Use helmet if available with custom configuration
if (helmet) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.openai.com"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));
}

// Use morgan if available
if (morgan && process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Initialize routes
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const emailRoutes = require('./routes/emailRoutes');
const followupRoutes = require('./routes/followupRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const testRoutes = require('./routes/testRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const unifiedEmailRoutes = require('./routes/unifiedEmailRoutes');
const focusRoutes = require('./routes/focusRoutes');
// const documentRoutes = require('./routes/documentRoutes'); // Temporarily disabled - missing dependencies

// Define API routes
app.use('/api/auth', userRoutes);
app.use('/api/users', userRoutes); // Add users route for avatar uploads
app.use('/api/tasks', taskRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/test', testRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/unified-email', unifiedEmailRoutes);
app.use('/api/focus', focusRoutes);
// app.use('/api/documents', documentRoutes); // Temporarily disabled - missing dependencies

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // First try to serve from backend/public (Railway build)
  const publicPath = path.join(__dirname, 'public');
  const frontendBuildPath = path.join(__dirname, '../frontend/build');
  
  // Check which directory exists and use it
  const fs = require('fs');
  if (fs.existsSync(publicPath) && fs.existsSync(path.join(publicPath, 'index.html'))) {
    console.log('Serving static files from:', publicPath);
    app.use(express.static(publicPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(publicPath, 'index.html'));
    });
  } else if (fs.existsSync(frontendBuildPath) && fs.existsSync(path.join(frontendBuildPath, 'index.html'))) {
    console.log('Serving static files from:', frontendBuildPath);
    app.use(express.static(frontendBuildPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(frontendBuildPath, 'index.html'));
    });
  } else {
    console.error('No static files found to serve!');
    app.get('*', (req, res) => {
      res.status(404).send('Frontend build not found. Please build the React app.');
    });
  }
}

// Start the server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running in ${config.env} mode on port ${PORT}`);
  
  // Schedule background jobs
  scheduleReminderJob();
});
