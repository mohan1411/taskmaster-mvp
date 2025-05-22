# Gmail OAuth Integration Troubleshooting Guide

## Common Issues and Solutions

### Error 403: access_denied - Google Verification Error

**Error Message:**
```
TaskMasterAI has not completed the Google verification process. The app is currently being tested, and can only be accessed by developer-approved testers. If you think you should have access, contact the developer.
Error 403: access_denied
```

**Cause:**
This error occurs because Google OAuth clients in development/testing mode have restrictions on which users can authenticate with the application. OAuth clients that use sensitive scopes (such as Gmail API access) require either:
1. Adding specific test users during development
2. Completing Google's verification process for production use

**Solutions:**

#### Option 1: Add Test Users (For Development)
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "OAuth consent screen"
4. Scroll down to the "Test users" section
5. Click "ADD USERS"
6. Add your Gmail address (e.g., `taskmasterai1411@gmail.com`)
7. Save changes
8. Wait 5-10 minutes for changes to propagate
9. Try authenticating again

You can add up to 100 test users during development. This is the simplest solution for development and testing purposes.

#### Option 2: Check Scopes and Configuration
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "OAuth consent screen"
3. Verify "User Type" is set to "External"
4. Review the requested scopes:
   - Gmail API scopes like `gmail.readonly` are considered sensitive
   - For development with many users, you may need to temporarily reduce scopes
5. Save any changes and try again

#### Option 3: Complete Google Verification Process (For Production)
For production applications that will be used by the general public:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "OAuth consent screen"
3. Complete all required information:
   - App name, user support email, developer contact information
   - Application home page
   - Application privacy policy link
   - Application terms of service link
4. Once all information is provided, click "SUBMIT FOR VERIFICATION"
5. Wait for Google's review (can take several days to weeks)

### Changing Gmail Account for TaskMaster

If you need to change the Gmail account used for TaskMaster:

1. Create new OAuth credentials:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or use an existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Create OAuth Client ID
     - Application type: Web application
     - Name: TaskMaster
     - Authorized JavaScript origins: http://localhost:3000
     - Authorized redirect URIs:
       - http://localhost:3000/auth/gmail/callback
       - http://localhost:8000/api/auth/google/callback
   - Download the JSON file with credentials

2. Update backend environment file:
   - Open `backend/.env`
   - Update the following values with your new credentials:
   ```
   GOOGLE_CLIENT_ID=your_new_client_id_here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_new_client_secret_here
   ```

3. Remember to add the new Gmail account as a test user in the OAuth consent screen

### Unable to Authenticate with Gmail

**Issue:** Authentication fails with various errors even after setting up OAuth correctly.

**Solutions:**

1. **Check Redirect URIs:**
   - Ensure the redirect URIs in Google Cloud Console match exactly with your application
   - For local development: http://localhost:3000/auth/gmail/callback
   - Check for any trailing slashes or different ports

2. **Verify API Enablement:**
   - Ensure the Gmail API is enabled in your Google Cloud project
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API" and ensure it's enabled

3. **Check Environment Variables:**
   - Verify that environment variables are loaded correctly
   - Try logging `process.env.GOOGLE_CLIENT_ID` on server startup to confirm
   - Restart the server after changing environment variables

4. **Browser Issues:**
   - Clear browser cookies and cache
   - Try in incognito/private window
   - Try a different browser

5. **OAuth Consent Screen Settings:**
   - Make sure the OAuth consent screen is properly configured
   - Required scopes are added
   - App information is correctly filled out

## Gmail API Scope Reference

When configuring your Google OAuth client, you'll need to select the appropriate scopes. Here are the common scopes used in TaskMaster:

| Scope | Description | Sensitivity |
|-------|-------------|-------------|
| `https://www.googleapis.com/auth/userinfo.email` | View user email address | Not Sensitive |
| `https://www.googleapis.com/auth/userinfo.profile` | View basic profile info | Not Sensitive |
| `https://www.googleapis.com/auth/gmail.readonly` | View Gmail messages and settings | Sensitive (requires verification) |
| `https://www.googleapis.com/auth/gmail.labels` | Manage Gmail labels | Sensitive (requires verification) |

For development and testing, you can use all scopes but must add test users. For production, Google will verify your app's usage of sensitive scopes.

## Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Documentation](https://developers.google.com/gmail/api/guides)
- [OAuth Verification Requirements](https://support.google.com/cloud/answer/9110914)
