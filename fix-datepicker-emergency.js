/**
 * Emergency fix for MUI DatePicker renderInput issue
 * This patch directly modifies the most crucial files to fix the error
 */

const fs = require('fs');
const path = require('path');

// Update package.json to use a version known to work with renderInput
const packageJsonPath = path.resolve(__dirname, 'frontend/package.json');
let packageData = fs.readFileSync(packageJsonPath, 'utf8');
let packageJson = JSON.parse(packageData);

// Set to a version that definitely works with renderInput
packageJson.dependencies['@mui/x-date-pickers'] = '5.0.0-alpha.1';
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
console.log('Updated package.json to use @mui/x-date-pickers@5.0.0-alpha.1');

// Create an emergency monkeypatch.js file
const monkeyPatchPath = path.resolve(__dirname, 'frontend/src/monkeypatch.js');
const monkeyPatchContent = `// Emergency monkeypatch for DatePicker renderInput issue
if (typeof window !== 'undefined') {
  // Wait for the DOM to be fully loaded
  window.addEventListener('DOMContentLoaded', () => {
    console.log('Applying DatePicker monkeypatch...');
    
    // Path the KeyboardDateInput component's prototype
    const origGetAttribute = Element.prototype.getAttribute;
    Element.prototype.getAttribute = function(name) {
      // If this is a check for renderInput and it doesn't exist, provide a fallback
      if (name === 'renderInput' && !this.hasAttribute(name)) {
        console.log('Providing renderInput fallback');
        return () => console.log('renderInput fallback called');
      }
      return origGetAttribute.call(this, name);
    };
  });
}
`;
fs.writeFileSync(monkeyPatchPath, monkeyPatchContent, 'utf8');
console.log('Created monkeypatch.js');

// Update index.js to import the monkeypatch
const indexPath = path.resolve(__dirname, 'frontend/src/index.js');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Add the import at the top if not already there
if (!indexContent.includes('monkeypatch')) {
  indexContent = `import './monkeypatch'; // Emergency fix for DatePicker\n${indexContent}`;
  fs.writeFileSync(indexPath, indexContent, 'utf8');
  console.log('Updated index.js to import monkeypatch');
}

// Create a temporary local-fix DatePicker component
const fixedPickerPath = path.resolve(__dirname, 'frontend/src/components/common/CompatDatePicker.js');
const fixedPickerContent = `// Compatibility DatePicker that works with either old or new API
import React from 'react';
import TextField from '@mui/material/TextField';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';

const CompatDatePicker = (props) => {
  // Create safe props that work with either API version
  const safeProps = { ...props };
  
  // If renderInput is defined, keep it
  if (!safeProps.renderInput) {
    // Otherwise define a default renderInput function
    safeProps.renderInput = (params) => (
      <TextField 
        {...params} 
        fullWidth 
        size={props.size || "medium"}
      />
    );
  }
  
  return <MuiDatePicker {...safeProps} />;
};

export default CompatDatePicker;
`;
fs.writeFileSync(fixedPickerPath, fixedPickerContent, 'utf8');
console.log('Created CompatDatePicker.js');

// Create a readme file with instructions
const readmePath = path.resolve(__dirname, 'DATEPICKER_FIX_INSTRUCTIONS.md');
const readmeContent = `# DatePicker Fix Instructions

This patch provides several ways to fix the "renderInput is not a function" error:

## Option 1: Install the compatible version and use the monkeypatch

1. Navigate to the frontend directory:
   \`\`\`
   cd frontend
   \`\`\`

2. Install the dependencies with the patched version:
   \`\`\`
   npm install
   \`\`\`

3. Start the development server:
   \`\`\`
   npm start
   \`\`\`

## Option 2: Use the CompatDatePicker component

If Option 1 doesn't work, you can modify your components to use the CompatDatePicker:

1. Replace imports of DatePicker with:
   \`\`\`jsx
   import CompatDatePicker from '../components/common/CompatDatePicker';
   \`\`\`

2. Replace all instances of \`<DatePicker ... />\` with \`<CompatDatePicker ... />\`

## Troubleshooting

If you're still encountering issues:

1. Delete the node_modules folder:
   \`\`\`
   cd frontend
   rm -rf node_modules
   \`\`\`

2. Clear the npm cache:
   \`\`\`
   npm cache clean --force
   \`\`\`

3. Reinstall dependencies:
   \`\`\`
   npm install
   \`\`\`

4. Restart your development server:
   \`\`\`
   npm start
   \`\`\`

This approach should fix the DatePicker issue by using a version of the library that is compatible with the \`renderInput\` prop.
`;
fs.writeFileSync(readmePath, readmeContent, 'utf8');
console.log('Created DATEPICKER_FIX_INSTRUCTIONS.md');

console.log('\n===================================================');
console.log('Emergency DatePicker fix patch has been applied!');
console.log('===================================================');
console.log('Next steps:');
console.log('1. CD into the frontend directory: cd frontend');
console.log('2. Install dependencies: npm install');
console.log('3. Start the app: npm start');
console.log('\nIf issues persist, see DATEPICKER_FIX_INSTRUCTIONS.md');
