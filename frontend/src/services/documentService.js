import api from './api';

class DocumentService {
  /**
   * Upload and scan a single document
   * @param {File} file - Document file to upload
   * @param {Object} options - Processing options
   * @returns {Promise} API response
   */
  async scanDocument(file, options = {}) {
    const formData = new FormData();
    formData.append('document', file);
    
    // Add processing options
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value);
    });

    return api.post('/api/documents/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: options.onProgress,
    });
  }

  /**
   * Upload and scan multiple documents
   * @param {FileList|Array} files - Array of document files
   * @param {Object} options - Processing options
   * @returns {Promise} API response
   */
  async scanMultipleDocuments(files, options = {}) {
    const formData = new FormData();
    
    Array.from(files).forEach((file, index) => {
      formData.append('documents', file);
    });
    
    // Add processing options
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value);
    });

    return api.post('/api/documents/scan-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: options.onProgress,
    });
  }

  /**
   * Scan email attachments for tasks
   * @param {string} emailId - Email ID to process attachments
   * @returns {Promise} API response
   */
  async scanEmailAttachments(emailId) {
    return api.post(`/api/documents/scan-email-attachments/${emailId}`);
  }

  /**
   * Get document details by ID
   * @param {string} documentId - Document ID
   * @returns {Promise} API response
   */
  async getDocument(documentId) {
    return api.get(`/api/documents/document/${documentId}`);
  }

  /**
   * Get extracted tasks from a document
   * @param {string} documentId - Document ID
   * @returns {Promise} API response
   */
  async getDocumentTasks(documentId) {
    return api.get(`/api/documents/document/${documentId}/tasks`);
  }

  /**
   * Create tasks from selected extractions
   * @param {string} documentId - Document ID
   * @param {Array} selectedTasks - Array of selected task indices
   * @returns {Promise} API response
   */
  async createTasksFromExtractions(documentId, selectedTasks) {
    return api.post('/api/documents/tasks/create-from-extraction', {
      documentId,
      selectedTasks
    });
  }

  /**
   * Get user's document processing history
   * @param {Object} params - Query parameters (page, limit, etc.)
   * @returns {Promise} API response
   */
  async getUserDocuments(params = {}) {
    const queryParams = new URLSearchParams(params);
    return api.get(`/api/documents/user-documents?${queryParams}`);
  }

  /**
   * Get document processing statistics
   * @returns {Promise} API response
   */
  async getStats() {
    return api.get('/api/documents/stats');
  }

  /**
   * Reprocess a document with updated settings
   * @param {string} documentId - Document ID
   * @param {Object} options - Processing options
   * @returns {Promise} API response
   */
  async reprocessDocument(documentId, options = {}) {
    return api.post(`/api/documents/document/${documentId}/reprocess`, options);
  }

  /**
   * Delete a document and its extractions
   * @param {string} documentId - Document ID
   * @returns {Promise} API response
   */
  async deleteDocument(documentId) {
    return api.delete(`/api/documents/document/${documentId}`);
  }

  /**
   * Submit feedback on task extraction quality
   * @param {string} documentId - Document ID
   * @param {Object} feedback - Feedback data
   * @returns {Promise} API response
   */
  async submitFeedback(documentId, feedback) {
    return api.post(`/api/documents/document/${documentId}/feedback`, feedback);
  }

  /**
   * Get supported file types and processing capabilities
   * @returns {Object} Supported file types configuration
   */
  getSupportedFileTypes() {
    return {
      pdf: {
        mimeTypes: ['application/pdf'],
        maxSize: 50 * 1024 * 1024, // 50MB
        description: 'PDF documents'
      },
      word: {
        mimeTypes: [
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword'
        ],
        maxSize: 25 * 1024 * 1024, // 25MB
        description: 'Microsoft Word documents'
      },
      excel: {
        mimeTypes: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel'
        ],
        maxSize: 25 * 1024 * 1024, // 25MB
        description: 'Microsoft Excel spreadsheets'
      },
      csv: {
        mimeTypes: ['text/csv'],
        maxSize: 10 * 1024 * 1024, // 10MB
        description: 'CSV files'
      },
      text: {
        mimeTypes: ['text/plain'],
        maxSize: 5 * 1024 * 1024, // 5MB
        description: 'Text files'
      }
    };
  }

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  validateFile(file) {
    const supportedTypes = this.getSupportedFileTypes();
    const allMimeTypes = Object.values(supportedTypes)
      .flatMap(type => type.mimeTypes);
    
    const maxSizes = Object.values(supportedTypes)
      .reduce((acc, type) => ({
        ...acc,
        ...type.mimeTypes.reduce((mimeAcc, mime) => ({
          ...mimeAcc,
          [mime]: type.maxSize
        }), {})
      }), {});

    // Check file type
    if (!allMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported file type: ${file.type}`,
        code: 'UNSUPPORTED_TYPE'
      };
    }

    // Check file size
    const maxSize = maxSizes[file.type];
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
        code: 'FILE_TOO_LARGE'
      };
    }

    return {
      valid: true,
      fileType: Object.keys(supportedTypes).find(type => 
        supportedTypes[type].mimeTypes.includes(file.type)
      )
    };
  }
}

export default new DocumentService();
