const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const documentController = require('../controllers/documentController');
const documentControllerSync = require('../controllers/documentControllerSync');
const { protect } = require('../middleware/authMiddleware');
const fileTypeDetector = require('../utils/fileTypeDetector');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/documents');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const sanitizedName = fileTypeDetector.sanitizeFilename(file.originalname);
    cb(null, sanitizedName);
  }
});

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB default limit
    files: 5 // Max 5 files at once
  },
  fileFilter: (req, file, cb) => {
    // Check if file type is supported
    if (fileTypeDetector.isSupported(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Supported types: PDF, Word, Excel, Text, CSV`));
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum 5 files at once.' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Routes

// Upload and scan a document (synchronous processing)
router.post('/scan', 
  protect, 
  upload.single('document'), 
  handleMulterError,
  documentControllerSync.scanDocumentSynchronous
);

// Upload and scan multiple documents
router.post('/scan-multiple', 
  protect, 
  upload.array('documents', 5), 
  handleMulterError,
  documentController.scanMultipleDocuments
);

// Scan email attachments
router.post('/scan-email-attachments/:emailId', 
  protect, 
  documentController.scanEmailAttachments
);

// Get document details
router.get('/document/:id', 
  protect, 
  documentController.getDocument
);

// Get extracted tasks from a document
router.get('/document/:id/tasks', 
  protect, 
  documentController.getExtractedTasks
);

// Create tasks from extracted data
router.post('/tasks/create-from-extraction', 
  protect, 
  documentController.createTasksFromExtraction
);

// Get all documents for user
router.get('/user-documents', 
  protect, 
  documentController.getUserDocuments
);

// Get processing statistics
router.get('/stats', 
  protect, 
  documentController.getProcessingStats
);

// Reprocess a document
router.post('/document/:id/reprocess', 
  protect, 
  documentController.reprocessDocument
);

// Delete a document
router.delete('/document/:id', 
  protect, 
  documentController.deleteDocument
);

// Update task feedback (for improving extraction)
router.post('/document/:id/feedback', 
  protect, 
  documentController.updateTaskFeedback
);

// Get supported file types
router.get('/supported-types', (req, res) => {
  res.json({
    supportedTypes: fileTypeDetector.getSupportedTypes(),
    maxFileSize: '10MB',
    maxFiles: 5
  });
});

module.exports = router;
