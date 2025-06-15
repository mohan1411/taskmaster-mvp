const Document = require('../models/documentModel');
const attachmentProcessor = require('../services/attachmentProcessor');
const fileTypeDetector = require('../utils/fileTypeDetector');

const scanDocumentSynchronous = async (req, res) => {
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

    try {
      // Process document SYNCHRONOUSLY
      console.log(`Processing document synchronously: ${file.originalname}`);
      const processedDocument = await attachmentProcessor.processDocument(document._id, file.path);

      // Get the updated document with extracted tasks
      const updatedDocument = await Document.findById(document._id);

      if (!updatedDocument || updatedDocument.processingStatus === 'failed') {
        return res.status(500).json({ 
          error: 'Document processing failed',
          details: updatedDocument?.processingError || 'Unknown error'
        });
      }

      // Return extracted tasks immediately
      res.json({
        message: 'Document processed successfully',
        document: {
          id: updatedDocument._id,
          filename: updatedDocument.originalName,
          status: updatedDocument.processingStatus
        },
        tasksExtracted: updatedDocument.extractedTasks.length,
        extractedTasks: updatedDocument.extractedTasks.map((task, index) => ({
          id: index,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          priority: task.priority,
          confidence: task.confidence,
          assignee: task.assignee,
          sourceText: task.sourceText
        }))
      });

    } catch (processingError) {
      console.error('Document processing error:', processingError);
      
      // Update document as failed
      await Document.findByIdAndUpdate(document._id, {
        processingStatus: 'failed',
        processingError: processingError.message
      });

      res.status(500).json({
        error: 'Document processing failed',
        details: processingError.message,
        document: {
          id: document._id,
          filename: document.originalName,
          status: 'failed'
        }
      });
    }

  } catch (error) {
    console.error('Scan document error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { scanDocumentSynchronous };
