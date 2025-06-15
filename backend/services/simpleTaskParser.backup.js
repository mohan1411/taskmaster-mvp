const { patterns, helpers } = require('../utils/taskPatterns');

class SimpleTaskParser {
  /**
   * Parse document without OpenAI - pattern-based extraction only
   */
  async parseDocument(text, context = {}) {
    try {
      const tasks = [];
      
      console.log('SimpleTaskParser: Processing text length:', text.length);
      
      // First, check if we have structured data (from Excel/CSV)
      if (context.structured && Array.isArray(context.structured)) {
        console.log('SimpleTaskParser: Processing structured data');
        const structuredTasks = this.processStructuredData(context.structured);
        tasks.push(...structuredTasks);
        console.log('SimpleTaskParser: Found', structuredTasks.length, 'structured tasks');
      }

      // Split text into lines for pattern matching
      const lines = text.split('\n');
      const processedTitles = new Set();
      
      console.log('SimpleTaskParser: Processing', lines.length, 'lines');
      
      // Process each line for task patterns
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.length < 5) continue;
        
        // Check each action pattern
        for (const pattern of patterns.actions) {
          const matches = [...line.matchAll(pattern)];
          for (const match of matches) {
            const task = this.createTaskFromMatch(match, line, i + 1);
            if (task && !processedTitles.has(task.title.toLowerCase())) {
              processedTitles.add(task.title.toLowerCase());
              tasks.push(task);
              console.log('SimpleTaskParser: Found task:', task.title);
            }
          }
        }
        
        // Also check for simple bullet points and numbered lists
        if (this.isTaskLine(line)) {
          const task = this.createSimpleTask(line, i + 1);
          if (task && !processedTitles.has(task.title.toLowerCase())) {
            processedTitles.add(task.title.toLowerCase());
            tasks.push(task);
            console.log('SimpleTaskParser: Found simple task:', task.title);
          }
        }
      }
      
      console.log('SimpleTaskParser: Total tasks found:', tasks.length);
      
      // Sort by confidence
      tasks.sort((a, b) => b.confidence - a.confidence);
      
      return tasks;
    } catch (error) {
      console.error('SimpleTaskParser error:', error);
      return [];
    }
  }

  /**
   * Check if a line looks like a task
   */
  isTaskLine(line) {
    // Bullet points - fixed regex character class order
    if (/^[\s]*[•·▪▫◦‣⁃*-]\s+/.test(line)) return true;
    
    // Numbered lists
    if (/^[\s]*\d+[.)]\s+/.test(line)) return true;
    
    // Action keywords
    if (/\b(task|action|todo|complete|finish|submit|review|prepare|schedule|follow up)\b/i.test(line)) return true;
    
    // Assignment patterns
    if (/\b(needs? to|must|should|has to|will|shall)\b/i.test(line)) return true;
    
    return false;
  }

  /**
   * Create task from regex match
   */
  createTaskFromMatch(match, fullText, lineNumber) {
    const rawTitle = match[1] || match[0];
    const title = helpers.cleanExtractedText(rawTitle);
    
    if (!helpers.isValidTask(title)) return null;
    
    return {
      title: title,
      description: fullText,
      sourceText: fullText,
      assignee: this.extractAssignee(fullText),
      dueDate: this.extractDeadline(fullText),
      priority: this.determinePriority(fullText),
      confidence: this.calculateConfidence(title, fullText),
      lineNumber: lineNumber
    };
  }

  /**
   * Create simple task from line
   */
  createSimpleTask(line, lineNumber) {
    // Clean the line - fixed regex character class order
    let title = line
      .replace(/^[\s]*[•·▪▫◦‣⁃*-]\s+/, '') // Remove bullet points
      .replace(/^[\s]*\d+[.)]\s*/, '') // Remove numbers
      .trim();
    
    title = helpers.cleanExtractedText(title);
    
    if (!helpers.isValidTask(title)) return null;
    
    return {
      title: title,
      description: line,
      sourceText: line,
      assignee: this.extractAssignee(line),
      dueDate: this.extractDeadline(line),
      priority: this.determinePriority(line),
      confidence: this.calculateConfidence(title, line),
      lineNumber: lineNumber
    };
  }

  /**
   * Process structured data (from Excel/CSV)
   */
  processStructuredData(structuredTasks) {
    return structuredTasks.map(task => ({
      title: task.title,
      description: task.source || '',
      dueDate: this.parseStructuredDate(task.dueDate),
      assignee: task.assignee,
      priority: task.priority || 'medium',
      confidence: 95, // High confidence for structured data
      sourceText: `Row ${task.rowNumber || 'N/A'}: ${task.title}`,
      isStructured: true
    }));
  }

  /**
   * Parse date from structured data
   */
  parseStructuredDate(dateValue) {
    if (!dateValue) return null;
    
    // If it's already a date object
    if (dateValue instanceof Date) return dateValue;
    
    // Try parsing as string
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) return parsed;
    
    return null;
  }

  /**
   * Extract assignee from text
   */
  extractAssignee(text) {
    return helpers.extractAssignee(text);
  }

  /**
   * Extract deadline from text
   */
  extractDeadline(text) {
    for (const pattern of patterns.deadlines) {
      const match = text.match(pattern);
      if (match) {
        const deadline = helpers.parseRelativeDate(match[1]);
        if (deadline) return deadline;
      }
    }
    return null;
  }

  /**
   * Determine task priority
   */
  determinePriority(text) {
    const lowerText = text.toLowerCase();
    
    if (patterns.priority.urgent.test(lowerText)) return 'urgent';
    if (patterns.priority.high.test(lowerText)) return 'high';
    if (patterns.priority.low.test(lowerText)) return 'low';
    
    return 'medium';
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(title, sourceText) {
    let confidence = 60; // Base confidence
    
    // Increase confidence for clear indicators
    if (title.length > 10 && title.length < 100) confidence += 10;
    if (/action|task|todo|deliver|complete|submit/i.test(sourceText)) confidence += 15;
    
    // Decrease confidence for questions
    if (sourceText.includes('?')) confidence -= 10;
    
    // Increase for formal language
    if (/shall|must|required|mandatory/i.test(sourceText)) confidence += 10;
    
    return Math.max(30, Math.min(90, confidence));
  }
}

module.exports = new SimpleTaskParser();
