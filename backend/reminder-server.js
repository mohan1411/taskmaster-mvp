// Ultra-minimal server.js - only for follow-up reminders
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const config = require('./config/config');
const { scheduleReminderJob } = require('./jobs/reminderJob');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Define routes
const followupRoutes = require('./routes/followupRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Define API routes
app.use('/api/followups', followupRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Follow-up Reminders API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error handler:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Start the server
const PORT = 8001; // Use a different port
app.listen(PORT, () => {
  console.log(`Follow-up Reminders API running on port ${PORT}`);
  
  // Schedule reminder job
  try {
    scheduleReminderJob();
    console.log('Reminder job scheduled successfully');
  } catch (error) {
    console.error('Failed to schedule reminder job:', error);
  }
});
