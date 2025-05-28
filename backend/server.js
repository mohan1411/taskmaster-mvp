// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const config = require('./config/config');
const { scheduleReminderJob } = require('./jobs/reminderJob');

// Optional dependencies
let helmet, morgan;
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

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use helmet if available
if (helmet) {
  app.use(helmet());
}

// Use morgan if available
if (morgan) {
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
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

// Start the server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running in ${config.env} mode on port ${PORT}`);
  
  // Schedule background jobs
  scheduleReminderJob();
});
