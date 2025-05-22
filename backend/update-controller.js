/**
 * Update Controller Script
 * 
 * This script will replace the extractTasksFromEmail function in emailController.js
 * with the simplified version that uses direct axios calls to the OpenAI API.
 * 
 * Usage: node update-controller.js
 */

const fs = require('fs');
const path = require('path');

// Paths relative to the backend directory
const CONTROLLER_PATH = path.join(__dirname, 'controllers', 'emailController.js');
const SIMPLE_EXTRACTOR_PATH = path.join(__dirname, 'controllers', 'simple-extractor.js');
const BACKUP_PATH = path.join(__dirname, 'controllers', 'emailController.js.bak');

// Read the simple extractor file
console.log('Reading simple extractor file...');
const simpleExtractor = fs.readFileSync(SIMPLE_EXTRACTOR_PATH, 'utf8');

// Extract the function implementation
const functionMatch = simpleExtractor.match(/const extractTasksFromEmail = async \(req, res\) => \{[\s\S]*?\};/);

if (!functionMatch) {
  console.error('Could not extract function implementation from simple-extractor.js');
  process.exit(1);
}

const functionImplementation = functionMatch[0];

// Create a backup of the original controller
console.log('Creating backup of original controller...');
fs.copyFileSync(CONTROLLER_PATH, BACKUP_PATH);

// Read the controller file
console.log('Reading controller file...');
const controller = fs.readFileSync(CONTROLLER_PATH, 'utf8');

// Check if axios is already imported
if (!controller.includes('const axios = require(\'axios\');')) {
  console.log('Adding axios import...');
  const updatedImports = controller.replace(
    /const \{ Configuration, OpenAIApi \} = require\('openai'\);/,
    "const { Configuration, OpenAIApi } = require('openai');\nconst axios = require('axios');"
  );
  fs.writeFileSync(CONTROLLER_PATH, updatedImports, 'utf8');
}

// Find and replace the extractTasksFromEmail function
console.log('Updating extractTasksFromEmail function...');
const functionPattern = /\/\/ @desc\s+Extract tasks from email[\s\S]*?const extractTasksFromEmail = async \(req, res\) => \{[\s\S]*?\};/;

// Check if the pattern is found
if (!controller.match(functionPattern)) {
  console.error('Could not find extractTasksFromEmail function in controller');
  console.log('Looking for alternative patterns...');
  
  // Try a simpler pattern
  const altPattern = /const extractTasksFromEmail = async \(req, res\) => \{[\s\S]*?\};/;
  if (controller.match(altPattern)) {
    console.log('Found function with alternative pattern');
    const updatedController = controller.replace(altPattern, functionImplementation);
    fs.writeFileSync(CONTROLLER_PATH, updatedController, 'utf8');
    console.log('Controller updated successfully!');
  } else {
    console.error('Could not find extractTasksFromEmail function with any pattern');
    console.log('Manual updating may be required');
    process.exit(1);
  }
} else {
  // Replace the function
  const updatedController = controller.replace(functionPattern, `// @desc    Extract tasks from email
// @route   POST /api/emails/:id/extract
// @access  Private
${functionImplementation}`);

  // Write the updated controller file
  fs.writeFileSync(CONTROLLER_PATH, updatedController, 'utf8');
  console.log('Controller updated successfully!');
}

console.log(`Original controller backed up to: ${BACKUP_PATH}`);
console.log('\nPlease restart your server for the changes to take effect.');
console.log('\nIf you encounter any issues, you can restore the original controller with:');
console.log(`  cp ${BACKUP_PATH} ${CONTROLLER_PATH}`);
