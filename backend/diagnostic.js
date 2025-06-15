const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

async function diagnoseAndFix() {
  console.log('=== DIAGNOSTIC: Task Extraction Issue ===\n');
  console.log('Working directory:', process.cwd());
  
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmaster';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');
    
    // Load models
    const Document = require('./models/documentModel');
    const Task = require('./models/taskModel');
    
    // Find latest document
    const latestDoc = await Document.findOne().sort({ createdAt: -1 });
    
    if (!latestDoc) {
      console.log('No documents found in database');
      return;
    }
    
    console.log('Latest document:');
    console.log('- Name:', latestDoc.originalName);
    console.log('- Status:', latestDoc.processingStatus);
    console.log('- Has extracted text?', !!latestDoc.extractedText);
    console.log('- Extracted text length:', latestDoc.extractedText?.length || 0);
    console.log('- Tasks in document:', latestDoc.extractedTasks?.length || 0);
    
    if (latestDoc.extractedText) {
      console.log('\nExtracted text content:');
      console.log('---START---');
      console.log(latestDoc.extractedText);
      console.log('---END---\n');
      
      // Try to extract tasks manually
      console.log('Attempting manual task extraction...\n');
      
      const tasks = [];
      const lines = latestDoc.extractedText.split(/\r?\n/);
      
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.length < 3) return;
        
        let matched = false;
        let title = '';
        let priority = 'medium';
        
        // Check patterns
        if (trimmed.match(/TODO:/i)) {
          title = trimmed.replace(/TODO:\s*/i, '').trim();
          matched = true;
        } else if (trimmed.match(/\b(needs?|must|should)\s+/i)) {
          title = trimmed;
          priority = 'high';
          matched = true;
        } else if (trimmed.match(/^[-•*]\s+/)) {
          title = trimmed.replace(/^[-•*]\s+/, '').trim();
          matched = true;
        } else if (trimmed.match(/^(Action|Task):/i)) {
          title = trimmed.replace(/^(Action|Task):\s*/i, '').trim();
          priority = 'high';
          matched = true;
        } else if (trimmed.match(/URGENT:/i)) {
          title = trimmed.replace(/URGENT:\s*/i, '').trim();
          priority = 'urgent';
          matched = true;
        }
        
        if (matched && title) {
          tasks.push({
            title: title,
            description: trimmed,
            priority: priority,
            confidence: 80,
            lineNumber: index + 1,
            sourceText: trimmed
          });
          console.log(`✓ Found task: "${title}" (${priority})`);
        }
      });
      
      console.log(`\nTotal tasks found: ${tasks.length}`);
      
      if (tasks.length > 0 && latestDoc.extractedTasks.length === 0) {
        console.log('\nUpdating document with extracted tasks...');
        latestDoc.extractedTasks = tasks;
        await latestDoc.save();
        console.log('✓ Document updated');
        
        // Also create real tasks
        console.log('\nCreating tasks in task collection...');
        for (const task of tasks) {
          const newTask = await Task.create({
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: 'pending',
            userId: latestDoc.userId,
            createdBy: latestDoc.userId,
            source: 'document',
            documentId: latestDoc._id
          });
          console.log(`✓ Created task: ${newTask.title}`);
        }
      }
    } else {
      console.log('\n❌ No text extracted from document!');
      console.log('The document extractor is not working properly.');
      
      // Check if file exists
      if (latestDoc.path) {
        console.log('\nChecking if file exists:', latestDoc.path);
        if (fs.existsSync(latestDoc.path)) {
          console.log('✓ File exists');
          
          // Try to read it
          const content = fs.readFileSync(latestDoc.path, 'utf8');
          console.log('File content preview:', content.substring(0, 200));
        } else {
          console.log('✗ File not found');
        }
      }
    }
    
    // Check parser configuration
    console.log('\n--- Configuration ---');
    console.log('DOCUMENT_PARSER_MODE:', process.env.DOCUMENT_PARSER_MODE || 'not set');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
    
  } catch (error) {
    console.error('\nError:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Diagnostic complete');
  }
}

// Run the diagnostic
diagnoseAndFix();
