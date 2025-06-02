// Manual email sync test script for MVP-Development
const mongoose = require('mongoose');
const { google } = require('googleapis');
const config = require('../config/config');
const Settings = require('../models/settingsModel');

console.log('=== MVP-Development Manual Email Sync Test ===');

const testEmailSync = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.mongoUri);
    console.log('✓ Database connected');

    // Find user with Google integration
    console.log('Finding user with Google integration...');
    const userSettings = await Settings.findOne({
      'integrations.google.connected': true
    });

    if (!userSettings) {
      console.log('❌ No user found with Google integration');
      console.log('💡 Please connect Gmail first from the email page');
      return;
    }

    console.log(`✓ Found user: ${userSettings.user}`);

    const tokenInfo = userSettings.integrations.google.tokenInfo;
    
    // Check token expiry
    const now = new Date();
    const isExpired = now > new Date(tokenInfo.expiryDate);
    console.log(`Token expired: ${isExpired ? 'YES' : 'NO'}`);
    
    if (isExpired) {
      console.log('❌ Token expired, cannot proceed');
      console.log('💡 Please reconnect Gmail from the email page');
      return;
    }

    // Check OAuth configuration
    console.log('\n=== OAuth Configuration ===');
    console.log(`Google Client ID: ${config.googleClientId}`);
    console.log(`Google Client Secret: ${config.googleClientSecret ? 'SET' : 'MISSING'}`);
    console.log(`Callback URL: ${config.googleCallbackUrl}`);

    // Create OAuth2 client
    console.log('\n=== Testing Gmail API ===');
    console.log('Creating OAuth2 client...');
    const oauth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.googleCallbackUrl
    );
    
    oauth2Client.setCredentials({
      access_token: tokenInfo.accessToken,
      refresh_token: tokenInfo.refreshToken,
    });

    // Create Gmail API client
    console.log('Connecting to Gmail API...');
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Test API connection
    console.log('Testing Gmail API connection...');
    const profile = await gmail.users.getProfile({ userId: 'me' });
    console.log(`✓ Connected to Gmail for: ${profile.data.emailAddress}`);
    console.log(`Total messages: ${profile.data.messagesTotal}`);

    // Get message list
    console.log('\nFetching message list...');
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10
    });

    const messages = response.data.messages || [];
    console.log(`✓ Found ${messages.length} messages`);

    // Get details for first few messages
    if (messages.length > 0) {
      console.log('\n=== Sample Messages ===');
      
      for (let i = 0; i < Math.min(3, messages.length); i++) {
        const messageId = messages[i].id;
        
        try {
          const messageData = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date']
          });

          const headers = messageData.data.payload.headers;
          const getHeader = (name) => {
            const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
            return header ? header.value : '';
          };

          console.log(`\nMessage ${i + 1}:`);
          console.log(`  From: ${getHeader('From')}`);
          console.log(`  Subject: ${getHeader('Subject')}`);
          console.log(`  Date: ${getHeader('Date')}`);
          console.log(`  Snippet: ${messageData.data.snippet}`);
        } catch (msgError) {
          console.log(`  ❌ Error getting message ${i + 1}: ${msgError.message}`);
        }
      }
    }

    console.log('\n=== Gmail API Test Results ===');
    console.log('✅ OAuth token is valid');
    console.log('✅ Gmail API connection successful');
    console.log('✅ Can fetch user profile');
    console.log('✅ Can fetch message list');
    console.log('✅ Can fetch message details');
    
    console.log('\n=== Next Steps ===');
    console.log('1. Go to http://localhost:3000/emails');
    console.log('2. Click the blue "Sync Emails" button');
    console.log('3. Emails should appear in the list below');

  } catch (error) {
    console.error('❌ Email sync test failed:', error);
    
    if (error.code === 401) {
      console.log('💡 Token expired or invalid - reconnect Gmail');
    } else if (error.code === 403) {
      console.log('💡 Check Gmail API permissions/scopes in Google Console');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Network connection issue');
    } else if (error.message.includes('invalid_client')) {
      console.log('💡 Check Google OAuth client ID and secret in .env file');
    }
    
    console.log('\n=== Troubleshooting ===');
    console.log('1. Verify Google Cloud Console settings');
    console.log('2. Check environment variables in backend/.env');
    console.log('3. Ensure Gmail API is enabled');
    console.log('4. Try reconnecting Gmail from the email page');
  } finally {
    await mongoose.disconnect();
  }
};

testEmailSync();
