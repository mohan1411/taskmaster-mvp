const { createLogger } = require('../utils/logger');
const logger = createLogger('ImprovedSimpleParser');

class ImprovedSimpleParser {
  parseDocument(text) {
    logger.debug('Using enhanced simple parser...');
    
    // Log the first part of the text for debugging
    console.log('\n[IMPROVED PARSER] Received text for parsing:');
    console.log('=====================================');
    console.log(text.substring(0, 800)); // First 800 chars
    console.log('=====================================');
    console.log(`Total text length: ${text.length} characters`);
    
    const lines = text.split(/\r?\n/);
    console.log(`[IMPROVED PARSER] Split into ${lines.length} lines`);
    
    // Log first 10 non-empty lines
    console.log('\n[IMPROVED PARSER] First 10 non-empty lines:');
    let nonEmptyCount = 0;
    for (let i = 0; i < lines.length && nonEmptyCount < 10; i++) {
      if (lines[i].trim()) {
        console.log(`Line ${i + 1}: "${lines[i]}"`);
        nonEmptyCount++;
      }
    }
    
    const tasks = [];
    let currentTask = null;
    let inSubItems = false;
    
    // Enhanced patterns for main tasks
    const mainTaskPatterns = [
      { regex: /^(\d+)\.\s+(.+)/, type: 'numbered' },
      { regex: /^[-*•]\s+(.+)/, type: 'bullet' },
      { regex: /^(TODO|TASK|ACTION|URGENT|ASAP):\s*(.+)/i, type: 'explicit' },
      { regex: /^(Complete|Review|Update|Schedule|Send|Create|Follow up|Prepare|Submit|File|Process|Analyze|Research|Draft|Write|Fix|Implement|Check|Confirm)\s+(.+)/i, type: 'action' },
      // New patterns for the PDF content
      { regex: /^(.+?)\s*-\s*(Due|By|Before|Deadline):\s*(.+)/i, type: 'with-deadline' },
      { regex: /^(.+?)\s*-\s*(Priority|Level):\s*(High|Medium|Low|Urgent)/i, type: 'with-priority' },
      { regex: /^(Need to|Must|Should|Has to|Have to)\s+(.+)/i, type: 'imperative' },
      { regex: /^(.+?)\s*-\s*[A-Z]\w+\s+\d{1,2},?\s+\d{4}/i, type: 'task-with-date' },
      // Handle potential PDF formatting issues
      { regex: /^\d+\s+\d+\s+(TODO|TASK|ACTION):\s*(.+)/i, type: 'pdf-formatted' },
      { regex: /^\d+\s+(.+?)\s+(TODO|TASK|ACTION):\s*(.+)/i, type: 'pdf-formatted-2' }
    ];
    
    // Patterns for sub-items (should be grouped with parent)
    const subItemPatterns = [
      /^\s+[-*•]\s+/,
      /^\s{2,}[-*•]?\s*/,
      /^[a-z]\)\s+/i
    ];
    
    // Priority keywords - enhanced
    const priorityKeywords = {
      urgent: ['urgent', 'asap', 'immediately', 'critical', 'today', 'end of day', 'eod'],
      high: ['high', 'important', 'priority', 'by tomorrow', 'soon', 'before'],
      medium: ['medium', 'normal', 'standard', 'next week'],
      low: ['low', 'minor', 'when possible', 'eventually']
    };
    
    // Date patterns
    const datePatterns = [
      /(?:by|before|due|deadline:?|until)\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
      /(?:by|before|due|deadline:?|until)\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?)/i,
      /(?:by|before|due|deadline:?|until)\s+(today|tomorrow|next\s+\w+|end\s+of\s+\w+)/i,
      /(\w+\s+\d{1,2},?\s+\d{4})/,
      /(December|January|February|March|April|May|June|July|August|September|October|November)\s+\d{1,2}/i
    ];
    
    // Process lines
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 3) {
        // Empty line might signal end of sub-items
        if (currentTask && inSubItems) {
          inSubItems = false;
        }
        return;
      }
      
      // Skip common headers and section titles
      if (trimmed.match(/^(Notes?|Agenda|Meeting|Project|Status|Update|Report|Summary)\s*:?$/i)) {
        return;
      }
      
      // Check if this is a sub-item
      const isSubItem = subItemPatterns.some(pattern => pattern.test(line));
      
      if (isSubItem && currentTask) {
        // Add to current task's description
        currentTask.description += '\n' + trimmed;
        currentTask.sourceText += '\n' + line;
        inSubItems = true;
        return;
      }
      
      // Check for main task patterns
      let taskFound = false;
      
      for (const pattern of mainTaskPatterns) {
        const match = trimmed.match(pattern.regex);
        if (match) {
          console.log(`[PARSER MATCH] Line ${index + 1} matched pattern "${pattern.type}": "${trimmed}"`);
          
          // Save previous task if exists
          if (currentTask && currentTask.title.length > 5) {
            console.log(`[PARSER] Saving previous task: "${currentTask.title}"`);
            tasks.push(this.finalizeTask(currentTask));
          }
          
          // Extract task title based on pattern type
          let title = '';
          if (pattern.type === 'numbered') {
            title = match[2];
          } else if (pattern.type === 'bullet') {
            title = match[1];
          } else if (pattern.type === 'explicit' || pattern.type === 'action') {
            title = match[2] || match[1];
          } else if (pattern.type === 'with-deadline' || pattern.type === 'with-priority' || pattern.type === 'task-with-date') {
            title = match[1];
          } else if (pattern.type === 'imperative') {
            title = trimmed;
          } else if (pattern.type === 'pdf-formatted') {
            // Handle "3 3 TODO: Complete..." format
            title = match[2];
            console.log(`[PARSER] PDF-formatted task detected: "${title}"`);
          } else if (pattern.type === 'pdf-formatted-2') {
            // Handle "3 Something TODO: Complete..." format
            title = match[3];
            console.log(`[PARSER] PDF-formatted-2 task detected: "${title}"`);
          } else {
            title = match[2] || match[1] || trimmed;
          }
          
          title = title.trim();
          
          // Determine priority
          let priority = 'medium';
          const lowerText = trimmed.toLowerCase();
          
          if (pattern.type === 'explicit' && match[1] && match[1].toUpperCase() === 'URGENT') {
            priority = 'urgent';
          } else {
            for (const [level, keywords] of Object.entries(priorityKeywords)) {
              if (keywords.some(keyword => lowerText.includes(keyword))) {
                priority = level;
                break;
              }
            }
          }
          
          // Extract due date
          let dueDate = null;
          for (const datePattern of datePatterns) {
            const dateMatch = trimmed.match(datePattern);
            if (dateMatch) {
              dueDate = this.parseDate(dateMatch[1]);
              if (dueDate) break;
            }
          }
          
          // Create new task
          currentTask = {
            title: title.substring(0, 200),
            description: '',
            priority: priority,
            confidence: this.calculateConfidence(pattern.type, trimmed),
            lineNumber: index + 1,
            sourceText: line,
            assignee: null,
            dueDate: dueDate
          };
          
          taskFound = true;
          inSubItems = false;
          break;
        }
      }
      
      // If no explicit pattern matched, check for task-like content
      if (!taskFound && !currentTask) {
        // Look for lines that might be tasks based on content
        if (this.looksLikeTask(trimmed)) {
          if (currentTask) {
            tasks.push(this.finalizeTask(currentTask));
          }
          
          currentTask = {
            title: trimmed.substring(0, 200),
            description: '',
            priority: this.detectPriority(trimmed),
            confidence: 60,
            lineNumber: index + 1,
            sourceText: line,
            assignee: null,
            dueDate: this.extractDateFromLine(trimmed)
          };
        }
      }
    });
    
    // Don't forget the last task
    if (currentTask && currentTask.title.length > 5) {
      console.log(`[PARSER] Saving final task: "${currentTask.title}"`);
      tasks.push(this.finalizeTask(currentTask));
    }
    
    // Filter and deduplicate
    console.log(`\n[PARSER] Before filtering: ${tasks.length} tasks found`);
    tasks.forEach((task, index) => {
      console.log(`  Task ${index + 1}: "${task.title}" (line: ${task.lineNumber}, confidence: ${task.confidence})`);
    });
    
    logger.debug(`Before filtering: ${tasks.length} tasks found`);
    const filteredTasks = this.filterAndDeduplicate(tasks);
    
    console.log(`\n[PARSER] After filtering: ${filteredTasks.length} tasks`);
    filteredTasks.forEach((task, index) => {
      console.log(`  Task ${index + 1}: "${task.title}" (priority: ${task.priority}, due: ${task.dueDate || 'none'})`);
    });
    
    logger.info(`Enhanced parser found ${filteredTasks.length} tasks after filtering`);
    // Log first few tasks for debugging
    if (process.env.NODE_ENV !== 'production') {
      filteredTasks.slice(0, 3).forEach((task, index) => {
        logger.debug(`Task ${index + 1}: "${task.title}" (confidence: ${task.confidence}, priority: ${task.priority})`);
      });
    }
    
    return filteredTasks;
  }
  
  looksLikeTask(text) {
    // Check if line looks like a task
    const taskIndicators = [
      /^[A-Z]/,  // Starts with capital letter
      /\b(complete|review|update|schedule|fix|prepare|submit|create|implement|check|confirm|analyze|send|follow)\b/i,
      /\b(task|todo|action|deliverable|requirement|need|must)\b/i,
      /\b(by|before|due|deadline|until)\b/i
    ];
    
    // Must match at least 2 indicators
    let matches = 0;
    for (const indicator of taskIndicators) {
      if (indicator.test(text)) matches++;
    }
    
    return matches >= 2 && text.length > 10 && text.length < 300;
  }
  
  detectPriority(text) {
    const lower = text.toLowerCase();
    if (lower.includes('urgent') || lower.includes('asap') || lower.includes('critical')) return 'urgent';
    if (lower.includes('high') || lower.includes('important') || lower.includes('priority')) return 'high';
    if (lower.includes('low') || lower.includes('minor')) return 'low';
    return 'medium';
  }
  
  parseDate(dateStr) {
    if (!dateStr) return null;
    
    try {
      // Handle relative dates
      const lower = dateStr.toLowerCase();
      const today = new Date();
      
      if (lower === 'today' || lower === 'end of day') {
        return today.toISOString().split('T')[0];
      }
      if (lower === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      }
      
      // Handle month + day format
      const monthDayMatch = dateStr.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})/i);
      if (monthDayMatch) {
        const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        const monthIndex = months.indexOf(monthDayMatch[1].toLowerCase());
        const day = parseInt(monthDayMatch[2]);
        const year = new Date().getFullYear();
        
        // If the date is in the past, assume next year
        const date = new Date(year, monthIndex, day);
        if (date < today) {
          date.setFullYear(year + 1);
        }
        
        return date.toISOString().split('T')[0];
      }
      
      // Try to parse as regular date
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('Date parsing error:', error);
    }
    
    return null;
  }
  
  extractDateFromLine(text) {
    const datePatterns = [
      /(?:by|before|due|deadline:?|until)\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
      /(?:by|before|due|deadline:?|until)\s+([A-Za-z]+\s+\d{1,2})/i,
      /(December|January|February|March|April|May|June|July|August|September|October|November)\s+\d{1,2},?\s+\d{4}/i
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        return this.parseDate(match[1]);
      }
    }
    
    return null;
  }
  
  calculateConfidence(patternType, text) {
    let confidence = 70;
    
    // Pattern type bonuses
    const patternScores = {
      'numbered': 90,
      'explicit': 95,
      'urgent': 95,
      'action': 85,
      'bullet': 75,
      'with-deadline': 90,
      'with-priority': 85,
      'imperative': 80,
      'task-with-date': 85
    };
    
    if (patternScores[patternType]) {
      confidence = patternScores[patternType];
    }
    
    // Additional bonuses
    if (text.match(/\b(urgent|asap|critical)\b/i)) confidence += 5;
    if (text.match(/\b\d{4}\b/)) confidence += 5;  // Has year
    if (text.match(/\b(high|medium|low)\s*priority\b/i)) confidence += 5;
    
    return Math.min(confidence, 100);
  }
  
  finalizeTask(task) {
    // Clean up the task before adding it
    task.title = task.title.trim();
    task.description = task.description.trim();
    
    // Remove priority/date info from title if it's already extracted
    if (task.dueDate) {
      task.title = task.title.replace(/[-–]?\s*(by|before|due|deadline:?).*$/i, '').trim();
    }
    if (task.priority !== 'medium') {
      task.title = task.title.replace(/[-–]?\s*(priority|urgency|level):?\s*(high|medium|low|urgent)/i, '').trim();
    }
    
    return task;
  }
  
  filterAndDeduplicate(tasks) {
    // Filter out non-tasks
    const filtered = tasks.filter(task => {
      const title = task.title.toLowerCase();
      
      // Skip section headers and metadata
      if (title.match(/^(notes?|agenda|meeting|project status|update|report|summary|deadlines?|action items?|upcoming|notes from)\s*:?$/i)) {
        return false;
      }
      
      // Skip if too short
      if (task.title.length < 5) return false;
      
      // Skip if it's just a date or time
      if (title.match(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}:\d{2})/i)) {
        return false;
      }
      
      return true;
    });
    
    // Remove duplicates (keep the one with highest confidence)
    const uniqueTasks = [];
    const seen = new Set();
    
    filtered.sort((a, b) => b.confidence - a.confidence);
    
    for (const task of filtered) {
      const key = task.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTasks.push(task);
      }
    }
    
    // Sort by line number to maintain document order
    uniqueTasks.sort((a, b) => a.lineNumber - b.lineNumber);
    
    return uniqueTasks;
  }
}

module.exports = new ImprovedSimpleParser();
