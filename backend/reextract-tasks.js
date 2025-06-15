const mongoose = require('mongoose');
const Document = require('./models/documentModel');
const documentExtractor = require('./services/documentExtractor');
const fs = require('fs').promises;
require('dotenv').config();

/**
 * Re-extract tasks from the PDF with detailed parsing
 */

async function reextractTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find the document
    console.log('=== FINDING DOCUMENT ===');
    const doc = await Document.findOne({ 
      originalName: 'tas1.pdf',
      emailId: '6846ec5bf942d13795181e5c'
    });
    
    if (!doc) {
      console.log('❌ Document not found!');
      await mongoose.connection.close();
      return;
    }
    
    console.log('✅ Found document:');
    console.log('   ID:', doc._id);
    console.log('   Path:', doc.path);
    console.log('   Current tasks:', doc.extractedTasks?.length || 0);
    
    if (doc.extractedTasks && doc.extractedTasks.length > 0) {
      console.log('\n📋 Current extracted tasks:');
      doc.extractedTasks.forEach((task, i) => {
        console.log(`   ${i + 1}. ${task.title}`);
      });
    }
    
    // Extract text from PDF
    console.log('\n\n=== EXTRACTING TEXT FROM PDF ===');
    
    try {
      const result = await documentExtractor.extractFromFile(doc.path, 'application/pdf');
      console.log('✅ Text extracted successfully');
      console.log('   Text length:', result.text.length);
      console.log('\n📄 PDF Content:');
      console.log('-----------------------------------');
      console.log(result.text);
      console.log('-----------------------------------');
      
      // Manual task extraction with comprehensive patterns
      console.log('\n\n=== EXTRACTING TASKS ===');
      
      const tasks = [];
      const lines = result.text.split(/\r?\n/);
      
      // Task patterns
      const patterns = {
        // TODO pattern
        todo: /TODO:\s*(.+)/i,
        // Numbered items
        numbered: /^(\d+)\.\s+(.+)/,
        // Bullet points
        bullet: /^[-•*]\s+(.+)/,
        // Action verbs
        action: /^(Complete|Review|Update|Schedule|Send|Create|Follow up|Prepare|Submit|Fix|Implement|Check|Confirm|Contact|Document|Analyze)\s+(.+)/i,
        // URGENT/ASAP
        urgent: /^(URGENT|ASAP):\s*(.+)/i,
        // Due date patterns
        dueDate: /(.+?)(?:\s*[-–]\s*)?(Due|By|Before|Deadline:?)?\s*(December|January|February|March|April|May|June|July|August|September|October|November)\s+(\d{1,2}),?\s*(\d{4})?/i,
        // Priority patterns
        priority: /(.+?)\s*[-–]\s*(Priority|Level):\s*(High|Medium|Low|Urgent)/i,
        // Need/Must patterns
        need: /^(Need to|Must|Should|Have to|Has to)\s+(.+)/i
      };
      
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.length < 5) return;
        
        let task = null;
        let dueDate = null;
        let priority = 'medium';
        
        // Check each pattern
        for (const [type, pattern] of Object.entries(patterns)) {
          const match = trimmed.match(pattern);
          if (match) {
            if (type === 'todo') {
              task = { title: match[1].trim(), priority: 'high' };
            } else if (type === 'numbered') {
              task = { title: match[2].trim() };
            } else if (type === 'bullet') {
              task = { title: match[1].trim() };
            } else if (type === 'action' || type === 'need') {
              task = { title: trimmed };
            } else if (type === 'urgent') {
              task = { title: match[2] || match[1], priority: 'urgent' };
            } else if (type === 'dueDate') {
              const title = match[1].trim();
              const month = match[3];
              const day = match[4];
              const year = match[5] || new Date().getFullYear();
              
              // Convert month name to number
              const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
              const monthNum = months.indexOf(month.toLowerCase()) + 1;
              
              if (monthNum > 0) {
                dueDate = `${year}-${monthNum.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
              
              task = { title, dueDate };
            } else if (type === 'priority') {
              task = { title: match[1].trim(), priority: match[3].toLowerCase() };
            }
            
            if (task) break;
          }
        }
        
        // Check for priority keywords in any line
        if (task && !task.priority) {
          const lower = trimmed.toLowerCase();
          if (lower.includes('urgent') || lower.includes('asap')) priority = 'urgent';
          else if (lower.includes('high') || lower.includes('important')) priority = 'high';
          else if (lower.includes('low') || lower.includes('minor')) priority = 'low';
          task.priority = priority;
        }
        
        if (task) {
          // Clean up the title
          task.title = task.title
            .replace(/[-–]\s*(Due|By|Before|Deadline:?).*/i, '')
            .replace(/[-–]\s*(Priority|Level:?).*/i, '')
            .trim();
          
          tasks.push({
            ...task,
            lineNumber: index + 1,
            sourceText: trimmed,
            confidence: 85
          });
          
          console.log(`\n✅ Found task: ${task.title}`);
          if (task.dueDate) console.log(`   Due: ${task.dueDate}`);
          if (task.priority !== 'medium') console.log(`   Priority: ${task.priority}`);
        }
      });
      
      console.log(`\n\n📊 Total tasks found: ${tasks.length}`);
      
      // Update the document
      console.log('\n=== UPDATING DOCUMENT ===');
      
      doc.extractedTasks = tasks;
      doc.processingStatus = 'completed';
      doc.metadata = {
        ...doc.metadata,
        reprocessedAt: new Date(),
        taskCount: tasks.length
      };
      
      await doc.save();
      console.log('✅ Document updated with new tasks');
      
      // Verify
      const updated = await Document.findById(doc._id);
      console.log('\n📋 Final task count:', updated.extractedTasks.length);
      
    } catch (error) {
      console.error('❌ Error processing PDF:', error);
    }
    
    await mongoose.connection.close();
    
    console.log('\n\n================================================');
    console.log('✅ Re-extraction complete!');
    console.log('================================================');
    console.log('\nGo back to the browser and click');
    console.log('"Extract Tasks from 1 Document" again.');
    console.log('\nYou should now see all the tasks from the PDF.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

console.log('🔧 Re-extracting tasks from PDF...\n');
reextractTasks();
