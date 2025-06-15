const natural = require('natural');
const compromise = require('compromise');
const { patterns, helpers } = require('../utils/taskPatterns');

class TaskParser {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.sentenceTokenizer = new natural.SentenceTokenizer();
    this.tfidf = new natural.TfIdf();
  }

  /**
   * Main parsing method
   */
  async parseDocument(text, context = {}) {
    try {
      const tasks = [];
      const processedTitles = new Set(); // Avoid duplicates
      
      // First, check if we have structured data (from Excel/CSV)
      if (context.structured && Array.isArray(context.structured)) {
        const structuredTasks = this.processStructuredData(context.structured);
        tasks.push(...structuredTasks);
      }

      // Split text into sections for better context
      const sections = this.splitIntoSections(text);
      
      // Process each section
      for (const section of sections) {
        const sectionTasks = await this.extractTasksFromSection(section, context);
        
        // Deduplicate
        for (const task of sectionTasks) {
          const normalizedTitle = task.title.toLowerCase().trim();
          if (!processedTitles.has(normalizedTitle)) {
            processedTitles.add(normalizedTitle);
            tasks.push(task);
          }
        }
      }

      // Enhance tasks with additional information
      const enhancedTasks = tasks.map(task => this.enhanceTask(task, text));
      
      // Sort by confidence and priority
      enhancedTasks.sort((a, b) => {
        if (a.confidence !== b.confidence) return b.confidence - a.confidence;
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      return enhancedTasks;
    } catch (error) {
      console.error('Task parsing error:', error);
      return [];
    }
  }

  /**
   * Split document into logical sections
   */
  splitIntoSections(text) {
    const sections = [];
    const lines = text.split('\n');
    let currentSection = { header: '', content: [] };
    
    for (const line of lines) {
      // Check if line is a section header
      const isHeader = patterns.sectionHeaders.some(pattern => pattern.test(line));
      
      if (isHeader && currentSection.content.length > 0) {
        sections.push(currentSection);
        currentSection = { header: line, content: [] };
      } else {
        currentSection.content.push(line);
      }
    }
    
    if (currentSection.content.length > 0) {
      sections.push(currentSection);
    }
    
    // If no sections found, treat entire text as one section
    if (sections.length === 0) {
      sections.push({ header: '', content: lines });
    }
    
    return sections;
  }

  /**
   * Extract tasks from a section
   */
  async extractTasksFromSection(section, context) {
    const tasks = [];
    const sectionText = section.content.join('\n');
    const sentences = this.sentenceTokenizer.tokenize(sectionText);
    
    // Check each pattern type
    for (const sentence of sentences) {
      // Skip negated sentences
      if (this.isNegated(sentence)) continue;
      
      // Check action patterns
      for (const pattern of patterns.actions) {
        const matches = [...sentence.matchAll(pattern)];
        for (const match of matches) {
          const task = this.createTaskFromMatch(match, sentence, section.header, context);
          if (task) tasks.push(task);
        }
      }
    }
    
    // Also check for bullet points and lists
    const listTasks = this.extractTasksFromLists(section.content);
    tasks.push(...listTasks);
    
    return tasks;
  }

  /**
   * Extract tasks from bulleted/numbered lists
   */
  extractTasksFromLists(lines) {
    const tasks = [];
    const listPatterns = [
      /^[\s]*[•·▪▫◦‣⁃]\s+(.+)$/,
      /^[\s]*\d+[.)]\s+(.+)$/,
      /^[\s]*[a-z][.)]\s+(.+)$/i,
      /^[\s]*[-*]\s+(.+)$/
    ];
    
    for (const line of lines) {
      for (const pattern of listPatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          const title = helpers.cleanExtractedText(match[1]);
          if (helpers.isValidTask(title)) {
            tasks.push({
              title: title,
              description: line,
              sourceText: line,
              confidence: 70 // Lists are usually tasks
            });
          }
        }
      }
    }
    
    return tasks;
  }

  /**
   * Create task from regex match
   */
  createTaskFromMatch(match, fullText, sectionHeader, context) {
    const rawTitle = match[1] || match[0];
    const title = helpers.cleanExtractedText(rawTitle);
    
    if (!helpers.isValidTask(title)) return null;
    
    // Extract additional context
    const assignee = helpers.extractAssignee(fullText);
    const dueDate = this.extractDeadline(fullText);
    const priority = this.determinePriority(fullText, sectionHeader);
    
    return {
      title: title,
      description: this.extractDescription(fullText, title),
      sourceText: fullText,
      assignee: assignee,
      dueDate: dueDate,
      priority: priority,
      confidence: this.calculateInitialConfidence(title, fullText, sectionHeader),
      lineNumber: context.lineNumber || null,
      sectionHeader: sectionHeader || null
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
      confidence: 90, // High confidence for structured data
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
    
    // If it's a number (Excel date)
    if (typeof dateValue === 'number') {
      // Excel dates start from 1900-01-01
      const excelEpoch = new Date(1900, 0, 1);
      const msPerDay = 24 * 60 * 60 * 1000;
      return new Date(excelEpoch.getTime() + (dateValue - 2) * msPerDay);
    }
    
    // Try parsing as string
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) return parsed;
    
    // Try relative date parsing
    return helpers.parseRelativeDate(dateValue.toString());
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
  determinePriority(text, sectionHeader = '') {
    const combinedText = `${sectionHeader} ${text}`.toLowerCase();
    
    if (patterns.priority.urgent.test(combinedText)) return 'urgent';
    if (patterns.priority.high.test(combinedText)) return 'high';
    if (patterns.priority.low.test(combinedText)) return 'low';
    
    // Check for deadline proximity
    const deadline = this.extractDeadline(text);
    if (deadline) {
      const daysUntilDue = (deadline - new Date()) / (1000 * 60 * 60 * 24);
      if (daysUntilDue < 1) return 'urgent';
      if (daysUntilDue < 3) return 'high';
    }
    
    return 'medium';
  }

  /**
   * Extract description from surrounding context
   */
  extractDescription(fullText, title) {
    // Use NLP to find relevant sentences
    const doc = compromise(fullText);
    const sentences = doc.sentences().out('array');
    
    // Find sentences containing the task title
    const relevantSentences = sentences.filter(sentence => 
      sentence.toLowerCase().includes(title.toLowerCase().substring(0, 20))
    );
    
    if (relevantSentences.length > 0) {
      return relevantSentences[0];
    }
    
    // Return the full text if it's short enough
    if (fullText.length <= 200) {
      return fullText;
    }
    
    // Return first sentence
    return sentences[0] || '';
  }

  /**
   * Calculate initial confidence score
   */
  calculateInitialConfidence(title, sourceText, sectionHeader) {
    let confidence = 50; // Base confidence
    
    // Increase confidence for clear indicators
    if (title.length > 10 && title.length < 100) confidence += 10;
    if (/action|task|todo|deliver|complete|submit/i.test(sourceText)) confidence += 15;
    if (sectionHeader && /action|task|todo|deliver/i.test(sectionHeader)) confidence += 20;
    
    // Decrease confidence for questions or discussions
    if (sourceText.includes('?')) confidence -= 10;
    if (/discuss|consider|think about|maybe/i.test(sourceText)) confidence -= 15;
    
    // Increase for formal language
    if (/shall|must|required|mandatory/i.test(sourceText)) confidence += 15;
    
    return Math.max(20, Math.min(95, confidence));
  }

  /**
   * Enhance task with additional analysis
   */
  enhanceTask(task, fullDocument) {
    // Use compromise for NLP enhancement
    const doc = compromise(task.sourceText);
    
    // Extract entities
    const people = doc.people().out('array');
    const dates = doc.dates().out('array');
    const organizations = doc.organizations().out('array');
    
    // Enhance assignee
    if (!task.assignee && people.length > 0) {
      task.assignee = people[0];
    }
    
    // Enhance date
    if (!task.dueDate && dates.length > 0) {
      const parsedDate = helpers.parseRelativeDate(dates[0]);
      if (parsedDate) task.dueDate = parsedDate;
    }
    
    // Add context
    task.context = {
      people: people,
      organizations: organizations,
      hasAttachment: /attach|enclosed|included/i.test(task.sourceText),
      isContractual: /agreement|contract|terms/i.test(fullDocument),
      isMeeting: /meeting|minutes|agenda/i.test(fullDocument)
    };
    
    // Adjust confidence based on context
    if (task.context.isContractual) task.confidence += 10;
    if (task.context.isMeeting && task.assignee) task.confidence += 10;
    
    task.confidence = Math.min(95, task.confidence);
    
    return task;
  }

  /**
   * Check if sentence is negated
   */
  isNegated(sentence) {
    const negationPatterns = [
      /\b(?:don't|doesn't|didn't|won't|wouldn't|shouldn't|cannot|can't)\b/i,
      /\b(?:no need|not required|not necessary|already done|completed)\b/i
    ];
    
    return negationPatterns.some(pattern => pattern.test(sentence));
  }
}

module.exports = new TaskParser();
