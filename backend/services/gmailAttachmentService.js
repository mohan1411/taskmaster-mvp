const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const Email = require('../models/emailModel');

class GmailAttachmentService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads/attachments');
    this.ensureUploadDir();
  }

  async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  /**
   * Download attachments for an email
   * @param {Object} auth - Gmail OAuth2 client
   * @param {string} messageId - Gmail message ID
   * @param {Object} emailDoc - Email document from database
   */
  async downloadEmailAttachments(auth, messageId, emailDoc) {
    try {
      const gmail = google.gmail({ version: 'v1', auth });
      
      // Get the full message with attachments
      const message = await gmail.users.messages.get({
        userId: 'me',
        id: messageId
      });

      const attachments = [];
      
      // Process each part of the message
      await this.processMessageParts(
        gmail, 
        messageId, 
        message.data.payload, 
        attachments
      );

      // Update email document with attachments
      if (attachments.length > 0) {
        emailDoc.attachments = attachments;
        emailDoc.hasAttachments = true;
        await emailDoc.save();
        
        console.log(`Downloaded ${attachments.length} attachments for email: ${emailDoc.subject}`);
      }

      return attachments;
    } catch (error) {
      console.error('Error downloading attachments:', error);
      throw error;
    }
  }

  /**
   * Process message parts recursively to find attachments
   */
  async processMessageParts(gmail, messageId, payload, attachments, depth = 0) {
    // Prevent infinite recursion
    if (depth > 10) {
      console.warn('Maximum recursion depth reached while processing message parts');
      return;
    }
    
    const parts = payload.parts || [];
    
    // Also check the payload itself if it has a filename
    if (payload.filename && payload.body?.attachmentId) {
      try {
        const attachment = await this.downloadAttachment(
          gmail, 
          messageId, 
          payload
        );
        
        if (attachment) {
          attachments.push(attachment);
        }
      } catch (error) {
        console.error(`Error downloading attachment ${payload.filename}:`, error);
      }
    }
    
    for (const part of parts) {
      // If this part has sub-parts, process them recursively
      if (part.parts) {
        await this.processMessageParts(gmail, messageId, part, attachments, depth + 1);
      }
      
      // Check if this part is an attachment
      if (part.filename && part.body?.attachmentId) {
        try {
          const attachment = await this.downloadAttachment(
            gmail, 
            messageId, 
            part
          );
          
          if (attachment) {
            attachments.push(attachment);
          }
        } catch (error) {
          console.error(`Error downloading attachment ${part.filename}:`, error);
        }
      }
    }
  }

  /**
   * Download a single attachment
   */
  async downloadAttachment(gmail, messageId, part) {
    try {
      // Get attachment data
      const attachmentResponse = await gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: messageId,
        id: part.body.attachmentId
      });

      // Decode base64 data
      const data = attachmentResponse.data.data;
      const buffer = Buffer.from(data, 'base64');

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedFilename = part.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}_${sanitizedFilename}`;
      const filepath = path.join(this.uploadDir, filename);

      // Save file
      await fs.writeFile(filepath, buffer);

      // Return attachment metadata
      return {
        filename: part.filename,
        mimeType: part.mimeType || this.getMimeTypeFromFilename(part.filename),
        size: part.body.size || buffer.length,
        attachmentId: part.body.attachmentId,
        path: filepath
      };
    } catch (error) {
      console.error('Error downloading attachment:', error);
      throw error;
    }
  }

  /**
   * Get MIME type from filename
   */
  getMimeTypeFromFilename(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'csv': 'text/csv',
      'txt': 'text/plain',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Clean up old attachment files
   */
  async cleanupOldAttachments(daysOld = 30) {
    try {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      const files = await fs.readdir(this.uploadDir);
      
      for (const file of files) {
        const filepath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filepath);
        
        if (stats.mtimeMs < cutoffTime) {
          await fs.unlink(filepath);
          console.log(`Deleted old attachment: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up attachments:', error);
    }
  }

  /**
   * Check if attachment is processable for task extraction
   */
  isProcessableAttachment(mimeType) {
    const processableTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain'
    ];
    return processableTypes.includes(mimeType);
  }
}

module.exports = new GmailAttachmentService();
