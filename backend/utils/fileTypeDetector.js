const fileType = require('file-type');
const mimeTypes = require('mime-types');
const fs = require('fs').promises;
const path = require('path');

// Supported MIME types and their processors
const supportedTypes = {
  // PDF
  'application/pdf': { 
    ext: 'pdf', 
    processor: 'pdfProcessor',
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  
  // Microsoft Word
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { 
    ext: 'docx', 
    processor: 'wordProcessor',
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  'application/msword': { 
    ext: 'doc', 
    processor: 'wordProcessor',
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  
  // Microsoft Excel
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { 
    ext: 'xlsx', 
    processor: 'excelProcessor',
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  'application/vnd.ms-excel': { 
    ext: 'xls', 
    processor: 'excelProcessor',
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  
  // Text files
  'text/plain': { 
    ext: 'txt', 
    processor: 'textProcessor',
    maxSize: 1 * 1024 * 1024 // 1MB
  },
  'text/csv': { 
    ext: 'csv', 
    processor: 'csvProcessor',
    maxSize: 2 * 1024 * 1024 // 2MB
  },
  
  // Rich Text
  'application/rtf': { 
    ext: 'rtf', 
    processor: 'textProcessor',
    maxSize: 2 * 1024 * 1024 // 2MB
  }
};

class FileTypeDetector {
  /**
   * Check if a file type is supported
   */
  isSupported(mimeType) {
    return supportedTypes.hasOwnProperty(mimeType);
  }

  /**
   * Get processor for a file type
   */
  getProcessor(mimeType) {
    return supportedTypes[mimeType]?.processor;
  }

  /**
   * Get file extension for MIME type
   */
  getExtension(mimeType) {
    return supportedTypes[mimeType]?.ext || mimeTypes.extension(mimeType);
  }

  /**
   * Get max file size for type
   */
  getMaxSize(mimeType) {
    return supportedTypes[mimeType]?.maxSize || 5 * 1024 * 1024; // Default 5MB
  }

  /**
   * Validate file
   */
  async validateFile(filePath, declaredMimeType) {
    try {
      const stats = await fs.stat(filePath);
      
      // Check file exists
      if (!stats.isFile()) {
        throw new Error('Path is not a file');
      }

      // Check file size
      const maxSize = this.getMaxSize(declaredMimeType);
      if (stats.size > maxSize) {
        throw new Error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
      }

      // Verify actual file type matches declared type
      const fileTypeResult = await fileType.fromFile(filePath);
      if (fileTypeResult && fileTypeResult.mime !== declaredMimeType) {
        // Allow some flexibility for text files
        if (!declaredMimeType.startsWith('text/') || !fileTypeResult.mime.startsWith('text/')) {
          console.warn(`File type mismatch: declared ${declaredMimeType}, actual ${fileTypeResult.mime}`);
        }
      }

      return {
        valid: true,
        size: stats.size,
        actualMimeType: fileTypeResult?.mime || declaredMimeType
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Get all supported file types
   */
  getSupportedTypes() {
    return Object.keys(supportedTypes).map(mimeType => ({
      mimeType,
      extension: supportedTypes[mimeType].ext,
      maxSize: supportedTypes[mimeType].maxSize
    }));
  }

  /**
   * Check if file is likely to contain extractable text
   */
  isTextExtractable(mimeType) {
    const nonTextTypes = ['image/', 'video/', 'audio/'];
    return !nonTextTypes.some(type => mimeType.startsWith(type));
  }

  /**
   * Sanitize filename for storage
   */
  sanitizeFilename(filename) {
    // Remove special characters and spaces
    const base = path.basename(filename, path.extname(filename))
      .replace(/[^a-z0-9]/gi, '_')
      .substring(0, 50); // Limit length
    
    const ext = path.extname(filename);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    return `${base}_${timestamp}_${random}${ext}`;
  }

  /**
   * Get document type from content
   */
  async detectDocumentType(text) {
    const lowerText = text.toLowerCase();
    
    // Contract indicators
    if (lowerText.includes('agreement') || 
        lowerText.includes('contract') || 
        lowerText.includes('terms and conditions')) {
      return 'contract';
    }
    
    // Meeting minutes indicators
    if (lowerText.includes('meeting minutes') || 
        lowerText.includes('attendees') || 
        lowerText.includes('action items')) {
      return 'meeting-minutes';
    }
    
    // Project plan indicators
    if (lowerText.includes('project plan') || 
        lowerText.includes('timeline') || 
        lowerText.includes('milestone')) {
      return 'project-plan';
    }
    
    // Report indicators
    if (lowerText.includes('report') || 
        lowerText.includes('analysis') || 
        lowerText.includes('summary')) {
      return 'report';
    }
    
    return 'other';
  }
}

// Export singleton instance
module.exports = new FileTypeDetector();

// Also export the supported types for reference
module.exports.supportedTypes = supportedTypes;
