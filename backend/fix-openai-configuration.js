/**
 * This script fixes the OpenAI Configuration usage throughout the codebase
 * It replaces the deprecated pattern with the newer syntax
 */

const fs = require('fs');
const path = require('path');

function fixOpenAIConfiguration(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file uses the deprecated pattern
    if (content.includes('const openaiConfig = new Configuration')) {
      console.log(`Fixing file: ${filePath}`);
      
      // Replace the old pattern with the new one
      const updatedContent = content.replace(
        /const openaiConfig = new Configuration\(\{[\s\S]*?\}\);[\s\S]*?const openai = new OpenAIApi\(openaiConfig\);/g,
        'openai = new OpenAIApi(new Configuration({\n    apiKey: config.openaiApiKey,\n  }));'
      );
      
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✓ Fixed OpenAI Configuration in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
}

function findAndFixFiles(dir) {
  let fixedCount = 0;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules
      if (file === 'node_modules') continue;
      
      // Recursively search directories
      fixedCount += findAndFixFiles(filePath);
    } else if (file.endsWith('.js')) {
      // Fix JavaScript files
      if (fixOpenAIConfiguration(filePath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

// Start fixing files from the backend directory
const backendDir = path.join(__dirname, '');
const fixedCount = findAndFixFiles(backendDir);

console.log(`\nFixed OpenAI Configuration in ${fixedCount} files.`);
console.log('All instances of the deprecated Configuration pattern have been updated.');
