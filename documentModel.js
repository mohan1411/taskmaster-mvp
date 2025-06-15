❌ documentModel.js is missing! Creating it...
const mongoose = require('mongoose'
 
const documentSchema = new mongoose.Schema({ 
  originalName: { type: String, required: true }, 
  filename: { type: String, required: true }, 
  mimeType: { type: String, required: true }, 
  size: { type: Number, required: true }, 
  path: { type: String, required: true }, 
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  emailId: { type: mongoose.Schema.Types.ObjectId, ref: 'Email' }, 
  processingStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending' 
  }, 
  processingError: { type: String }, 
  processingDuration: { type: Number }, 
  extractedText: { type: String }, 
  extractedTasks: [{ 
    title: String, 
    description: String, 
    dueDate: Date, 
    priority: String, 
    assignee: String, 
    confidence: Number, 
    sourceText: String, 
    lineNumber: Number 
  }], 
  metadata: { type: mongoose.Schema.Types.Mixed }, 
  deleted: { type: Boolean, default: false } 
}, { 
  timestamps: true 
}); 
 
documentSchema.methods.markAsProcessing = function() { 
  this.processingStatus = 'processing'; 
  this.processingStartedAt = new Date(); 
  return this.save(); 
}; 
 
documentSchema.methods.markAsCompleted = function(data) { 
  this.processingStatus = 'completed'; 
  this.extractedText = data.text; 
  this.extractedTasks = data.tasks; 
  this.metadata = data.metadata; 
  this.processingDuration = Date.now() - this.processingStartedAt; 
  return this.save(); 
}; 
 
documentSchema.methods.markAsFailed = function(error) { 
  this.processingStatus = 'failed'; 
  this.processingError = error.message; 
  return this.save(); 
}; 
 
documentSchema.statics.findPendingDocuments = function() { 
  return this.find({ processingStatus: 'pending' }); 
}; 
 
module.exports = mongoose.model('Document', documentSchema); 
