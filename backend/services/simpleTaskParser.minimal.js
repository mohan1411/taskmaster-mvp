const { patterns, helpers } = require('../utils/taskPatterns'); 
 
class SimpleTaskParser { 
  async parseDocument(text, context = {}) { 
    console.log('SimpleTaskParser: Processing text length:', text.length); 
    const tasks = []; 
    const lines = text.split('\n'); 
 
    // Simple pattern matching 
    const simplePatterns = [ 
      /TODO:\s*(.+)/i, 
      /needs? to\s+(.+)/i, 
      /must\s+(.+)/i, 
      /should\s+(.+)/i, 
      /[•·▪▫◦‣⁃*-]\s+(.+)/, 
      /\d+[.)]\s+(.+)/, 
      /Action:\s*(.+)/i, 
      /Task:\s*(.+)/i 
    ]; 
 
    lines.forEach((line, index) => { 
      const trimmed = line.trim(); 
      if (!trimmed) return; 
 
      for (const pattern of simplePatterns) { 
        const match = trimmed.match(pattern); 
        if (match && match[1]) { 
          const title = match[1].trim(); 
          if (title.length > 3) { 
            tasks.push({ 
              title: title, 
              description: trimmed, 
              priority: 'medium', 
              confidence: 75, 
              lineNumber: index + 1 
            }); 
            console.log('Found task:', title); 
            break; 
          } 
        } 
      } 
    }); 
 
    console.log('SimpleTaskParser: Found', tasks.length, 'tasks'); 
    return tasks; 
  } 
} 
 
module.exports = new SimpleTaskParser(); 
