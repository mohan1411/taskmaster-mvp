// Script to delete all tasks and follow-ups from the database
const mongoose = require('mongoose');
require('dotenv').config();

// Define database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};

// Main deletion function
const deleteAll = async () => {
  // Connect to database
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  try {
    // Define models directly in the script to avoid import issues
    const TaskSchema = new mongoose.Schema({}, { strict: false });
    const FollowupSchema = new mongoose.Schema({}, { strict: false });
    const EmailSchema = new mongoose.Schema({}, { strict: false });
    
    const Task = mongoose.model('Task', TaskSchema);
    const Followup = mongoose.model('Followup', FollowupSchema);
    const Email = mongoose.model('Email', EmailSchema);
    
    // Count items before deletion
    const taskCountBefore = await Task.countDocuments({});
    const followupCountBefore = await Followup.countDocuments({});
    const emailCountBefore = await Email.countDocuments({});
    
    console.log(`Before deletion:`);
    console.log(`- Tasks: ${taskCountBefore}`);
    console.log(`- Follow-ups: ${followupCountBefore}`);
    console.log(`- Emails: ${emailCountBefore}`);
    
    // Delete all tasks
    console.log(`\nDeleting all tasks...`);
    const taskResult = await Task.deleteMany({});
    console.log(`Deleted ${taskResult.deletedCount} tasks`);
    
    // Delete all follow-ups
    console.log(`Deleting all follow-ups...`);
    const followupResult = await Followup.deleteMany({});
    console.log(`Deleted ${followupResult.deletedCount} follow-ups`);
    
    // Reset email processed flags
    console.log(`Resetting email 'processed' flags...`);
    const emailResult = await Email.updateMany(
      {}, 
      { $set: { processed: false, tasks: [], followups: [] } }
    );
    console.log(`Reset ${emailResult.modifiedCount} emails`);
    
    // Verify deletion
    const taskCountAfter = await Task.countDocuments({});
    const followupCountAfter = await Followup.countDocuments({});
    const unprocessedEmails = await Email.countDocuments({ processed: false });
    
    console.log(`\nAfter deletion:`);
    console.log(`- Tasks: ${taskCountAfter}`);
    console.log(`- Follow-ups: ${followupCountAfter}`);
    console.log(`- Unprocessed emails: ${unprocessedEmails}`);
    
    console.log(`\nDatabase reset complete!`);
    
  } catch (error) {
    console.error('Error during deletion:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the deletion function
deleteAll();
