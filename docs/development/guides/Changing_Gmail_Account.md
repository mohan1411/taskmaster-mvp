# Changing Gmail Account for TaskMaster

This guide walks through the process of changing the Gmail account used for TaskMaster's Gmail integration.

## Prerequisites

Before changing the Gmail account, ensure you have:

- Access to the Google Cloud Console
- Administrative access to the new Gmail account (e.g., `taskmasterai1411@gmail.com`)
- Access to edit the TaskMaster backend environment variables

## Step 1: Create New OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
   - Click on "Select a project" at the top of the page
   - Click on "New Project" if creating a new one
   - Enter a name (e.g., "TaskMaster") and click "Create"

3. Enable the Gmail API
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click on the Gmail API result
   - Click "Enable"

4. Configure the OAuth consent screen
   - Navigate to "APIs & Services" > "OAuth consent screen"
   - Select "External" as the user type
   - Click "Create"
   - Fill in the required fields:
     - App name: "TaskMaster"
     - User support email: your email address (e.g., `taskmasterai1411@gmail.com`)
     - Developer contact information: your email address
   - Click "Save and Continue"
   - Add the following scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.labels`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Click "Save and Continue"
   - Add test users:
     - Click "Add Users"
     - Add your email address (e.g., `taskmasterai1411@gmail.com`)
     - Add any other team members who need access
   - Click "Save and Continue"
   - Review your settings and click "Back to Dashboard"

5. Create OAuth client credentials
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application" as the application type
   - Enter a name (e.g., "TaskMaster Web Client")
   - Add the following Authorized JavaScript origins:
     - `http://localhost:3000`
   - Add the following Authorized redirect URIs:
     - `http://localhost:3000/auth/gmail/callback`
     - `http://localhost:8000/api/auth/google/callback`
   - Click "Create"
   - Note the Client ID and Client Secret that are displayed
   - Download the JSON file (you'll need this for reference)

## Step 2: Update TaskMaster Configuration

1. Update the backend environment file
   - Open `D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP\backend\.env`
   - Locate the Google OAuth settings:
     ```
     # Google OAuth
     GOOGLE_CLIENT_ID=483751935062-5fd9gebuhr01ngkqrjse5bqp1rleppqu.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=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
     GOOGLE_CALLBACK_URL=http://localhost:3000/auth/gmail/callback
     ```
   - Replace the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` with your new values:
     ```
     # Google OAuth
     GOOGLE_CLIENT_ID=your_new_client_id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=your_new_client_secret
     GOOGLE_CALLBACK_URL=http://localhost:3000/auth/gmail/callback
     ```

2. Save the client secret JSON file (optional but recommended)
   - Rename the downloaded JSON file to something like `client_secret_[your_client_id].apps.googleusercontent.com.json`
   - Move it to `D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP\documentation\`
   - This serves as a backup of your credentials

## Step 3: Test the New Configuration

1. Restart the backend server
   ```bash
   cd D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP\backend
   npm run dev
   ```

2. Log out of any existing sessions in the TaskMaster application
   - Navigate to your TaskMaster application (e.g., http://localhost:3000)
   - Log out or clear browser cookies/cache

3. Test Gmail integration
   - Navigate to the Gmail integration page in TaskMaster
   - Click "Connect Gmail"
   - You should be redirected to the Google OAuth consent screen
   - Log in with your new Gmail account (e.g., `taskmasterai1411@gmail.com`)
   - Grant the requested permissions
   - You should be redirected back to TaskMaster
   - The Gmail connection status should show "Connected"

## Troubleshooting

If you encounter any issues during this process, refer to the [Gmail OAuth Troubleshooting Guide](../troubleshooting/Gmail_OAuth_Troubleshooting.md).

Common issues include:

- **Error 403: access_denied** - Ensure your Gmail account is added as a test user
- **Redirect URI mismatch** - Check that the redirect URIs match exactly
- **Invalid client configuration** - Verify you've copied the credentials correctly

## Notes for Production Deployment

For production deployments, you would need to:

1. Complete the Google verification process if you plan to make the app available to more than 100 users
2. Update the authorized JavaScript origins and redirect URIs to include your production URLs
3. Set the appropriate environment variables in your production environment

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Documentation](https://developers.google.com/gmail/api/guides)
