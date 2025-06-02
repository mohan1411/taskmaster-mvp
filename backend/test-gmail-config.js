require('dotenv').config();
const { google } = require('googleapis');
const config = require('./config/config');

console.log('=== Gmail Auth Configuration Test ===');
console.log('Environment variables:');
console.log('- GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set (length: ' + process.env.GOOGLE_CLIENT_ID.length + ')' : 'Not set');
console.log('- GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set (length: ' + process.env.GOOGLE_CLIENT_SECRET.length + ')' : 'Not set');
console.log('- GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);

console.log('\nConfig values:');
console.log('- config.googleClientId:', config.googleClientId ? 'Set' : 'Not set');
console.log('- config.googleClientSecret:', config.googleClientSecret ? 'Set' : 'Not set');
console.log('- config.googleCallbackUrl:', config.googleCallbackUrl);

try {
  const oauth2Client = new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret,
    config.googleCallbackUrl
  );
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    prompt: 'consent'
  });
  
  console.log('\n✅ Auth URL generated successfully!');
  console.log('URL preview:', authUrl.substring(0, 100) + '...');
  
  // Check if required parameters are in the URL
  const urlObj = new URL(authUrl);
  console.log('\nURL parameters check:');
  console.log('- client_id:', urlObj.searchParams.has('client_id') ? '✅ Present' : '❌ Missing');
  console.log('- response_type:', urlObj.searchParams.has('response_type') ? '✅ Present' : '❌ Missing');
  console.log('- scope:', urlObj.searchParams.has('scope') ? '✅ Present' : '❌ Missing');
  console.log('- redirect_uri:', urlObj.searchParams.has('redirect_uri') ? '✅ Present' : '❌ Missing');
  
} catch (error) {
  console.error('\n❌ Error generating auth URL:', error.message);
  console.error('Stack:', error.stack);
}