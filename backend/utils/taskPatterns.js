/**
 * Task Pattern Definitions
 * Regular expressions and patterns for extracting tasks from documents
 */

const patterns = {
  // Action patterns - what needs to be done
  actions: [
    // Direct imperatives
    /(?:need to|must|should|have to|required to|has to)\s+(.+?)(?:[.,;!?]|$)/gi,
    /(?:please|kindly|ensure|make sure)\s+(.+?)(?:[.,;!?]|$)/gi,
    
    // Formal action items
    /(?:action required:|action item:|todo:|task:|action:)\s*(.+?)(?:[.,;!?]|$)/gi,
    /(?:deliverable:?|milestone:?)\s*(.+?)(?:[.,;!?]|$)/gi,
    
    // Assignment patterns
    /(?:you will|you need to|you must|you should)\s+(.+?)(?:[.,;!?]|$)/gi,
    /(?:we need to|we must|we should)\s+(.+?)(?:[.,;!?]|$)/gi,
    
    // Bullet points and numbered lists
    /^[\s]*[•·▪▫◦‣⁃]\s+(.+?)(?:[.,;!?]|$)/gm,
    /^[\s]*\d+[.)]\s+(.+?)(?:[.,;!?]|$)/gm,
    /^[\s]*[a-z][.)]\s+(.+?)(?:[.,;!?]|$)/gmi,
    
    // Contract/legal language
    /(?:shall|will|agrees to|commits to)\s+(.+?)(?:[.,;!?]|$)/gi,
    /(?:responsible for|accountable for)\s+(.+?)(?:[.,;!?]|$)/gi,
    
    // Instructions
    /(?:complete|finish|submit|prepare|review|approve|send|schedule)\s+(.+?)(?:[.,;!?]|$)/gi,
    /(?:follow up on|check on|verify|confirm)\s+(.+?)(?:[.,;!?]|$)/gi
  ],
  
  // Deadline patterns - when it needs to be done
  deadlines: [
    // Specific dates
    /(?:by|before|until|due date:|deadline:|due:|on)\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/gi,
    /(?:by|before|until|due date:|deadline:|due:|on)\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{4})?/gi,
    /(?:by|before|until|due date:|deadline:|due:|on)\s*(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:\s+\d{4})?)/gi,
    
    // Relative dates
    /(?:by|before|until|due)\s*(today|tomorrow|yesterday)/gi,
    /(?:by|before|until|due)\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
    /(?:by|before|until|due)\s*(next\s+(?:week|month|quarter|year))/gi,
    /(?:by|before|until|due)\s*(this\s+(?:week|month|quarter|year))/gi,
    
    // Time-based
    /(?:by|before|until|due)\s*(end of day|EOD|end of business|EOB|close of business|COB)/gi,
    /(?:by|before|until|due)\s*(end of week|EOW|end of month|EOM)/gi,
    /(?:within|in)\s*(\d+)\s*(hours?|days?|weeks?|months?)/gi,
    
    // Specific times
    /(?:by|before|at)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))/gi,
    
    // ASAP and urgent
    /\b(ASAP|asap|immediately|urgent|today)\b/gi
  ],
  
  // Priority indicators
  priority: {
    urgent: /\b(?:urgent|critical|emergency|asap|immediately|crisis|blocker)\b/i,
    high: /\b(?:high\s*priority|important|priority|soon|quickly|fast-track|expedite)\b/i,
    medium: /\b(?:medium\s*priority|moderate|normal|standard|regular)\b/i,
    low: /\b(?:low\s*priority|minor|when\s*possible|whenever|nice\s*to\s*have|optional)\b/i
  },
  
  // Assignment patterns - who needs to do it
  assignments: [
    // Direct assignment
    /(?:assigned to:|owner:|responsible:|assignee:)\s*([A-Z][a-zA-Z\s]+?)(?:[.,;!?]|$)/gi,
    /([A-Z][a-z]+)\s+(?:will|shall|to|should|must)\s+(.+?)(?:[.,;!?]|$)/g,
    /([A-Z][a-z]+)\s+(?:is responsible for|is accountable for)\s+(.+?)(?:[.,;!?]|$)/g,
    
    // Team assignments
    /(?:team|department|group):\s*([A-Za-z\s]+?)(?:[.,;!?]|$)/gi,
    
    // Email-based assignments
    /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
  ],
  
  // Section headers that might contain tasks
  sectionHeaders: [
    /^(?:action items|tasks|todo|to-do|deliverables|next steps|follow-up|requirements)/mi,
    /^(?:responsibilities|assignments|milestones|deadlines)/mi
  ],
  
  // Negation patterns - things that are NOT tasks
  negations: [
    /(?:don't|doesn't|didn't|won't|wouldn't|shouldn't)\s+(.+?)(?:[.,;!?]|$)/gi,
    /(?:no need to|not required|not necessary|optional)\s+(.+?)(?:[.,;!?]|$)/gi,
    /(?:already completed|already done|finished|completed)\s+(.+?)(?:[.,;!?]|$)/gi
  ],
  
  // Meeting-specific patterns
  meetingPatterns: {
    attendees: /(?:attendees|participants|present):\s*(.+?)(?:\n|$)/gi,
    decisions: /(?:decided|agreed|concluded):\s*(.+?)(?:[.,;!?]|$)/gi,
    discussions: /(?:discussed|talked about|covered):\s*(.+?)(?:[.,;!?]|$)/gi
  },
  
  // Contract-specific patterns
  contractPatterns: {
    obligations: /(?:shall|must|agrees to|commits to)\s+(.+?)(?:[.,;!?]|$)/gi,
    payment: /(?:payment|invoice|amount due).*?(\$[\d,]+(?:\.\d{2})?|\d+\s*(?:USD|EUR|GBP|INR))/gi,
    penalties: /(?:penalty|fine|late fee).*?(\$[\d,]+(?:\.\d{2})?|\d+%)/gi
  }
};

/**
 * Helper functions for pattern matching
 */
const helpers = {
  /**
   * Clean extracted text
   */
  cleanExtractedText(text) {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/^[-•·▪▫◦‣⁃\s]+/, '') // Remove bullet points
      .replace(/^[a-z\d][.)]\s*/i, '') // Remove list markers
      .replace(/[.,;!?]+$/, '') // Remove trailing punctuation
      .replace(/^(and|or|to|the|a|an)\s+/i, '') // Remove common starting words
      .substring(0, 200); // Limit length
  },
  
  /**
   * Check if text is too short or generic to be a task
   */
  isValidTask(text) {
    const cleaned = text.trim();
    
    // Too short
    if (cleaned.length < 5) return false;
    
    // Just a number or single word
    if (/^\d+$/.test(cleaned) || !/\s/.test(cleaned)) return false;
    
    // Common false positives
    const falsePositives = [
      'see below', 'see above', 'as follows', 'the following',
      'yes', 'no', 'ok', 'okay', 'thanks', 'thank you',
      'fyi', 'na', 'n/a', 'tbd', 'tbc'
    ];
    
    if (falsePositives.includes(cleaned.toLowerCase())) return false;
    
    return true;
  },
  
  /**
   * Extract assignee from text
   */
  extractAssignee(text) {
    // Look for names (capitalized words)
    const nameMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
    if (nameMatch && !['The', 'This', 'That', 'These', 'Those'].includes(nameMatch[1])) {
      return nameMatch[1];
    }
    
    // Look for email addresses
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      return emailMatch[1];
    }
    
    // Look for team/department
    const teamMatch = text.match(/(?:team|department|group):\s*([A-Za-z\s]+?)(?:[.,;!?]|$)/i);
    if (teamMatch) {
      return teamMatch[1].trim();
    }
    
    return null;
  },
  
  /**
   * Parse relative dates to actual dates
   */
  parseRelativeDate(dateText, baseDate = new Date()) {
    // Handle undefined or null dateText
    if (!dateText) return null;
    
    const text = dateText.toString().toLowerCase().trim();
    const result = new Date(baseDate);
    
    // Today
    if (text === 'today' || text === 'eod' || text === 'end of day') {
      result.setHours(23, 59, 59, 999);
      return result;
    }
    
    // Tomorrow
    if (text === 'tomorrow') {
      result.setDate(result.getDate() + 1);
      result.setHours(23, 59, 59, 999);
      return result;
    }
    
    // Days of week
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = daysOfWeek.indexOf(text);
    if (dayIndex !== -1) {
      const currentDay = result.getDay();
      let daysToAdd = dayIndex - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // Next week
      result.setDate(result.getDate() + daysToAdd);
      result.setHours(23, 59, 59, 999);
      return result;
    }
    
    // End of week
    if (text === 'eow' || text === 'end of week') {
      const currentDay = result.getDay();
      const daysToFriday = 5 - currentDay;
      result.setDate(result.getDate() + daysToFriday);
      result.setHours(23, 59, 59, 999);
      return result;
    }
    
    // End of month
    if (text === 'eom' || text === 'end of month') {
      result.setMonth(result.getMonth() + 1, 0); // Last day of current month
      result.setHours(23, 59, 59, 999);
      return result;
    }
    
    // Next week/month
    if (text.includes('next week')) {
      result.setDate(result.getDate() + 7);
      return result;
    }
    if (text.includes('next month')) {
      result.setMonth(result.getMonth() + 1);
      return result;
    }
    
    // Within X days/weeks
    const withinMatch = text.match(/(?:within|in)\s*(\d+)\s*(hours?|days?|weeks?|months?)/);
    if (withinMatch) {
      const amount = parseInt(withinMatch[1]);
      const unit = withinMatch[2];
      
      switch (unit) {
        case 'hour':
        case 'hours':
          result.setHours(result.getHours() + amount);
          break;
        case 'day':
        case 'days':
          result.setDate(result.getDate() + amount);
          break;
        case 'week':
        case 'weeks':
          result.setDate(result.getDate() + (amount * 7));
          break;
        case 'month':
        case 'months':
          result.setMonth(result.getMonth() + amount);
          break;
      }
      return result;
    }
    
    // Try parsing as regular date
    const parsed = new Date(dateText);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    
    return null;
  }
};

module.exports = {
  patterns,
  helpers
};
