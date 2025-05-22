/**
 * Gmail OAuth Connection Test Script
 * This script tests the Gmail OAuth integration to identify connection issues
 */

// Load environment variables
require('dotenv').config();

const { google } = require('googleapis');
const config = require('./config/config');

console.log('=== Gmail OAuth Connection Test ===');
console.log('\nChecking configuration:');
console.log('Google Client ID:', config.googleClientId ? 'Available' : 'Missing');
console.log('Google Client Secret:', config.googleClientSecret ? 'Available' : 'Missing');
console.log('Google Callback URL:', config.googleCallbackUrl);

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  config.googleClientId,
  config.googleClientSecret,
  config.googleCallbackUrl
);

// Generate authorization URL
const scopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'  // Force consent screen to ensure refresh token
});

console.log('\nGenerated Auth URL:', authUrl);
console.log('\nInstructions:');
console.log('1. Copy the above URL and open it in your browser');
console.log('2. Sign in with your Gmail account and approve the permissions');
console.log('3. You\'ll be redirected to a URL that contains an authorization code');
console.log('4. Copy the code from the URL parameter (after ?code=)');
console.log('5. Use this code in your application to connect Gmail');
console.log('\nNote: This is for testing purposes only. In a real application,');
console.log('you would be redirected to your callback URL automatically.');

// Optional code exchange test (uncomment and add your code to test)
/*
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\nEnter the authorization code: ', async (code) => {
  try {
    console.log('Exchanging code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Received tokens:');
    console.log('Access Token:', tokens.access_token ? 'Available' : 'Missing');
    console.log('Refresh Token:', tokens.refresh_token ? 'Available' : 'Missing');
    console.log('Expiry Date:', new Date(tokens.expiry_date).toISOString());
    
    // Set credentials to test a simple API call
    oauth2Client.setCredentials(tokens);
    
    // Test API access - get profile info
    const people = google.people({ version: 'v1', auth: oauth2Client });
    const profile = await people.people.get({
      resourceName: 'people/me',
      personFields: 'emailAddresses,names',
    });
    
    console.log('\nSuccessfully connected to Gmail!');
    console.log('User:', profile.data.names[0].displayName);
    console.log('Email:', profile.data.emailAddresses[0].value);
    
  } catch (error) {
    console.error('\nError during token exchange:');
    console.error(error.message);
    if (error.response && error.response.data) {
      console.error('API Error Details:', error.response.data);
    }
  } finally {
    rl.close();
  }
});
*/
