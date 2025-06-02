// Email sync diagnostic script for MVP-Development
const mongoose = require('mongoose');
const config = require('../config/config');
const Email = require('../models/emailModel');
const Settings = require('../models/settingsModel');

console.log('=== MVP-Development Email Sync Diagnostic ===');

const runDiagnostic = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.mongoUri);
    console.log('✓ Database connected');

    // Check for any users with emails
    const emailCount = await Email.countDocuments();
    console.log(`📧 Total emails in database: ${emailCount}`);

    // Check for users with Google integration
    const usersWithGoogle = await Settings.find({
      'integrations.google.connected': true
    });
    console.log(`👥 Users with Google integration: ${usersWithGoogle.length}`);

    // For each user, check their email sync status
    for (const userSettings of usersWithGoogle) {
      console.log(`\n--- User: ${userSettings.user} ---`);
      
      const userEmails = await Email.find({ user: userSettings.user });
      console.log(`📨 Emails synced: ${userEmails.length}`);
      
      if (userEmails.length > 0) {
        const latestEmail = userEmails.sort((a, b) => b.receivedAt - a.receivedAt)[0];
        console.log(`📅 Latest email: ${latestEmail.receivedAt}`);
        console.log(`📝 Subject: ${latestEmail.subject}`);
      }
      
      // Check token status
      const tokenInfo = userSettings.integrations.google.tokenInfo;
      console.log(`🔑 Access token: ${tokenInfo.accessToken ? 'Present' : 'Missing'}`);
      console.log(`🔄 Refresh token: ${tokenInfo.refreshToken ? 'Present' : 'Missing'}`);
      console.log(`⏰ Token expires: ${tokenInfo.expiryDate}`);
      
      const now = new Date();
      const isExpired = now > new Date(tokenInfo.expiryDate);
      console.log(`⚠️  Token expired: ${isExpired ? 'YES' : 'NO'}`);
    }

    console.log('\n=== OAuth Configuration ===');
    console.log(`Google Client ID: ${config.googleClientId}`);
    console.log(`Google Callback URL: ${config.googleCallbackUrl}`);

    console.log('\n=== Recommendations ===');
    if (emailCount === 0) {
      console.log('❌ No emails found in database');
      console.log('💡 Try running email sync manually');
    }
    
    if (usersWithGoogle.length === 0) {
      console.log('❌ No users with Google integration');
      console.log('💡 Reconnect Gmail integration');
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

runDiagnostic();
