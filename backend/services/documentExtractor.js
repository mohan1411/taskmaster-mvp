const fs = require('fs').promises;
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');

/**
 * Document text extraction service
 * Handles PDF, Word, Excel, CSV, and text files
 */
class DocumentExtractor {
  /**
   * Extract text content from various document types
   */
  async extractFromFile(filePath, mimeType) {
    try {
      switch (mimeType) {
        case 'application/pdf':
          return await this.extractPDF(filePath);
          
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          return await this.extractWord(filePath);
          
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'application/vnd.ms-excel':
          return await this.extractExcel(filePath);
          
        case 'text/csv':
          return await this.extractCSV(filePath);
          
        case 'text/plain':
          return await this.extractText(filePath);
          
        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      console.error(`Document extraction failed for ${filePath}:`, error);
      throw new Error(`Failed to extract content: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF files
   */
  async extractPDF(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const data = await pdf(buffer);
      
      // Log raw extracted text for debugging
      console.log('\n[PDF EXTRACTOR] Raw extracted text:');
      console.log('=====================================');
      console.log(data.text.substring(0, 1000)); // First 1000 chars
      console.log('=====================================');
      console.log(`Total text length: ${data.text.length} characters`);
      console.log(`Number of pages: ${data.numpages}`);
      
      // Log text before and after cleaning
      const cleanedText = this.cleanText(data.text);
      console.log('\n[PDF EXTRACTOR] Cleaned text:');
      console.log('=====================================');
      console.log(cleanedText.substring(0, 1000)); // First 1000 chars
      console.log('=====================================');
      console.log(`Cleaned text length: ${cleanedText.length} characters`);
      
      // Check for potential formatting issues
      const potentialIssues = [];
      if (data.text.includes('\t\t')) potentialIssues.push('Multiple tabs detected');
      if (data.text.match(/\d\s+\d\s+[A-Z]/)) potentialIssues.push('Possible column formatting issues');
      if (data.text.match(/[A-Z]{2,}\s*:/)) potentialIssues.push('Headers detected');
      if (data.text.split('\n').some(line => line.length > 200)) potentialIssues.push('Very long lines detected');
      
      if (potentialIssues.length > 0) {
        console.log('\n[PDF EXTRACTOR] Potential formatting issues:');
        potentialIssues.forEach(issue => console.log(`  - ${issue}`));
      }
      
      // Try to detect and fix column-based layouts
      let finalText = cleanedText;
      if (potentialIssues.includes('Possible column formatting issues')) {
        console.log('\n[PDF EXTRACTOR] Attempting to fix column formatting...');
        finalText = this.fixColumnFormatting(cleanedText);
      }
      
      return {
        text: finalText,
        metadata: {
          pages: data.numpages,
          info: data.info,
          wordCount: this.countWords(data.text),
          rawTextLength: data.text.length,
          cleanedTextLength: cleanedText.length,
          potentialIssues: potentialIssues
        }
      };
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from Word documents
   */
  async extractWord(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      
      return {
        text: this.cleanText(result.value),
        metadata: {
          messages: result.messages,
          wordCount: this.countWords(result.value),
          hasImages: result.messages.some(m => m.type === 'warning' && m.message.includes('image'))
        }
      };
    } catch (error) {
      throw new Error(`Word extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from Excel files
   */
  async extractExcel(filePath) {
    try {
      const workbook = XLSX.readFile(filePath, {
        cellText: true,
        cellDates: true,
        cellNF: false,
        sheetStubs: false
      });

      let fullText = '';
      const structured = {};

      // Process each sheet
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to CSV for text extraction
        const csvData = XLSX.utils.sheet_to_csv(sheet, {
          blankrows: false,
          skipHidden: true
        });
        
        // Convert to JSON for structured data
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          dateNF: 'yyyy-mm-dd'
        });

        fullText += `\n=== Sheet: ${sheetName} ===\n${csvData}\n`;
        structured[sheetName] = jsonData;
      });

      // Extract potential task-like structures from tables
      const taskLikeData = this.extractTasksFromTableData(structured);

      return {
        text: this.cleanText(fullText),
        metadata: {
          sheetCount: workbook.SheetNames.length,
          sheets: workbook.SheetNames,
          hasFormulas: fullText.includes('=')
        },
        structured: taskLikeData
      };
    } catch (error) {
      throw new Error(`Excel extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from plain text files
   */
  async extractText(filePath) {
    try {
      const text = await fs.readFile(filePath, 'utf8');
      
      return {
        text: this.cleanText(text),
        metadata: {
          encoding: 'utf8',
          lineCount: text.split('\n').length
        }
      };
    } catch (error) {
      // Try different encodings if UTF-8 fails
      try {
        const buffer = await fs.readFile(filePath);
        const text = buffer.toString('latin1');
        
        return {
          text: this.cleanText(text),
          metadata: {
            encoding: 'latin1',
            lineCount: text.split('\n').length
          }
        };
      } catch (fallbackError) {
        throw new Error(`Text extraction failed: ${error.message}`);
      }
    }
  }

  /**
   * Extract text from CSV files
   */
  async extractCSV(filePath) {
    try {
      const workbook = XLSX.readFile(filePath, {
        type: 'buffer',
        raw: true
      });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Get as text
      const csvText = XLSX.utils.sheet_to_csv(sheet);
      
      // Get as JSON for structured data
      const jsonData = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: ''
      });

      // Try to detect if it's a task list
      const headers = jsonData[0] || [];
      const isTaskList = this.detectTaskListFromHeaders(headers);

      return {
        text: this.cleanText(csvText),
        metadata: {
          rowCount: jsonData.length,
          columnCount: headers.length,
          headers: headers,
          isTaskList: isTaskList
        },
        structured: isTaskList ? this.extractTasksFromCSV(jsonData) : null
      };
    } catch (error) {
      throw new Error(`CSV extraction failed: ${error.message}`);
    }
  }

  /**
   * Clean extracted text
   */
  cleanText(text) {
    if (!text) return '';
    
    // Log problematic patterns before cleaning
    const multipleSpaces = (text.match(/ {2,}/g) || []).length;
    const multipleTabs = (text.match(/\t{2,}/g) || []).length;
    const formFeeds = (text.match(/\f/g) || []).length;
    
    if (multipleSpaces > 10 || multipleTabs > 5 || formFeeds > 0) {
      console.log(`[CLEANER] Found formatting issues: ${multipleSpaces} multiple spaces, ${multipleTabs} multiple tabs, ${formFeeds} form feeds`);
    }
    
    // Be more careful with space replacement - preserve some formatting
    const cleaned = text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\t+/g, '  ') // Replace tabs with double spaces (preserve some structure)
      .replace(/\u0000/g, '') // Remove null characters
      .replace(/\f/g, '\n\n') // Form feeds to double newlines
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
      .replace(/ {3,}/g, '  ') // Multiple spaces to double (not single)
      .replace(/\n{3,}/g, '\n\n') // Multiple newlines to double
      .trim();
    
    // Check if we might have column-based formatting
    const lines = cleaned.split('\n');
    let columnFormatDetected = false;
    for (const line of lines.slice(0, 20)) { // Check first 20 lines
      if (line.match(/\d+\s{2,}\d+\s{2,}/) || line.match(/\w+\s{10,}\w+/)) {
        columnFormatDetected = true;
        break;
      }
    }
    
    if (columnFormatDetected) {
      console.log('[CLEANER] WARNING: Column-based formatting detected. Text may need special handling.');
    }
    
    return cleaned;
  }

  /**
   * Count words in text
   */
  countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Extract tasks from table/structured data
   */
  extractTasksFromTableData(structured) {
    const tasks = [];

    Object.entries(structured).forEach(([sheetName, data]) => {
      if (!Array.isArray(data) || data.length < 2) return;

      const headers = data[0];
      const taskColumnIndex = this.findTaskColumn(headers);
      const dueDateColumnIndex = this.findDateColumn(headers);
      const ownerColumnIndex = this.findOwnerColumn(headers);
      const priorityColumnIndex = this.findPriorityColumn(headers);

      if (taskColumnIndex === -1) return;

      // Extract tasks from rows
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const taskTitle = row[taskColumnIndex];
        
        if (taskTitle && typeof taskTitle === 'string' && taskTitle.trim()) {
          tasks.push({
            title: taskTitle.trim(),
            dueDate: dueDateColumnIndex !== -1 ? row[dueDateColumnIndex] : null,
            assignee: ownerColumnIndex !== -1 ? row[ownerColumnIndex] : null,
            priority: priorityColumnIndex !== -1 ? this.normalizePriority(row[priorityColumnIndex]) : 'medium',
            source: `${sheetName} - Row ${i + 1}`
          });
        }
      }
    });

    return tasks.length > 0 ? tasks : null;
  }

  /**
   * Extract tasks from CSV data
   */
  extractTasksFromCSV(data) {
    if (!Array.isArray(data) || data.length < 2) return null;

    const headers = data[0];
    const tasks = [];

    const taskCol = this.findTaskColumn(headers);
    const dateCol = this.findDateColumn(headers);
    const ownerCol = this.findOwnerColumn(headers);
    const priorityCol = this.findPriorityColumn(headers);
    const statusCol = this.findStatusColumn(headers);

    if (taskCol === -1) return null;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const taskTitle = row[taskCol];
      
      // Skip completed tasks if status column exists
      if (statusCol !== -1 && this.isCompleted(row[statusCol])) continue;
      
      if (taskTitle && taskTitle.trim()) {
        tasks.push({
          title: taskTitle.trim(),
          dueDate: dateCol !== -1 ? row[dateCol] : null,
          assignee: ownerCol !== -1 ? row[ownerCol] : null,
          priority: priorityCol !== -1 ? this.normalizePriority(row[priorityCol]) : 'medium',
          rowNumber: i + 1
        });
      }
    }

    return tasks;
  }

  /**
   * Find task column in headers
   */
  findTaskColumn(headers) {
    const taskKeywords = ['task', 'title', 'description', 'item', 'action', 'activity', 'deliverable'];
    return headers.findIndex(h => 
      taskKeywords.some(keyword => 
        h.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Find date column in headers
   */
  findDateColumn(headers) {
    const dateKeywords = ['date', 'due', 'deadline', 'when', 'target'];
    return headers.findIndex(h => 
      dateKeywords.some(keyword => 
        h.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Find owner/assignee column
   */
  findOwnerColumn(headers) {
    const ownerKeywords = ['owner', 'assignee', 'assigned', 'responsible', 'who', 'person'];
    return headers.findIndex(h => 
      ownerKeywords.some(keyword => 
        h.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Find priority column
   */
  findPriorityColumn(headers) {
    const priorityKeywords = ['priority', 'importance', 'urgency', 'level'];
    return headers.findIndex(h => 
      priorityKeywords.some(keyword => 
        h.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Find status column
   */
  findStatusColumn(headers) {
    const statusKeywords = ['status', 'state', 'progress', 'complete'];
    return headers.findIndex(h => 
      statusKeywords.some(keyword => 
        h.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Check if task is completed
   */
  isCompleted(status) {
    if (!status) return false;
    const completed = ['done', 'complete', 'completed', 'closed', 'finished'];
    return completed.includes(status.toString().toLowerCase());
  }

  /**
   * Normalize priority values
   */
  normalizePriority(priority) {
    if (!priority) return 'medium';
    
    const p = priority.toString().toLowerCase();
    
    if (p.includes('urgent') || p.includes('critical') || p === '1' || p === 'p1') {
      return 'urgent';
    }
    if (p.includes('high') || p === '2' || p === 'p2') {
      return 'high';
    }
    if (p.includes('low') || p === '4' || p === 'p4') {
      return 'low';
    }
    
    return 'medium';
  }

  /**
   * Detect if headers indicate a task list
   */
  detectTaskListFromHeaders(headers) {
    const taskIndicators = ['task', 'action', 'todo', 'deliverable', 'activity'];
    const dateIndicators = ['date', 'due', 'deadline', 'when'];
    
    const hasTaskColumn = headers.some(h => 
      taskIndicators.some(indicator => 
        h.toLowerCase().includes(indicator)
      )
    );
    
    const hasDateColumn = headers.some(h => 
      dateIndicators.some(indicator => 
        h.toLowerCase().includes(indicator)
      )
    );
    
    return hasTaskColumn || hasDateColumn;
  }

  /**
   * Fix column formatting issues in PDF text
   */
  fixColumnFormatting(text) {
    const lines = text.split('\n');
    const fixedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for patterns like "3 3 TODO:" or similar column artifacts
      const columnMatch = line.match(/^(\d+)\s+(\d+)\s+(TODO|TASK|ACTION):\s*(.+)/i);
      if (columnMatch) {
        // Extract just the task part
        fixedLines.push(`${columnMatch[3]}: ${columnMatch[4]}`);
        console.log(`[COLUMN FIX] Fixed line: "${line}" -> "${columnMatch[3]}: ${columnMatch[4]}"`);
        continue;
      }
      
      // Check for other column patterns (e.g., numbered lists that got split)
      const numberedMatch = line.match(/^(\d+)\s+(\d+)\s+(.+)/);
      if (numberedMatch && !line.match(/\d{4}/)) { // Avoid dates
        // This might be a split numbered list
        fixedLines.push(`${numberedMatch[1]}. ${numberedMatch[3]}`);
        console.log(`[COLUMN FIX] Fixed numbered: "${line}" -> "${numberedMatch[1]}. ${numberedMatch[3]}"`);
        continue;
      }
      
      // Check if line has excessive spacing that might indicate columns
      if (line.match(/\s{10,}/)) {
        // Split by large spaces and try to reconstruct
        const parts = line.split(/\s{10,}/);
        if (parts.length > 1) {
          // Take the most meaningful part (usually the longest)
          const meaningful = parts.reduce((a, b) => a.length > b.length ? a : b);
          fixedLines.push(meaningful.trim());
          console.log(`[COLUMN FIX] Extracted from columns: "${line}" -> "${meaningful.trim()}"`);
          continue;
        }
      }
      
      // Default: keep the line as is
      fixedLines.push(line);
    }
    
    const fixedText = fixedLines.join('\n');
    console.log(`[COLUMN FIX] Fixed ${lines.length - fixedLines.filter(l => l === lines[fixedLines.indexOf(l)]).length} lines`);
    
    return fixedText;
  }
}

module.exports = new DocumentExtractor();
