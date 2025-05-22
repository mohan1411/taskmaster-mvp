/**
 * Advanced Followup Debugging Tool
 * 
 * This script:
 * 1. Directly connects to your MongoDB database
 * 2. Finds all follow-ups and groups them by emailId
 * 3. Identifies duplicates and provides detailed information
 * 4. Helps track down the exact cause of duplicate follow-ups
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB models (defined inline to avoid dependencies)
const followupSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  emailId: String,
  threadId: String,
  subject: String,
  contactName: String,
  contactEmail: String,
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'ignored'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: Date,
  completedAt: Date,
  notes: String,
  reason: String,
  keyPoints: [String],
  completionNotes: String,
  relatedTasks: [String],
  aiGenerated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const emailSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  messageId: {
    type: String,
    required: true
  },
  threadId: {
    type: String,
    required: true
  },
  sender: {
    name: String,
    email: String
  },
  recipients: [{
    name: String,
    email: String,
    type: {
      type: String,
      enum: ['to', 'cc', 'bcc']
    }
  }],
  subject: {
    type: String,
    trim: true
  },
  snippet: {
    type: String
  },
  hasAttachments: {
    type: Boolean,
    default: false
  },
  labels: [String],
  receivedAt: {
    type: Date
  },
  isRead: {
    type: Boolean,
    default: false
  },
  taskExtracted: {
    type: Boolean,
    default: false
  },
  needsFollowUp: {
    type: Boolean,
    default: false
  },
  followUpDueDate: {
    type: Date
  }
}, {
  timestamps: true
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Define log file
const logFile = path.join(__dirname, 'followup-debug.log');

// Clear log file
fs.writeFileSync(logFile, '');

// Logger function
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // Log to console
  console.log(message);
  
  // Log to file
  fs.appendFileSync(logFile, logMessage);
};

// Main analysis function
const analyzeFollowups = async () => {
  try {
    log('=== FOLLOWUP DUPLICATION ANALYSIS ===');
    
    // Connect to MongoDB
    log(`Connecting to MongoDB: ${process.env.MONGODB_URI}`);
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    log('Connected to MongoDB');
    
    // Register models
    const Followup = mongoose.model('Followup', followupSchema);
    const Email = mongoose.model('Email', emailSchema);
    const User = mongoose.model('User', userSchema);
    
    // Get all users
    const users = await User.find({});
    log(`Found ${users.length} users`);
    
    for (const user of users) {
      log(`\nAnalyzing user: ${user.name} (${user.email})`);
      
      // Get all followups for this user
      const followups = await Followup.find({ user: user._id }).sort({ createdAt: 1 });
      log(`Total followups for user: ${followups.length}`);
      
      // Group followups by emailId
      const followupsByEmailId = {};
      
      for (const followup of followups) {
        if (!followup.emailId) {
          log(`WARNING: Found followup without emailId: ${followup._id}`);
          continue;
        }
        
        if (!followupsByEmailId[followup.emailId]) {
          followupsByEmailId[followup.emailId] = [];
        }
        
        followupsByEmailId[followup.emailId].push(followup);
      }
      
      // Analyze followups by emailId
      log(`\nAnalyzing followups by emailId for user ${user.name}:`);
      
      let duplicateEmailIds = 0;
      let totalDuplicates = 0;
      
      for (const [emailId, emailFollowups] of Object.entries(followupsByEmailId)) {
        if (emailFollowups.length > 1) {
          duplicateEmailIds++;
          totalDuplicates += emailFollowups.length - 1;
          
          log(`\nFound ${emailFollowups.length} followups for email ID: ${emailId}`);
          
          // Get email details
          const email = await Email.findOne({ messageId: emailId, user: user._id });
          if (email) {
            log(`  Email subject: "${email.subject}"`);
            log(`  From: ${email.sender.name} <${email.sender.email}>`);
            log(`  Received: ${email.receivedAt}`);
          } else {
            log(`  WARNING: Original email not found in database!`);
          }
          
          // Compare duplicate followups
          log(`  Followup details:`);
          
          emailFollowups.forEach((followup, index) => {
            log(`  [${index + 1}] ID: ${followup._id}`);
            log(`      Created: ${followup.createdAt}`);
            log(`      Status: ${followup.status}`);
            log(`      Due Date: ${followup.dueDate}`);
            log(`      AI Generated: ${followup.aiGenerated ? 'Yes' : 'No'}`);
            
            // Compare with previous followup if not the first one
            if (index > 0) {
              const prev = emailFollowups[index - 1];
              const timeDiff = followup.createdAt - prev.createdAt;
              const timeDiffMinutes = Math.floor(timeDiff / (1000 * 60));
              log(`      Time since previous: ${timeDiffMinutes} minutes`);
              
              // Check if any fields are different
              const differences = [];
              if (followup.subject !== prev.subject) differences.push('subject');
              if (followup.status !== prev.status) differences.push('status');
              if (followup.priority !== prev.priority) differences.push('priority');
              if (followup.dueDate.toString() !== prev.dueDate.toString()) differences.push('dueDate');
              if (followup.notes !== prev.notes) differences.push('notes');
              if (followup.aiGenerated !== prev.aiGenerated) differences.push('aiGenerated');
              
              if (differences.length > 0) {
                log(`      Differences from previous: ${differences.join(', ')}`);
              } else {
                log(`      IDENTICAL to previous followup!`);
              }
            }
          });
        }
      }
      
      log(`\nSummary for user ${user.name}:`);
      log(`  Total followups: ${followups.length}`);
      log(`  Emails with duplicate followups: ${duplicateEmailIds}`);
      log(`  Total duplicate followups: ${totalDuplicates}`);
    }
    
    log('\n=== ANALYSIS COMPLETE ===');
    log(`Full results saved to: ${logFile}`);
    
  } catch (error) {
    log(`ERROR: ${error.message}`);
    log(error.stack);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    log('Database connection closed');
  }
};

// Run the analysis
analyzeFollowups().then(() => {
  console.log('Analysis complete!');
  process.exit(0);
}).catch(err => {
  console.error('Error during analysis:', err);
  process.exit(1);
});
