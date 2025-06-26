const Document = require('../models/documentModel');
const Email = require('../models/emailModel');
const Task = require('../models/taskModel');
const Settings = require('../models/settingsModel');
const attachmentProcessor = require('../services/attachmentProcessor');
const gmailAttachmentService = require('../services/gmailAttachmentService');
const fileTypeDetector = require('../utils/fileTypeDetector');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;

exports.scanDocument = async (req, res) => {
  try {
    const { file } = req;
    const { emailId } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create document record
    const document = await Document.create({
      originalName: file.originalname,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      emailId: emailId || null,
      userId: req.user.id,
      processingStatus: 'pending'
    });

    // Process document asynchronously
    attachmentProcessor.processDocument(document._id, file.path)
      .catch(error => console.error(`Failed to process document ${document._id}:`, error));

    res.json({
      message: 'Document uploaded and processing started',
      document: {
        id: document._id,
        filename: document.originalName,
        status: 'processing',
        uploadedAt: document.createdAt
      }
    });
  } catch (error) {
    console.error('Scan document error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.scanMultipleDocuments = async (req, res) => {
  try {
    const { files } = req;
    const { emailId } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const documents = [];

    for (const file of files) {
      const document = await Document.create({
        originalName: file.originalname,
        filename: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        emailId: emailId || null,
        userId: req.user.id,
        processingStatus: 'pending'
      });

      // Process asynchronously
      attachmentProcessor.processDocument(document._id, file.path)
        .catch(error => console.error(`Failed to process document ${document._id}:`, error));

      documents.push({
        id: document._id,
        filename: document.originalName,
        status: 'processing'
      });
    }

    res.json({
      message: `${documents.length} documents uploaded and processing started`,
      documents
    });
  } catch (error) {
    console.error('Scan multiple documents error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.scanEmailAttachments = async (req, res) => {
  try {
    const { emailId } = req.params;

    // Get email with attachments
    const email = await Email.findById(emailId);
    
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    if (!email.user.equals(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!email.attachments || email.attachments.length === 0) {
      return res.status(404).json({ error: 'No attachments found in this email' });
    }

    // FIXED: Look for existing documents instead of creating new ones
    const existingDocuments = await Document.find({
      emailId: emailId,
      userId: req.user.id,
      deleted: { $ne: true }
    }).select('originalName processingStatus extractedTasks');

    // If documents exist, return them
    if (existingDocuments.length > 0) {
      const results = existingDocuments.map(doc => ({
        documentId: doc._id.toString(),
        filename: doc.originalName,
        status: doc.processingStatus,
        extractedTasks: doc.extractedTasks || []
      }));

      return res.json({
        message: `Found ${results.length} processed attachments`,
        email: {
          id: email._id,
          subject: email.subject,
          from: email.from || email.sender
        },
        results: results,
        documents: results
      });
    }

    // Get user's Gmail credentials
    const settings = await Settings.findOne({ user: req.user._id });
    
    if (!settings || !settings.integrations.google.connected) {
      return res.status(400).json({ error: 'Gmail not connected. Please connect your Gmail account in Settings.' });
    }
    
    const tokenInfo = settings.integrations.google.tokenInfo;
    
    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: tokenInfo.accessToken,
      refresh_token: tokenInfo.refreshToken
    });
    
    // Download attachments from Gmail
    const gmailService = new gmailAttachmentService();
    const downloadedAttachments = await gmailService.downloadEmailAttachments(
      oauth2Client,
      email.messageId,
      email
    );
    
    // Process downloaded attachments
    const results = await attachmentProcessor.processEmailAttachments(
      emailId,
      downloadedAttachments.map(att => ({
        ...att,
        userId: req.user.id
      }))
    );

    // Wait a moment for processing to start, then fetch the documents
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the created documents to check for extracted tasks
    const processedDocuments = await Document.find({
      emailId: emailId,
      userId: req.user.id
    }).select('originalName processingStatus extractedTasks');

    // Combine results with extracted tasks
    const resultsWithTasks = results.map(result => {
      const doc = processedDocuments.find(d => d._id.toString() === result.documentId);
      return {
        ...result,
        extractedTasks: doc?.extractedTasks || []
      };
    });

    res.json({
      message: `Processing ${results.length} attachments`,
      email: {
        id: email._id,
        subject: email.subject,
        from: email.from || email.sender
      },
      results: resultsWithTasks,
      documents: results
    });
  } catch (error) {
    console.error('Scan email attachments error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .select('-extractedText'); // Exclude large text field

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!document.userId.equals(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      document: {
        id: document._id,
        filename: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        status: document.processingStatus,
        error: document.processingError,
        metadata: document.metadata,
        taskCount: document.extractedTasks.length,
        createdAt: document.createdAt,
        processingDuration: document.processingDuration
      }
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getExtractedTasks = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!document.userId.equals(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (document.processingStatus === 'processing') {
      return res.json({ 
        status: 'processing', 
        message: 'Document is still being processed. Please check back in a moment.' 
      });
    }

    if (document.processingStatus === 'failed') {
      return res.json({ 
        status: 'failed', 
        error: document.processingError,
        message: 'Document processing failed. You can try reprocessing.' 
      });
    }

    res.json({
      status: document.processingStatus,
      document: {
        id: document._id,
        filename: document.originalName,
        type: document.metadata?.documentType
      },
      tasks: document.extractedTasks.map((task, index) => ({
        index,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        confidence: task.confidence,
        assignee: task.assignee,
        sourceText: task.sourceText,
        lineNumber: task.lineNumber
      })),
      metadata: document.metadata,
      summary: {
        totalTasks: document.extractedTasks.length,
        withDeadlines: document.extractedTasks.filter(t => t.dueDate).length,
        byPriority: {
          urgent: document.extractedTasks.filter(t => t.priority === 'urgent').length,
          high: document.extractedTasks.filter(t => t.priority === 'high').length,
          medium: document.extractedTasks.filter(t => t.priority === 'medium').length,
          low: document.extractedTasks.filter(t => t.priority === 'low').length
        }
      }
    });
  } catch (error) {
    console.error('Get extracted tasks error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createTasksFromExtraction = async (req, res) => {
  try {
    const { documentId, selectedTasks } = req.body;

    if (!documentId || !Array.isArray(selectedTasks)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!document.userId.equals(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const createdTasks = [];
    const errors = [];

    for (const taskIndex of selectedTasks) {
      try {
        const extractedTask = document.extractedTasks[taskIndex];
        if (!extractedTask) {
          errors.push({ index: taskIndex, error: 'Task not found' });
          continue;
        }

        console.log(`Creating task ${taskIndex}:`, {
          title: extractedTask.title,
          priority: extractedTask.priority,
          user: req.user.id
        });

        // Create the task
        const task = await Task.create({
          user: req.user.id,
          title: extractedTask.title,
          description: extractedTask.description || `Extracted from: ${document.originalName}`,
          priority: extractedTask.priority || 'medium',
          dueDate: extractedTask.dueDate,
          status: 'pending',
          category: 'work',
          aiGenerated: true,
          labels: ['extracted', 'document']
        });

        createdTasks.push({
          id: task._id,
          title: task.title,
          priority: task.priority,
          dueDate: task.dueDate
        });
      } catch (error) {
        console.error(`Error creating task ${taskIndex}:`, error);
        errors.push({ 
          index: taskIndex, 
          error: error.message,
          details: error.errors ? Object.keys(error.errors).map(key => `${key}: ${error.errors[key].message}`).join(', ') : undefined
        });
      }
    }

    res.json({
      message: `Created ${createdTasks.length} tasks`,
      created: createdTasks.length,  // Add this for the frontend
      tasks: createdTasks,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Create tasks error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getUserDocuments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status,
      emailId,
      sortBy = '-createdAt'
    } = req.query;

    const query = { 
      userId: req.user.id,
      deleted: false 
    };

    if (status) query.processingStatus = status;
    if (emailId) query.emailId = emailId;

    const documents = await Document.find(query)
      .select('-extractedText') // Only exclude the large text field, keep extractedTasks for counting
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('emailId', 'subject from');

    const count = await Document.countDocuments(query);

    res.json({
      documents: documents.map(doc => ({
        id: doc._id,
        filename: doc.originalName,
        mimeType: doc.mimeType,
        size: doc.size,
        status: doc.processingStatus,
        taskCount: doc.extractedTasks?.length || 0,
        email: doc.emailId ? {
          id: doc.emailId._id,
          subject: doc.emailId.subject,
          from: doc.emailId.from
        } : null,
        createdAt: doc.createdAt
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalDocuments: count,
        hasMore: page * limit < count
      }
    });
  } catch (error) {
    console.error('Get user documents error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getProcessingStats = async (req, res) => {
  try {
    // Get all user documents
    const documents = await Document.find({ 
      userId: req.user.id,
      deleted: { $ne: true }
    });
    
    // Calculate stats
    const totalDocuments = documents.length;
    const completedDocs = documents.filter(d => d.processingStatus === 'completed');
    const totalTasks = completedDocs.reduce((sum, doc) => sum + (doc.extractedTasks?.length || 0), 0);
    
    // Calculate average confidence
    let totalConfidence = 0;
    let confidentTasks = 0;
    let highConfidenceTasks = 0;
    
    completedDocs.forEach(doc => {
      doc.extractedTasks?.forEach(task => {
        if (task.confidence) {
          totalConfidence += task.confidence;
          confidentTasks++;
          if (task.confidence >= 80) {
            highConfidenceTasks++;
          }
        }
      });
    });
    
    const avgConfidence = confidentTasks > 0 ? Math.round(totalConfidence / confidentTasks) : 0;
    
    // Calculate average processing time
    const processingTimes = completedDocs
      .filter(d => d.processingDuration)
      .map(d => d.processingDuration);
    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
      : 0;
    
    // File type breakdown
    const fileTypeBreakdown = {};
    documents.forEach(doc => {
      const mimeType = doc.mimeType || '';
      const type = mimeType.split('/')[1] || 'unknown';
      
      // More accurate categorization - check Excel BEFORE generic document
      let category;
      if (type.includes('pdf')) {
        category = 'pdf';
      } else if (type.includes('sheet') || type.includes('excel') || mimeType.includes('spreadsheet')) {
        category = 'excel';
      } else if (type.includes('presentation') || type.includes('powerpoint')) {
        category = 'powerpoint';
      } else if (type.includes('word') || mimeType.includes('msword') || 
                 (type.includes('document') && !type.includes('presentation') && !type.includes('spreadsheet'))) {
        category = 'word';
      } else if (type.includes('csv')) {
        category = 'csv';
      } else if (type.includes('text') || type.includes('plain')) {
        category = 'text';
      } else {
        category = 'other';
      }
      
      fileTypeBreakdown[category] = (fileTypeBreakdown[category] || 0) + 1;
    });
    
    res.json({
      totalDocuments,
      successfulDocuments: completedDocs.length,
      totalTasks,
      highConfidenceTasks,
      avgConfidence,
      avgTasksPerDocument: totalDocuments > 0 ? Math.round(totalTasks / totalDocuments * 10) / 10 : 0,
      avgProcessingTime,
      fileTypeBreakdown,
      avgUserRating: null // Not implemented yet
    });
  } catch (error) {
    console.error('Get processing stats error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.reprocessDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!document.userId.equals(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await attachmentProcessor.reprocessDocument(id);

    res.json({
      message: 'Document reprocessing started',
      documentId: id
    });
  } catch (error) {
    console.error('Reprocess document error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!document.userId.equals(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Soft delete
    document.deleted = true;
    document.deletedAt = new Date();
    await document.save();

    res.json({
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateTaskFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { taskIndex, feedback } = req.body;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!document.userId.equals(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add feedback
    document.feedback.push({
      taskIndex,
      ...feedback,
      feedbackDate: new Date()
    });

    await document.save();

    res.json({
      message: 'Feedback recorded successfully'
    });
  } catch (error) {
    console.error('Update task feedback error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
