const fs = require('fs');
const path = require('path');

console.log('=== DOCUMENT HUB DIAGNOSTIC ===\n');

// Check if services exist
console.log('1. Checking services...');
try {
  const simpleParser = require('./backend/services/simpleTaskParser');
  console.log('✓ simpleTaskParser loaded');
  
  // Check methods
  console.log('\nChecking parser methods:');
  console.log('- parseDocument:', typeof simpleParser.parseDocument);
  console.log('- isTaskLine:', typeof simpleParser.isTaskLine);
  console.log('- createTaskFromMatch:', typeof simpleParser.createTaskFromMatch);
} catch (e) {
  console.log('✗ Error loading simpleTaskParser:', e.message);
}

// Check patterns
console.log('\n2. Checking task patterns...');
try {
  const { patterns, helpers } = require('./backend/utils/taskPatterns');
  console.log('✓ taskPatterns loaded');
  console.log('- Number of action patterns:', patterns.actions.length);
  console.log('- Number of deadline patterns:', patterns.deadlines.length);
} catch (e) {
  console.log('✗ Error loading taskPatterns:', e.message);
}

// Test with simple text
console.log('\n3. Testing with simple text...');
const testText = `
TODO: Fix the bug
John needs to complete the report
• Submit timesheet by Friday
`;

async function testParsing() {
  try {
    const simpleParser = require('./backend/services/simpleTaskParser');
    const tasks = await simpleParser.parseDocument(testText);
    console.log(`\nExtracted ${tasks.length} tasks`);
    
    if (tasks.length === 0) {
      console.log('\n❌ PARSER NOT WORKING!\n');
      
      // Test pattern matching directly
      console.log('Testing patterns directly...');
      const { patterns } = require('./backend/utils/taskPatterns');
      
      const lines = testText.split('\n').filter(l => l.trim());
      lines.forEach(line => {
        console.log(`\nTesting line: "${line}"`);
        
        let matched = false;
        for (let i = 0; i < patterns.actions.length; i++) {
          try {
            const pattern = patterns.actions[i];
            if (pattern.test(line)) {
              console.log(`  ✓ Matched by pattern ${i}: ${pattern}`);
              matched = true;
              
              // Try to extract
              const matches = line.match(pattern);
              if (matches) {
                console.log(`    Extracted: "${matches[1] || matches[0]}"`);
              }
            }
          } catch (e) {
            console.log(`  ✗ Error with pattern ${i}: ${e.message}`);
          }
        }
        
        if (!matched) {
          console.log('  ✗ No patterns matched');
        }
      });
    } else {
      console.log('\n✓ PARSER WORKING!');
      tasks.forEach((task, i) => {
        console.log(`\nTask ${i + 1}:`);
        console.log(`  Title: ${task.title}`);
        console.log(`  Priority: ${task.priority}`);
      });
    }
  } catch (e) {
    console.log('Error during parsing:', e);
    console.log('Stack:', e.stack);
  }
}

testParsing();
