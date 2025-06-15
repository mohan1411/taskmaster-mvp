const gmailAttachmentService = require('./services/gmailAttachmentService');

// Run cleanup for attachments older than 30 days
async function runCleanup() {
  try {
    console.log('Starting attachment cleanup...');
    await gmailAttachmentService.cleanupOldAttachments(30);
    console.log('Attachment cleanup completed.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run cleanup if called directly
if (require.main === module) {
  runCleanup();
}

module.exports = { runCleanup };
