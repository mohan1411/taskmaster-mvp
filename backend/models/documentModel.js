const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  // File information
  originalName: { 
    type: String, 
    required: true,
    trim: true
  },
  filename: {
    type: String,
    required: true,
    unique: true
  },
  mimeType: { 
    type: String, 
    required: true 
  },
  size: { 
    type: Number, 
    required: true 
  },
  path: {
    type: String,
    required: true
  },
  
  // Relationships
  emailId: {
    type: String,  // Changed to accept both ObjectId and string formats
    index: true
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  
  // Processing results
  extractedText: { 
    type: String,
    maxlength: 50000 // Limit to prevent huge documents
  },
  
  extractedTasks: [{
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    description: {
      type: String,
      maxlength: 1000
    },
    dueDate: Date,
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    confidence: { 
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    sourceText: {
      type: String,
      maxlength: 500
    },
    lineNumber: Number,
    assignee: String
  }],
  
  // Processing status
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  processingError: String,
  processingStartedAt: Date,
  processingCompletedAt: Date,
  
  // Metadata
  metadata: {
    pageCount: Number,
    wordCount: Number,
    hasDeadlines: Boolean,
    language: {
      type: String,
      default: 'en'
    },
    documentType: {
      type: String,
      enum: ['contract', 'meeting-minutes', 'project-plan', 'email', 'report', 'other']
    },
    extractionVersion: {
      type: String,
      default: '1.0'
    }
  },
  
  // User feedback for improving extraction
  feedback: [{
    taskIndex: Number,
    wasHelpful: Boolean,
    correctedTitle: String,
    correctedDueDate: Date,
    correctedPriority: String,
    feedbackDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Soft delete
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes for performance
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ emailId: 1 });
documentSchema.index({ processingStatus: 1 });
documentSchema.index({ 'extractedTasks.dueDate': 1 });
documentSchema.index({ deleted: 1 });

// Virtual for processing duration
documentSchema.virtual('processingDuration').get(function() {
  if (this.processingStartedAt && this.processingCompletedAt) {
    return this.processingCompletedAt - this.processingStartedAt;
  }
  return null;
});

// Methods
documentSchema.methods.markAsProcessing = function() {
  this.processingStatus = 'processing';
  this.processingStartedAt = new Date();
  return this.save();
};

documentSchema.methods.markAsCompleted = function(extractedData) {
  this.processingStatus = 'completed';
  this.processingCompletedAt = new Date();
  this.extractedText = extractedData.text;
  this.extractedTasks = extractedData.tasks;
  this.metadata = extractedData.metadata;
  return this.save();
};

documentSchema.methods.markAsFailed = function(error) {
  this.processingStatus = 'failed';
  this.processingError = error.message;
  this.processingCompletedAt = new Date();
  return this.save();
};

// Statics
documentSchema.statics.findByEmail = function(emailId) {
  return this.find({ emailId, deleted: false });
};

documentSchema.statics.findPendingDocuments = function() {
  return this.find({ processingStatus: 'pending', deleted: false })
    .sort('createdAt')
    .limit(10);
};

// Clean up old processed documents
documentSchema.statics.cleanupOldDocuments = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.updateMany(
    {
      processingStatus: 'completed',
      createdAt: { $lt: cutoffDate }
    },
    {
      deleted: true,
      deletedAt: new Date()
    }
  );
};

module.exports = mongoose.model('Document', documentSchema);
