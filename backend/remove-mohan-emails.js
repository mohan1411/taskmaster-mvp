const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/userModel');
const Email = require('./models/emailModel');

async function removeEmailsFromMohan() {
  try {
    console.log('🗑️  Removing emails from sender "Mohan"\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmaster', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Find the demo user
    const user = await User.findOne({ email: 'newuser@example.com' });
    
    if (!user) {
      console.log('❌ User newuser@example.com not found!');
      return;
    }
    
    console.log('✅ Found user:', user.email);
    console.log('   User ID:', user._id);
    
    // Find emails from Mohan for this user
    const mohanEmails = await Email.find({
      user: user._id,
      $or: [
        { 'sender.name': 'Mohan' },
        { 'sender.name': { $regex: /mohan/i } },
        { 'sender.email': { $regex: /mohan/i } }
      ]
    });
    
    console.log(`\n📧 Found ${mohanEmails.length} emails from Mohan`);
    
    if (mohanEmails.length > 0) {
      console.log('\nEmails to be removed:');
      mohanEmails.forEach((email, index) => {
        console.log(`${index + 1}. Subject: ${email.subject}`);
        console.log(`   From: ${email.sender?.name} <${email.sender?.email}>`);
        console.log(`   Date: ${email.receivedAt}`);
        console.log('   ---');
      });
      
      // Delete the emails
      const deleteResult = await Email.deleteMany({
        user: user._id,
        $or: [
          { 'sender.name': 'Mohan' },
          { 'sender.name': { $regex: /mohan/i } },
          { 'sender.email': { $regex: /mohan/i } }
        ]
      });
      
      console.log(`\n✅ Deleted ${deleteResult.deletedCount} emails from Mohan`);
    } else {
      console.log('\n✅ No emails from Mohan found - nothing to delete');
    }
    
    // Show remaining emails count
    const remainingEmails = await Email.countDocuments({ user: user._id });
    console.log(`\n📊 Remaining emails for user: ${remainingEmails}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

removeEmailsFromMohan();
