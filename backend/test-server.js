// Simple test script to check if the server can start
// This skips the dependencies that might be causing issues

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const config = require('./config/config');

// Initialize Express app
const app = express();

// Connect to MongoDB
// connectDB(); // Commented out to avoid DB connection

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test server is running' });
});

// Start the server
const PORT = config.port || 5000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
