const Document = require('../models/documentModel');
const documentExtractor = require('./documentExtractor');
const taskParser = require('./taskParser');
const simpleTaskParser = require('./simpleTaskParser');
const openaiDocumentParser = require('./openaiDocumentParser');
const improvedSimpleParser = require('./improvedSimpleParser');
const fileTypeDetector = require('../utils/fileTypeDetector');
const { createLogger } = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

const logger = createLogger('AttachmentProcessor');

class AttachmentProcessor {
  constructor() {
    this.processingQueue = new Map();
    // Configuration: Set parser preference
    // Options: 'openai-first', 'simple-only', 'openai-only'
    this.parserMode = process.env.DOCUMENT_PARSER_MODE || 'openai-first';
  }

  /**
   * Process a single document
   */
  async processDocument(documentId, filePath) {
    // Prevent duplicate processing
    if (this.processingQueue.has(documentId)) {
      logger.info(`Document ${documentId} already being processed`);
      return;
    }

    this.processingQueue.set(documentId, true);

    try {
      // Get document from database
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Mark as processing
      await document.markAsProcessing();

      // Validate file
      const validation = await fileTypeDetector.validateFile(filePath, document.mimeType);
      if (!validation.valid) {
        throw new Error(`File validation failed: ${validation.error}`);
      }

      // Get processor type
      const processorType = fileTypeDetector.getProcessor(document.mimeType);
      if (!processorType) {
        throw new Error(`No processor available for ${document.mimeType}`);
      }

      // Extract text
      logger.info(`Extracting text from ${document.originalName}`);
      const extractionResult = await documentExtractor.extractFromFile(
        filePath, 
        document.mimeType
      );

      // Detect document type
      const documentType = await fileTypeDetector.detectDocumentType(extractionResult.text);

      // Parse for tasks based on configuration
      logger.info(`Parsing tasks from ${document.originalName} using mode: ${this.parserMode}`);
      logger.debug(`Parser mode from environment: ${process.env.DOCUMENT_PARSER_MODE || 'not set (defaulting to simple-only)'}`);
      let tasks = [];
      
      const parserContext = {
        source: 'document',
        documentName: document.originalName,
        documentType: documentType,
        emailContext: document.emailId ? await this.getEmailContext(document.emailId) : null,
        structured: extractionResult.structured
      };

      // Choose parser based on configuration
      switch (this.parserMode) {
        case 'simple-only':
          // Use improved simple parser
          logger.debug('Using improved simple parser...');
          tasks = improvedSimpleParser.parseDocument(extractionResult.text);
          logger.info(`Parser found ${tasks.length} tasks`);
          break;
          
        case 'openai-only':
          // Use OpenAI only (will fail if not configured)
          tasks = await openaiDocumentParser.parseDocument(extractionResult.text, parserContext);
          logger.info(`OpenAI parser found ${tasks.length} tasks`);
          break;
          
        case 'openai-first':
        default:
          // Try OpenAI first, fallback to simple
          try {
            tasks = await openaiDocumentParser.parseDocument(extractionResult.text, parserContext);
            logger.info(`OpenAI parser found ${tasks.length} tasks`);
          } catch (parserError) {
            logger.warn(`OpenAI parser failed, using improved simple parser:`, parserError.message);
            // Use the improved simple parser as fallback
            tasks = improvedSimpleParser.parseDocument(extractionResult.text);
            logger.info(`Improved simple parser found ${tasks.length} tasks`);
          }
          break;
      }

      // Update document with results
      await document.markAsCompleted({
        text: extractionResult.text,
        tasks: tasks,
        metadata: {
          ...extractionResult.metadata,
          documentType: documentType,
          hasDeadlines: tasks.some(t => t.dueDate),
          language: 'en', // TODO: Implement language detection
          extractionVersion: '1.0',
          parserUsed: this.parserMode
        }
      });

      logger.info(`Successfully processed ${document.originalName}: Found ${tasks.length} tasks`);
      console.log(`[ATTACHMENT PROCESSOR] Document ${document.originalName}: Extracted ${tasks.length} tasks, saving to DB...`);

      // Don't clean up file to allow reprocessing
      // await this.cleanupFile(filePath);

      return document;
    } catch (error) {
      logger.error(`Error processing document ${documentId}:`, error);

      // Mark as failed
      try {
        const document = await Document.findById(documentId);
        if (document) {
          await document.markAsFailed(error);
        }
      } catch (updateError) {
        logger.error('Failed to update document status:', updateError);
      }

      // Don't clean up file on error to allow retry
      // await this.cleanupFile(filePath);

      throw error;
    } finally {
      this.processingQueue.delete(documentId);
    }
  }

  /**
   * Process email attachments
   */
  async processEmailAttachments(emailId, attachments) {
    const results = [];

    for (const attachment of attachments) {
      try {
        // Check if supported
        if (!fileTypeDetector.isSupported(attachment.mimeType)) {
          logger.info(`Skipping unsupported file type: ${attachment.mimeType}`);
          continue;
        }

        // Create document record
        const document = await Document.create({
          originalName: attachment.filename,
          filename: fileTypeDetector.sanitizeFilename(attachment.filename),
          mimeType: attachment.mimeType,
          size: attachment.size,
          path: attachment.path,
          emailId: emailId,
          userId: attachment.userId,
          processingStatus: 'pending'
        });

        // Process asynchronously
        this.processDocument(document._id, attachment.path)
          .catch(error => logger.error(`Failed to process attachment ${attachment.filename}:`, error));

        results.push({
          documentId: document._id,
          filename: attachment.filename,
          status: 'processing'
        });
      } catch (error) {
        logger.error(`Error creating document for ${attachment.filename}:`, error);
        results.push({
          filename: attachment.filename,
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get email context for better task extraction
   */
  async getEmailContext(emailId) {
    try {
      const Email = require('../models/emailModel');
      const email = await Email.findById(emailId).select('subject from body');
      
      if (!email) return null;

      return {
        subject: email.subject,
        sender: email.from,
        emailBody: email.body ? email.body.substring(0, 500) : '' // First 500 chars
      };
    } catch (error) {
      logger.error('Error fetching email context:', error);
      return null;
    }
  }

  /**
   * Clean up uploaded file
   */
  async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info(`Cleaned up file: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to cleanup file ${filePath}:`, error);
    }
  }

  /**
   * Process pending documents (for background job)
   */
  async processPendingDocuments() {
    try {
      const pendingDocs = await Document.findPendingDocuments();
      logger.info(`Found ${pendingDocs.length} pending documents`);

      for (const doc of pendingDocs) {
        try {
          await this.processDocument(doc._id, doc.path);
        } catch (error) {
          logger.error(`Failed to process pending document ${doc._id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error processing pending documents:', error);
    }
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats(userId) {
    const stats = await Document.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$processingStatus',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' },
          avgProcessingTime: { $avg: '$processingDuration' },
          totalTasksFound: { $sum: { $size: '$extractedTasks' } }
        }
      }
    ]);

    const statsByType = await Document.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$mimeType',
          count: { $sum: 1 },
          avgTasksPerDoc: { $avg: { $size: '$extractedTasks' } },
          successRate: {
            $avg: {
              $cond: [{ $eq: ['$processingStatus', 'completed'] }, 1, 0]
            }
          }
        }
      }
    ]);

    return {
      byStatus: stats,
      byType: statsByType,
      queueSize: this.processingQueue.size,
      parserMode: this.parserMode
    };
  }

  /**
   * Reprocess a document
   */
  async reprocessDocument(documentId) {
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    if (document.deleted) {
      throw new Error('Document has been deleted');
    }

    // Check if file still exists
    let fileExists = false;
    if (document.path) {
      try {
        await fs.access(document.path);
        fileExists = true;
      } catch (error) {
        logger.info('Original file no longer exists, cannot reprocess');
      }
    }

    if (!fileExists) {
      throw new Error('Document file no longer exists. Cannot reprocess.');
    }

    // Reset status
    document.processingStatus = 'pending';
    document.processingError = null;
    document.extractedTasks = [];
    await document.save();

    // Reprocess
    return this.processDocument(document._id, document.path);
  }

  /**
   * Get current parser mode
   */
  getParserMode() {
    return this.parserMode;
  }

  /**
   * Set parser mode dynamically
   */
  setParserMode(mode) {
    const validModes = ['simple-only', 'openai-first', 'openai-only'];
    if (validModes.includes(mode)) {
      this.parserMode = mode;
      logger.info(`Document parser mode set to: ${mode}`);
      return true;
    }
    return false;
  }
}

module.exports = new AttachmentProcessor();
