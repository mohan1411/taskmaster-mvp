/**
 * Selective Reset Script for Tasks and Follow-ups
 * 
 * This script:
 * 1. Allows selective deletion of tasks or follow-ups
 * 2. Provides options for resetting flags on emails
 * 3. Includes safeguards against accidental deletion
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Task = require('./models/taskModel');
const Email = require('./models/emailModel');
const Followup = require('./models/followupModel');
const User = require('./models/userModel');

// Connect to the database
connectDB();

// Get command line arguments
const args = process.argv.slice(2);
const options = {
  resetTasks: args.includes('--tasks') || args.includes('-t'),
  resetFollowups: args.includes('--followups') || args.includes('-f'),
  resetEmailFlags: args.includes('--reset-flags') || args.includes('-r'),
  showHelp: args.includes('--help') || args.includes('-h'),
  userId: null
};

// Extract user ID if provided
const userIdArg = args.find(arg => arg.startsWith('--user=') || arg.startsWith('-u='));
if (userIdArg) {
  options.userId = userIdArg.split('=')[1];
}

// Show help text
if (options.showHelp) {
  console.log(`
=== TaskMaster Selective Reset Tool ===

Usage: node selective-reset.js [options]

Options:
  -t, --tasks          Delete all tasks
  -f, --followups      Delete all follow-ups
  -r, --reset-flags    Reset taskExtracted and needsFollowUp flags on emails
  -u=ID, --user=ID     Only process for specific user ID
  -h, --help           Show this help text

Examples:
  node selective-reset.js --tasks              # Delete all tasks for all users
  node selective-reset.js -f -r                # Delete all follow-ups and reset flags
  node selective-reset.js --tasks --user=123   # Delete tasks only for user with ID 123
  `);
  
  mongoose.connection.close();
  process.exit(0);
}

// Validate arguments
if (!options.resetTasks && !options.resetFollowups && !options.resetEmailFlags) {
  console.error('No action specified. Use --tasks, --followups, or --reset-flags to specify what to reset.');
  console.error('Use --help to see all options.');
  mongoose.connection.close();
  process.exit(1);
}

/**
 * Main selective reset function
 */
const selectiveReset = async () => {
  try {
    console.log('=== SELECTIVE RESET TOOL ===');
    console.log('Options:', options);
    
    // Find users to process
    let users = [];
    if (options.userId) {
      if (!mongoose.Types.ObjectId.isValid(options.userId)) {
        console.error(`Invalid user ID format: ${options.userId}`);
        return;
      }
      
      const user = await User.findById(options.userId);
      if (!user) {
        console.error(`User not found with ID: ${options.userId}`);
        return;
      }
      users = [user];
    } else {
      users = await User.find({});
    }
    
    console.log(`Found ${users.length} users to process`);
    
    let totalTasksRemoved = 0;
    let totalFollowupsRemoved = 0;
    let totalEmailsReset = 0;
    
    // Process each user
    for (const user of users) {
      console.log(`\nProcessing user: ${user.name} (${user.email})`);
      
      // Step 1: Process tasks if requested
      if (options.resetTasks) {
        const taskCount = await Task.countDocuments({ user: user._id });
        console.log(`Found ${taskCount} tasks for this user`);
        
        if (taskCount > 0) {
          await Task.deleteMany({ user: user._id });
          console.log(`Deleted all ${taskCount} tasks`);
          totalTasksRemoved += taskCount;
        }
      }
      
      // Step 2: Process follow-ups if requested
      if (options.resetFollowups) {
        const followupCount = await Followup.countDocuments({ user: user._id });
        console.log(`Found ${followupCount} follow-ups for this user`);
        
        if (followupCount > 0) {
          await Followup.deleteMany({ user: user._id });
          console.log(`Deleted all ${followupCount} follow-ups`);
          totalFollowupsRemoved += followupCount;
        }
      }
      
      // Step 3: Reset email flags if requested
      if (options.resetEmailFlags) {
        const query = { user: user._id };
        
        if (options.resetTasks && !options.resetFollowups) {
          // Only reset taskExtracted if only resetting tasks
          query.taskExtracted = true;
        } else if (!options.resetTasks && options.resetFollowups) {
          // Only reset needsFollowUp if only resetting follow-ups
          query.needsFollowUp = true;
        } else {
          // Reset both flags if resetting both or explicitly requested
          query.$or = [
            { taskExtracted: true },
            { needsFollowUp: true }
          ];
        }
        
        const emailsToReset = await Email.countDocuments(query);
        
        if (emailsToReset > 0) {
          const updateFields = {};
          
          if (options.resetTasks || options.resetEmailFlags) {
            updateFields.taskExtracted = false;
          }
          
          if (options.resetFollowups || options.resetEmailFlags) {
            updateFields.needsFollowUp = false;
            updateFields.followUpDueDate = null;
          }
          
          await Email.updateMany(query, { $set: updateFields });
          
          console.log(`Reset flags on ${emailsToReset} emails`);
          totalEmailsReset += emailsToReset;
        }
      }
    }
    
    console.log('\n=== RESET SUMMARY ===');
    if (options.resetTasks) {
      console.log(`Total tasks removed: ${totalTasksRemoved}`);
    }
    if (options.resetFollowups) {
      console.log(`Total follow-ups removed: ${totalFollowupsRemoved}`);
    }
    if (options.resetEmailFlags) {
      console.log(`Total emails reset: ${totalEmailsReset}`);
    }
    
  } catch (error) {
    console.error('Error during selective reset process:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
};

// Run the selective reset function
selectiveReset();
