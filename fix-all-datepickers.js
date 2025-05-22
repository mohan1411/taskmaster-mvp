// Script to fix all datepicker issues in the project
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Root directory of the frontend
const frontendDir = path.resolve(__dirname, 'frontend/src');

// Get all JavaScript files in the frontend directory
glob(`${frontendDir}/**/*.js`, (err, files) => {
  if (err) {
    console.error('Error finding files:', err);
    return;
  }

  let updatedFilesCount = 0;

  files.forEach(file => {
    // Read the file content
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading file ${file}:`, err);
        return;
      }

      // Check if the file contains renderInput
      if (data.includes('renderInput')) {
        // Replace patterns for DatePicker
        let updatedContent = data.replace(/renderInput={\s*\(params\)\s*=>\s*<TextField\s+{\.\.\.params}\s+fullWidth\s+\/>\s*}/g, 
          'slotProps={{ textField: { fullWidth: true } }}');
        
        // Replace patterns for DatePicker with additional props
        updatedContent = updatedContent.replace(/renderInput={\s*\(params\)\s*=>\s*\(\s*<TextField\s+{\.\.\.params}\s+fullWidth\s+error={\s*([^}]+)\s*}\s+helperText={\s*([^}]+)\s*}\s+\/>\s*\)\s*}/g, 
          'slotProps={{ textField: { fullWidth: true, error: $1, helperText: $2 } }}');
        
        updatedContent = updatedContent.replace(/renderInput={\s*\(params\)\s*=>\s*<TextField\s+{\.\.\.params}\s+fullWidth\s+error={\s*([^}]+)\s*}\s+helperText={\s*([^}]+)\s*}\s+\/>\s*}/g, 
          'slotProps={{ textField: { fullWidth: true, error: $1, helperText: $2 } }}');
        
        // Replace patterns for DatePicker with size="small"
        updatedContent = updatedContent.replace(/renderInput={\s*\(params\)\s*=>\s*<TextField\s+{\.\.\.params}\s+size="small"\s+fullWidth\s+\/>\s*}/g, 
          'slotProps={{ textField: { size: "small", fullWidth: true } }}');

        // If content was updated, write back to the file
        if (updatedContent !== data) {
          fs.writeFile(file, updatedContent, 'utf8', (err) => {
            if (err) {
              console.error(`Error writing file ${file}:`, err);
              return;
            }
            updatedFilesCount++;
            console.log(`Updated DatePicker in file: ${file}`);
          });
        }
      }
    });
  });

  console.log(`Updated ${updatedFilesCount} files in total.`);
});

// Instructions to run this script:
// 1. Install glob if not already installed: npm install glob
// 2. Run the script: node fix-all-datepickers.js
