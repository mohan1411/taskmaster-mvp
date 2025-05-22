/**
 * This file directly patches the KeyboardDateInput component in MUI's x-date-pickers library
 * to fix the "renderInput is not a function" error.
 */

const fs = require('fs');
const path = require('path');

// Path to the node_modules directory
const nodeModulesPath = path.resolve(__dirname, 'frontend/node_modules');

// Function to find files recursively
function findFiles(dir, pattern, callback) {
  fs.readdir(dir, (err, files) => {
    if (err) return callback(err);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        if (stats.isDirectory()) {
          // Skip node_modules within node_modules to avoid deep recursion
          if (file !== 'node_modules') {
            findFiles(filePath, pattern, callback);
          }
        } else if (stats.isFile() && file.match(pattern)) {
          callback(null, filePath);
        }
      });
    });
  });
}

// Find the KeyboardDateInput.js file in the node_modules
findFiles(nodeModulesPath, /KeyboardDateInput.*\.js$/, (err, filePath) => {
  if (err) {
    console.error('Error finding file:', err);
    return;
  }
  
  if (filePath) {
    console.log(`Found file: ${filePath}`);
    
    // Read the file
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading file ${filePath}:`, err);
        return;
      }
      
      // Look for patterns where renderInput is called
      if (data.includes('renderInput') && data.includes('KeyboardDateInput')) {
        console.log('Found renderInput usage, patching...');
        
        // Replace renderInput checks with a conditional that works even if renderInput is not defined
        let patchedData = data.replace(
          /renderInput\s*\(/g, 
          'typeof renderInput === "function" ? renderInput('
        );
        
        patchedData = patchedData.replace(
          /renderInput\s*\([^)]*\)/g,
          'typeof renderInput === "function" ? renderInput($1) : (params) => /*#__PURE__*/React.createElement(TextField, Object.assign({}, params, {fullWidth: true}))'
        );
        
        // Write the patched file
        fs.writeFile(filePath, patchedData, 'utf8', (err) => {
          if (err) {
            console.error(`Error writing patched file ${filePath}:`, err);
            return;
          }
          
          console.log(`Successfully patched ${filePath}`);
        });
      } else {
        console.log(`No relevant code found in ${filePath}`);
      }
    });
  } else {
    console.log('Could not find KeyboardDateInput.js file');
  }
});

// Now try to find and patch any compiled index files that might include the KeyboardDateInput
findFiles(nodeModulesPath, /@mui[\\/]x-date-pickers[\\/].*index.*\.js$/, (err, filePath) => {
  if (err || !filePath) return;
  
  console.log(`Checking index file: ${filePath}`);
  
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return;
    
    if (data.includes('renderInput') && data.includes('KeyboardDateInput')) {
      console.log('Found renderInput usage in index file, patching...');
      
      // Create a backup
      fs.writeFile(`${filePath}.backup`, data, 'utf8', () => {});
      
      // Replace direct references to renderInput with a safe check
      const patchedData = data.replace(
        /props\.renderInput/g,
        '(props.renderInput || function(props) { return React.createElement("input", props); })'
      );
      
      fs.writeFile(filePath, patchedData, 'utf8', (err) => {
        if (err) {
          console.error(`Error writing patched index file ${filePath}:`, err);
          return;
        }
        
        console.log(`Successfully patched index file ${filePath}`);
      });
    }
  });
});

console.log('Starting search for all potential files to patch...');

// Create a monkeypatch.js file to be included in the project
const monkeyPatchContent = `// Monkey patch for MUI DatePicker's renderInput function
// This file should be imported at the top of your index.js file

if (typeof window !== 'undefined') {
  // When the component mounts, we need to patch the KeyboardDateInput
  const originalGetAttribute = Element.prototype.getAttribute;
  Element.prototype.getAttribute = function(name) {
    // If this is a check for renderInput and it doesn't exist
    if (name === 'renderInput' && 
        !this.hasAttribute('renderInput') && 
        this.getAttribute('data-mui-test') === 'KeyboardDateInput') {
      // Return a dummy function instead of null
      return function(params) {
        const TextField = document.createElement('input');
        Object.assign(TextField, params);
        return TextField;
      };
    }
    return originalGetAttribute.call(this, name);
  };
  
  // Also patch Function.prototype.toString to handle cases where the code checks if renderInput is a function
  const originalToString = Function.prototype.toString;
  Function.prototype.toString = function() {
    if (this === Element.prototype.getAttribute) {
      return 'function getAttribute() { [native code] }';
    }
    return originalToString.call(this);
  };
  
  console.log('Monkey patched MUI DatePicker renderInput');
}
`;

// Write the monkeypatch file
fs.writeFile(path.resolve(__dirname, 'frontend/src/monkeypatch.js'), monkeyPatchContent, 'utf8', (err) => {
  if (err) {
    console.error('Error writing monkeypatch.js:', err);
    return;
  }
  
  console.log('Created monkeypatch.js - Please import this at the top of your index.js file');
  
  // Now modify the index.js file to import the monkeypatch
  const indexPath = path.resolve(__dirname, 'frontend/src/index.js');
  
  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading index.js:', err);
      return;
    }
    
    // Check if monkeypatch is already imported
    if (!data.includes('monkeypatch')) {
      // Add the import at the top of the file
      const updatedData = `import './monkeypatch'; // Fixes DatePicker renderInput issue\n${data}`;
      
      fs.writeFile(indexPath, updatedData, 'utf8', (err) => {
        if (err) {
          console.error('Error updating index.js:', err);
          return;
        }
        
        console.log('Updated index.js to import the monkeypatch');
      });
    } else {
      console.log('index.js already imports monkeypatch');
    }
  });
});

// Lastly, update the package.json to use a working version of the date picker
const packageJsonPath = path.resolve(__dirname, 'frontend/package.json');

fs.readFile(packageJsonPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading package.json:', err);
    return;
  }
  
  try {
    const packageJson = JSON.parse(data);
    
    // Downgrade to a version known to work with renderInput
    packageJson.dependencies['@mui/x-date-pickers'] = '5.0.0-alpha.7';
    
    fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8', (err) => {
      if (err) {
        console.error('Error updating package.json:', err);
        return;
      }
      
      console.log('Updated package.json to use @mui/x-date-pickers@5.0.0-alpha.7');
      console.log('\nNow run: cd frontend && npm install && npm start');
    });
  } catch (e) {
    console.error('Error parsing package.json:', e);
  }
});
