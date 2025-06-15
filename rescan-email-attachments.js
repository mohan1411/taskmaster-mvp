const mongoose = require('mongoose');
const Email = require('./backend/models/emailModel');
const { google } = require('googleapis');
const Settings = require('./backend/models/settingsModel');
const config = require('./backend/config/config');
const gmailAttachmentService = require('./backend/services/gmailAttachmentService');
require('dotenv').config({ path: './backend/.env' });

/**
 * Re-scan existing emails for attachments
 * This will check all emails and update their attachment status
 */

// Create OAuth2 client
const createOAuth2Client = (tokens) => {
  const oAuth2Client = new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret,
    config.googleCallbackUrl
  );
  
  oAuth2Client.setCredentials(tokens);
  return oAuth2Client;
};

// Helper function to check for attachments recursively
const hasAttachmentsInParts = (parts) => {
  if (!parts || !Array.isArray(parts)) return false;
  
  for (const part of parts) {
    // Check if this part is an attachment
    if (part.filename && part.filename.length > 0) {
      console.log(`  Found attachment: ${part.filename}`);
      return true;
    }
    // Check nested parts
    if (part.parts && hasAttachmentsInParts(part.parts)) {
      return true;
    }
  }
  return false;
};

async function rescanEmailAttachments(userId) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get user settings
    const settings = await Settings.findOne({ user: userId });
    
    if (!settings || !settings.integrations.google.connected) {
      console.error('Google integration not connected for this user');
      return;
    }
    
    const tokenInfo = settings.integrations.google.tokenInfo;
    
    // Create OAuth2 client
    const oauth2Client = createOAuth2Client({
      access_token: tokenInfo.accessToken,
      refresh_token: tokenInfo.refreshToken,
    });
    
    // Create Gmail API client
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get all emails for the user
    const emails = await Email.find({ user: userId });
    console.log(`\nFound ${emails.length} emails to check\n`);
    
    let updatedCount = 0;
    let attachmentCount = 0;
    
    for (const email of emails) {
      try {
        console.log(`Checking: ${email.subject || '(No subject)'}`);
        
        // Get message details with full format
        const messageData = await gmail.users.messages.get({
          userId: 'me',
          id: email.messageId,
          format: 'full'
        });
        
        // Check for attachments
        let hasAttachments = false;
        
        // Check if the payload itself has a filename (single part message)
        if (messageData.data.payload.filename) {
          console.log(`  Found attachment in payload: ${messageData.data.payload.filename}`);
          hasAttachments = true;
        } else {
          // Check parts for attachments
          hasAttachments = hasAttachmentsInParts(messageData.data.payload.parts);
        }
        
        // Update email if attachment status changed
        if (hasAttachments !== email.hasAttachments) {
          console.log(`  ⚠️  Updating attachment status: ${email.hasAttachments} → ${hasAttachments}`);
          
          email.hasAttachments = hasAttachments;
          
          // If has attachments and they weren't downloaded before, download them now
          if (hasAttachments && (!email.attachments || email.attachments.length === 0)) {
            try {
              console.log('  📥 Downloading attachments...');
              const attachments = await gmailAttachmentService.downloadEmailAttachments(
                oauth2Client,
                email.messageId,
                email
              );
              attachmentCount += attachments.length;
              console.log(`  ✅ Downloaded ${attachments.length} attachments`);
            } catch (attachmentError) {
              console.error(`  ❌ Error downloading attachments:`, attachmentError.message);
            }
          }
          
          await email.save();
          updatedCount++;
        } else {
          console.log(`  ✓ Attachment status is correct`);
        }
        
      } catch (error) {
        console.error(`Error processing email ${email._id}:`, error.message);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`- Emails checked: ${emails.length}`);
    console.log(`- Emails updated: ${updatedCount}`);
    console.log(`- Attachments downloaded: ${attachmentCount}`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Check command line arguments
if (process.argv.length < 3) {
  console.log('Usage: node rescan-email-attachments.js <userId>');
  console.log('\nTo find your user ID, run: node list-users.js');
  process.exit(1);
}

const userId = process.argv[2];
console.log(`\n🔍 Re-scanning email attachments for user: ${userId}\n`);

rescanEmailAttachments(userId);
