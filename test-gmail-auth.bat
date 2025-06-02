@echo off
echo Testing Gmail Auth Configuration...

echo.
echo 1. Testing if the backend is running...
curl -s http://localhost:5000/api/emails/debug-config

echo.
echo 2. Environment variables check...
cd backend
node -e "
require('dotenv').config();
console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set (length: ' + process.env.GOOGLE_CLIENT_ID.length + ')' : 'Not set');
console.log('Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set (length: ' + process.env.GOOGLE_CLIENT_SECRET.length + ')' : 'Not set');
console.log('Google Callback URL:', process.env.GOOGLE_CALLBACK_URL);
"

echo.
echo 3. Testing Google OAuth configuration...
node -e "
require('dotenv').config();
const { google } = require('googleapis');
const config = require('./config/config');

console.log('Config Google Client ID:', config.googleClientId ? 'Set' : 'Not set');
console.log('Config Google Client Secret:', config.googleClientSecret ? 'Set' : 'Not set');
console.log('Config Callback URL:', config.googleCallbackUrl);

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
  
  console.log('Auth URL generated successfully');
  console.log('URL starts with:', authUrl.substring(0, 50) + '...');
} catch (error) {
  console.error('Error generating auth URL:', error.message);
}
"

pause