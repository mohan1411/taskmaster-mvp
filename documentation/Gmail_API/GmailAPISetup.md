# Gmail API Integration - Setup Guide

This guide provides step-by-step instructions for setting up the Gmail API integration for TaskMaster.

## Prerequisites

- A Google Cloud Platform (GCP) account
- Node.js and npm installed
- The TaskMaster project cloned and set up

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a project" at the top of the page
3. Click on "New Project"
4. Enter a name for your project (e.g., "TaskMaster")
5. Click "Create"
6. Wait for the project to be created and then select it

## Step 2: Enable the Gmail API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Gmail API"
3. Click on the Gmail API result
4. Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. In the Google Cloud Console, navigate to "APIs & Services" > "OAuth consent screen"
2. Select "External" as the user type if you're not using Google Workspace
3. Click "Create"
4. Fill in the required fields:
   - App name: "TaskMaster"
   - User support email: Your email address
   - Developer contact information: Your email address
5. Click "Save and Continue"
6. Add the following scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.labels`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
7. Click "Save and Continue"
8. Add test users if needed (your own email is sufficient for development)
9. Click "Save and Continue"
10. Review your settings and click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Credentials

1. In the Google Cloud Console, navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: "Web application"
4. Name: "TaskMaster Web Client"
5. Authorized JavaScript origins:
   - Add `http://localhost:3000` for development
   - Add your production URL when deploying
6. Authorized redirect URIs:
   - Add `http://localhost:3000/auth/gmail/callback` for development
   - Add your production callback URL when deploying
7. Click "Create"
8. Note the Client ID and Client Secret that are generated (you'll need these for your .env file)

## Step 5: Configure TaskMaster to Use the Gmail API

1. Open the `.env` file in the backend directory of your TaskMaster project
2. Update the following variables:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/gmail/callback
   ```
3. Save the file

## Step 6: Test the Integration

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```
2. Start the frontend:
   ```
   cd frontend
   npm start
   ```
3. Navigate to the Emails page in TaskMaster
4. Click "Connect Gmail" and follow the OAuth flow
5. Once connected, you should be able to sync and view your emails

## Troubleshooting

### OAuth Errors

- **Error: redirect_uri_mismatch**: Ensure that the redirect URI in your code exactly matches the one configured in the Google Cloud Console.
- **Error: invalid_client**: Double-check your client ID and client secret in the .env file.
- **Error: access_denied**: Ensure you've added the correct scopes and they match what your application is requesting.

### API Request Errors

- **Error: Invalid Credentials**: Your access token may have expired. The application should automatically refresh the token, but you can try disconnecting and reconnecting your account.
- **Error: Rate limit exceeded**: Gmail API has quotas. If you're experiencing this, implement better caching and reduce unnecessary API calls.

### Development Mode Limitations

- While in development mode, Google OAuth will only allow access from users you've added as test users in the OAuth consent screen configuration.
- If deploying for production use, you'll need to go through Google's OAuth verification process.

## Next Steps

- Implement pagination for emails to handle large inboxes efficiently
- Add more robust error handling for API failures
- Create a background job for periodic email syncing
- Implement caching to reduce API calls

## Resources

- [Gmail API Documentation](https://developers.google.com/gmail/api/guides)
- [Node.js Gmail API Client](https://github.com/googleapis/google-api-nodejs-client#google-apis-nodejs-client)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
