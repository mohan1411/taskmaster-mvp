// This is a direct fix script for the DatePicker component in FollowUpsPage.js
const fs = require('fs');
const path = require('path');

// Path to the FollowUpsPage.js file
const filePath = path.resolve(__dirname, 'frontend/src/pages/FollowUpsPage.js');

// Read the file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file: ${err}`);
    return;
  }

  // Replace all instances of renderInput with slotProps
  const updatedContent = data.replace(/renderInput={\s*\(params\)\s*=>\s*<TextField\s+{\.\.\.params}\s+size="small"\s+fullWidth\s+\/>\s*}/g, 
    'slotProps={{ textField: { size: "small", fullWidth: true } }}');

  // Write the updated content back to the file
  fs.writeFile(filePath, updatedContent, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing file: ${err}`);
      return;
    }
    console.log('Successfully updated FollowUpsPage.js with DatePicker fixes');
  });
});
