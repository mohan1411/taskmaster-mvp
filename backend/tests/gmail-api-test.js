/**
 * Gmail API Integration Test Script
 * 
 * This script tests connectivity to the Gmail API with provided credentials.
 * It validates that your OAuth setup is working correctly.
 * 
 * Usage:
 * 1. Make sure your .env file is configured with valid GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
 * 2. Run this script with Node.js:
 *    node tests/gmail-api-test.js
 * 
 * Note: This is a manual test that requires user interaction to complete the OAuth flow.
 */

require('dotenv').config();
const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const open = require('open');
const destroyer = require('server-destroy');

// Configuration
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = 'http://localhost:3000/oauth2callback';

// Check if credentials are configured
if (!clientId || !clientSecret) {
  console.error('Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured in your .env file');
  process.exit(1);
}

// Create an OAuth client
const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

// Generate the URL to authorize access to Gmail data
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.labels'
  ],
  prompt: 'consent'
});

// Start a local web server to handle the OAuth callback
const server = http.createServer(async (req, res) => {
  try {
    // Parse the query parameters
    const queryParams = url.parse(req.url, true).query;
    
    if (queryParams.code) {
      // Exchange the authorization code for tokens
      const { tokens } = await oauth2Client.getToken(queryParams.code);
      oauth2Client.setCredentials(tokens);
      
      // Display success message
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <h1>Authentication successful!</h1>
        <p>You may close this window and return to the terminal.</p>
        <script>window.close();</script>
      `);
      
      // Use the Gmail API to test connectivity
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      // Get profile information
      const profile = await gmail.users.getProfile({
        userId: 'me'
      });
      
      console.log('Gmail API connection successful!');
      console.log('Email address:', profile.data.emailAddress);
      
      // Get Gmail labels
      const labels = await gmail.users.labels.list({
        userId: 'me'
      });
      
      console.log('\nGmail labels:');
      labels.data.labels.forEach(label => {
        console.log(`- ${label.name} (${label.id})`);
      });
      
      // Test message listing (limit to 5)
      const messages = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 5
      });
      
      console.log(`\nFound ${messages.data.resultSizeEstimate} messages in total. Here are the first 5 IDs:`);
      if (messages.data.messages) {
        messages.data.messages.forEach(message => {
          console.log(`- ${message.id}`);
        });
      } else {
        console.log('No messages found.');
      }
      
      // Display token information
      console.log('\nOAuth Token Information:');
      console.log('Access Token:', tokens.access_token.substring(0, 10) + '...');
      console.log('Refresh Token:', tokens.refresh_token ? tokens.refresh_token.substring(0, 10) + '...' : 'None');
      console.log('Expiry Date:', new Date(tokens.expiry_date).toLocaleString());
      
      // All tests completed
      console.log('\nAll tests completed successfully! Your Gmail API integration is working.');
      console.log('\nTo use these tokens in TaskMaster, update your settings in the database or manually add them to your user settings.');
      
      // Shut down the server
      server.close();
      process.exit(0);
    } else {
      // Handle error
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h1>Authentication failed</h1><p>No authorization code was received.</p>');
      
      // Shut down the server
      server.close();
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during authentication:', error);
    
    // Display error message
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`<h1>Authentication error</h1><p>${error.message}</p>`);
    
    // Shut down the server
    server.close();
    process.exit(1);
  }
});

// Start server
server.listen(3000, () => {
  console.log('Gmail API Integration Test');
  console.log('-------------------------');
  console.log('\nStarting authentication flow...');
  console.log('\nOpening browser to authorize application...');
  console.log('(If the browser does not open automatically, navigate to the URL below)');
  console.log('\nAuthorization URL:', authUrl);
  
  // Open the browser to the authorization URL
  open(authUrl);
});

// Enable graceful shutdown
destroyer(server);

// Handle termination
process.on('SIGINT', () => {
  console.log('\nTest interrupted. Shutting down...');
  server.close();
  process.exit(0);
});
