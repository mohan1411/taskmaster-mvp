/**
 * Complete DatePicker replacement script
 * This script replaces all MUI DatePicker components with our custom implementation
 */

const fs = require('fs');
const path = require('path');

console.log('Starting DatePicker replacement...');

// Path to the frontend src directory
const srcDir = path.resolve(__dirname, 'frontend/src');

// Function to recursively get all JS files
function getAllJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllJsFiles(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Get all JS files
const jsFiles = getAllJsFiles(srcDir);

// Process each file
let modifiedFiles = 0;

jsFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Check if the file uses DatePicker
  if (content.includes('DatePicker') && !file.includes('CustomDatePicker.js')) {
    console.log(`Processing file: ${file}`);
    
    // Replace DatePicker imports from MUI
    content = content.replace(
      /import\s+{\s*([^}]*DatePicker[^}]*)\s*}\s*from\s+['"]@mui\/x-date-pickers.*['"]/g,
      `import CustomDatePicker from '../components/common/CustomDatePicker'`
    );
    
    // If the file doesn't include the above pattern but still uses DatePicker, add the import
    if (!content.includes('CustomDatePicker') && content.includes('DatePicker')) {
      // Find the last import statement
      const lastImportIndex = content.lastIndexOf('import');
      if (lastImportIndex !== -1) {
        const endOfImport = content.indexOf('\n', lastImportIndex);
        if (endOfImport !== -1) {
          const beforeImports = content.substring(0, endOfImport + 1);
          const afterImports = content.substring(endOfImport + 1);
          content = `${beforeImports}import CustomDatePicker from '../components/common/CustomDatePicker';\n${afterImports}`;
        }
      }
    }
    
    // Replace DatePicker components with CustomDatePicker
    content = content.replace(/<DatePicker/g, '<CustomDatePicker');
    
    // If the file was modified, write it back
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      modifiedFiles++;
      console.log(`Modified file: ${file}`);
    }
  }
});

console.log(`Replaced DatePicker in ${modifiedFiles} files.`);

// Update the package.json to remove @mui/x-date-pickers
const packageJsonPath = path.resolve(__dirname, 'frontend/package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Check if @mui/x-date-pickers is in dependencies
if (packageJson.dependencies['@mui/x-date-pickers']) {
  console.log('Removing @mui/x-date-pickers from package.json');
  delete packageJson.dependencies['@mui/x-date-pickers'];
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
}

// Create a readme file with instructions
const readmePath = path.resolve(__dirname, 'DATEPICKER_REPLACEMENT_README.md');
const readmeContent = `# DatePicker Replacement

## What Happened?
We've replaced the MUI DatePicker components with a custom implementation that doesn't rely on the problematic @mui/x-date-pickers library. This should resolve the "renderInput is not a function" error.

## How to Use the New DatePicker
The CustomDatePicker component has the same API as the MUI DatePicker, so you shouldn't need to make any changes to your code. However, some advanced features may not be supported.

## Required Steps
1. Run \`npm install\` in the frontend directory to update dependencies
2. Start the app with \`npm start\`

## If You Still Have Issues
If you encounter any issues with the CustomDatePicker:

1. Make sure all imports are correct in your components
2. Check the browser console for any errors
3. You might need to adjust the paths to CustomDatePicker.js in some files

## Reverting to MUI DatePicker
If you want to revert to the MUI DatePicker in the future:

1. Reinstall the @mui/x-date-pickers package
2. Replace all instances of CustomDatePicker with DatePicker
3. Update the imports to use @mui/x-date-pickers again

But make sure you're using a compatible version or have fixed the renderInput issue before doing so.
`;
fs.writeFileSync(readmePath, readmeContent, 'utf8');
console.log('Created DATEPICKER_REPLACEMENT_README.md');

// Create a script to fix imports with relative paths
const fixImportsScriptPath = path.resolve(__dirname, 'frontend/src/fix-datepicker-imports.js');
const fixImportsScriptContent = `/**
 * Utility to fix CustomDatePicker imports if they're not working
 * Run this script from Node.js if you see import errors
 */
const fs = require('fs');
const path = require('path');

function getAllJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllJsFiles(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Get all JS files
const jsFiles = getAllJsFiles(path.resolve(__dirname));

// Process each file
jsFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Check if the file has an incorrect import path for CustomDatePicker
  if (content.includes('CustomDatePicker') && content.includes('../components/common/CustomDatePicker')) {
    // Calculate the correct relative path
    const relativePath = path.relative(path.dirname(file), path.resolve(__dirname, 'components/common')).replace(/\\\\/g, '/');
    
    // Replace the import path
    const newContent = content.replace(
      /import\s+CustomDatePicker\s+from\s+['"]..\/components\/common\/CustomDatePicker['"]/g,
      \`import CustomDatePicker from '\${relativePath}/CustomDatePicker'\`
    );
    
    // Write the file if changes were made
    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(\`Fixed import in \${file}\`);
    }
  }
});

console.log('Import paths fixed!');
`;
fs.writeFileSync(fixImportsScriptPath, fixImportsScriptContent, 'utf8');
console.log('Created script to fix import paths if needed');

// Create a batch file to run the fix
const batchFilePath = path.resolve(__dirname, 'fix-datepicker-final.bat');
const batchFileContent = `@echo off
echo =========================================
echo FINAL DATEPICKER FIX - REPLACEMENT METHOD
echo =========================================

echo Replacing all DatePicker components with our custom implementation...
node replace-datepickers.js

echo Installing required dependencies...
cd frontend
call npm install

echo Clearing React cache...
call npm cache clean --force
if exist "node_modules\\.cache" rmdir /s /q node_modules\\.cache

echo Everything is set up!
echo Now start your app with: npm start
echo See DATEPICKER_REPLACEMENT_README.md for more information.

pause
`;
fs.writeFileSync(batchFilePath, batchFileContent, 'utf8');
console.log('Created fix-datepicker-final.bat');

console.log('\nAll done! Please run the fix-datepicker-final.bat file to complete the setup.');
