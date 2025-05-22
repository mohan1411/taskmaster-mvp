// Create a patch script to update server.js

const fs = require('fs');
const path = require('path');

const serverFilePath = path.join(__dirname, 'server.js');

try {
  // Read the server.js file
  let serverContent = fs.readFileSync(serverFilePath, 'utf8');
  
  // Check if unified routes are already added
  if (serverContent.includes('unifiedEmailRoutes')) {
    console.log('Unified email routes are already added to server.js');
    process.exit(0);
  }
  
  // Add unified email routes import
  let updatedContent = serverContent.replace(
    'const testRoutes = require(\'./routes/testRoutes\');',
    'const testRoutes = require(\'./routes/testRoutes\');\nconst unifiedEmailRoutes = require(\'./routes/unifiedEmailRoutes\');'
  );
  
  // Add unified email routes usage
  updatedContent = updatedContent.replace(
    'app.use(\'/api/test\', testRoutes);',
    'app.use(\'/api/test\', testRoutes);\napp.use(\'/api/unified-email\', unifiedEmailRoutes);'
  );
  
  // Write the updated content back to server.js
  fs.writeFileSync(serverFilePath, updatedContent, 'utf8');
  
  console.log('Server.js successfully updated with unified email routes!');
  process.exit(0);
} catch (error) {
  console.error('Error updating server.js:', error);
  process.exit(1);
}
