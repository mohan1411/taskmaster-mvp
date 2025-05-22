// Direct patch for MUI DatePicker in TaskMaster MVP
// This script finds all import statements for MUI DatePicker components
// and adds the proper provider setup if missing

const fs = require('fs');
const path = require('path');

// Path to the main folder where we need to find and update files
const frontendSrcPath = path.resolve(__dirname, 'frontend/src');

// Check if a file exists
function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

// Helper function to recursively get all JS files
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(file => {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else if (file.endsWith('.js')) {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

// Main function to fix all files
function fixAllFiles() {
  const allFiles = getAllFiles(frontendSrcPath);
  let updatedFiles = 0;

  allFiles.forEach(filePath => {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Check for DatePicker import but without proper setup
      if (fileContent.includes('@mui/x-date-pickers') && 
          fileContent.includes('DatePicker') && 
          !fileContent.includes('slotProps')) {
        
        // Replace renderInput prop with slotProps
        let updatedContent = fileContent.replace(/renderInput\s*=\s*{\s*\(\s*params\s*\)\s*=>\s*\(\s*<TextField[^>]*\/>\s*\)\s*}/g, 
          'slotProps={{ textField: { fullWidth: true } }}');
        
        updatedContent = updatedContent.replace(/renderInput\s*=\s*{\s*\(\s*params\s*\)\s*=>\s*<TextField[^>]*\/>\s*}/g, 
          'slotProps={{ textField: { fullWidth: true } }}');
        
        // If there were changes, write them back
        if (updatedContent !== fileContent) {
          fs.writeFileSync(filePath, updatedContent, 'utf8');
          console.log(`Fixed DatePicker in: ${filePath}`);
          updatedFiles++;
        }
      }
    } catch (err) {
      console.error(`Error processing file ${filePath}:`, err);
    }
  });

  // Update the MUI DatePicker version if needed
  try {
    const packageJsonPath = path.resolve(__dirname, 'frontend/package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check if we need to update the version
    if (packageJson.dependencies['@mui/x-date-pickers'] === '^5.0.20') {
      console.log('Updating @mui/x-date-pickers version in package.json');
      packageJson.dependencies['@mui/x-date-pickers'] = '^6.18.2'; // Use a newer version
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
      console.log('Updated package.json with newer @mui/x-date-pickers version');
    }
  } catch (err) {
    console.error('Error updating package.json:', err);
  }

  console.log(`Updated ${updatedFiles} files in total.`);
  console.log('\nPlease run the following commands to complete the fix:');
  console.log('1. npm install');
  console.log('2. npm start\n');
}

// Run the fixer
fixAllFiles();
