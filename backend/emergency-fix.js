/**
 * EMERGENCY FIX SCRIPT
 * This script modifies server.js to bypass OpenAI imports and temporarily disable AI features
 */

const fs = require('fs');
const path = require('path');

// Server.js path
const serverPath = path.join(__dirname, 'server.js');

// Read the server.js file
console.log('Reading server.js...');
const serverContent = fs.readFileSync(serverPath, 'utf8');

// Create a fixed version of server.js with OpenAI bypassed
const fixedContent = `// MODIFIED SERVER.JS WITH DISABLED OPENAI
// This is a temporary fix to allow the server to start

// Load environment variables first
require('dotenv').config();

// Global flag to disable AI features
global.AI_FEATURES_DISABLED = true;

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
app.use(cors());

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

// Skip loading test routes which contain OpenAI imports
// const testRoutes = require('./routes/testRoutes');

// Define API routes
app.use('/api/auth', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/notifications', notificationRoutes);

// Disable test routes temporarily
// app.use('/api/test', testRoutes);

// Add a simple test route that doesn't use OpenAI
app.get('/api/test/status', (req, res) => {
  res.json({
    success: true,
    message: 'API is running - AI features are temporarily disabled'
  });
});

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
  console.log(\`Server running in \${config.env} mode on port \${PORT}\`);
  console.log('WARNING: AI features are temporarily disabled to ensure server stability');
  
  // Schedule background jobs
  scheduleReminderJob();
});
`;

// Write the fixed server.js file
console.log('Writing fixed server.js...');
fs.writeFileSync(serverPath, fixedContent, 'utf8');

// Create a backup of the original file
fs.writeFileSync(`${serverPath}.backup`, serverContent, 'utf8');
console.log('Created backup of original server.js as server.js.backup');

console.log('FIXED! Server.js has been modified to disable OpenAI/AI features.');
console.log('You can now start the server with "npm start"');
console.log('Note: AI features like task extraction will be disabled until the OpenAI package issue is fixed.');
