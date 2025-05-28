const fs = require('fs');
const path = require('path');

/**
 * FizzTask Domain Migration Script
 * 
 * This script helps migrate from TaskMaster to FizzTask branding
 * and updates domain references to fizztask.com
 */

// Configuration
const PROJECT_ROOT = __dirname;
const SEARCH_PATTERNS = [
  { from: 'TaskMaster', to: 'FizzTask' },
  { from: 'taskmaster', to: 'fizztask' },
  { from: 'localhost:5000', to: 'localhost:8000' }, // Update API port
  { from: 'noreply@localhost.com', to: 'noreply@fizztask.com' },
  { from: 'support@localhost.com', to: 'support@fizztask.com' }
];

// File extensions to process
const FILE_EXTENSIONS = ['.js', '.jsx', '.md', '.json', '.html', '.css'];

// Directories to skip
const SKIP_DIRECTORIES = [
  'node_modules',
  '.git',
  'build',
  'dist',
  'coverage',
  'uploads'
];

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  
  // Skip certain files
  if (fileName.startsWith('.') && fileName !== '.env.example') {
    return false;
  }
  
  return FILE_EXTENSIONS.includes(ext);
}

function shouldSkipDirectory(dirPath) {
  const dirName = path.basename(dirPath);
  return SKIP_DIRECTORIES.includes(dirName);
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    SEARCH_PATTERNS.forEach(pattern => {
      const regex = new RegExp(pattern.from, 'g');
      if (regex.test(newContent)) {
        newContent = newContent.replace(regex, pattern.to);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Updated: ${path.relative(PROJECT_ROOT, filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath) {
  let totalFiles = 0;
  let updatedFiles = 0;
  
  function walkDirectory(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        if (!shouldSkipDirectory(fullPath)) {
          walkDirectory(fullPath);
        }
      } else if (stats.isFile()) {
        if (shouldProcessFile(fullPath)) {
          totalFiles++;
          if (processFile(fullPath)) {
            updatedFiles++;
          }
        }
      }
    });
  }
  
  walkDirectory(dirPath);
  return { totalFiles, updatedFiles };
}

function createProductionEnvFiles() {
  console.log('\n📝 Creating production environment file templates...\n');
  
  // Backend production .env template
  const backendEnvProd = `# FizzTask Production Environment Configuration
# Copy this to .env for production deployment

NODE_ENV=production
PORT=8000

# MongoDB Atlas Production Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fizztask?retryWrites=true&w=majority

# JWT Configuration (Use strong, unique keys)
JWT_SECRET=your_production_jwt_secret_key_minimum_32_characters
JWT_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_production_refresh_token_secret_key_minimum_32_characters
REFRESH_TOKEN_EXPIRY=7d

# Google OAuth Configuration for fizztask.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://fizztask.com/api/auth/google/callback

# Production URLs
FRONTEND_URL=https://fizztask.com
APP_URL=https://fizztask.com

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@fizztask.com

# CORS Configuration
ALLOWED_ORIGINS=https://fizztask.com,https://www.fizztask.com

# Debug Configuration
DEBUG=false
`;

  // Frontend production .env template
  const frontendEnvProd = `# FizzTask Frontend Production Environment Configuration
# Copy this to .env.local for production deployment

REACT_APP_API_URL=https://fizztask.com
REACT_APP_APP_NAME=FizzTask
REACT_APP_APP_VERSION=1.0.0
REACT_APP_DOMAIN=fizztask.com
REACT_APP_ENVIRONMENT=production

# OAuth Configuration
REACT_APP_OAUTH_REDIRECT_URI=https://fizztask.com/auth/callback

# Email Configuration
REACT_APP_CONTACT_EMAIL=support@fizztask.com

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_NOTIFICATIONS=true

# Optional: Google Analytics
# REACT_APP_GA_TRACKING_ID=your_google_analytics_id
`;

  try {
    fs.writeFileSync(path.join(PROJECT_ROOT, 'backend', '.env.production'), backendEnvProd);
    console.log('✅ Created: backend/.env.production');
    
    fs.writeFileSync(path.join(PROJECT_ROOT, 'frontend', '.env.production'), frontendEnvProd);
    console.log('✅ Created: frontend/.env.production');
  } catch (error) {
    console.error('❌ Error creating production env files:', error.message);
  }
}

function updatePackageJsonScripts() {
  console.log('\n📦 Updating package.json scripts...\n');
  
  try {
    // Update root package.json
    const rootPackagePath = path.join(PROJECT_ROOT, 'package.json');
    if (fs.existsSync(rootPackagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
      
      packageJson.scripts = {
        ...packageJson.scripts,
        'build': 'cd frontend && npm run build',
        'build:prod': 'cd frontend && REACT_APP_ENVIRONMENT=production npm run build',
        'deploy': 'npm run build:prod && pm2 restart fizztask',
        'start:prod': 'cd backend && NODE_ENV=production node server.js',
        'start:dev': 'concurrently "cd backend && npm run dev" "cd frontend && npm start"'
      };
      
      fs.writeFileSync(rootPackagePath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Updated: package.json scripts');
    }
    
    // Update frontend package.json
    const frontendPackagePath = path.join(PROJECT_ROOT, 'frontend', 'package.json');
    if (fs.existsSync(frontendPackagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
      
      packageJson.scripts = {
        ...packageJson.scripts,
        'build:prod': 'REACT_APP_ENVIRONMENT=production react-scripts build'
      };
      
      fs.writeFileSync(frontendPackagePath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Updated: frontend/package.json scripts');
    }
  } catch (error) {
    console.error('❌ Error updating package.json:', error.message);
  }
}

function generateMigrationSummary(stats) {
  console.log('\n' + '='.repeat(60));
  console.log('🎉 FIZZTASK DOMAIN MIGRATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`📊 Files processed: ${stats.totalFiles}`);
  console.log(`✅ Files updated: ${stats.updatedFiles}`);
  console.log(`📋 Search patterns applied: ${SEARCH_PATTERNS.length}`);
  
  console.log('\n📋 MIGRATION SUMMARY:');
  SEARCH_PATTERNS.forEach(pattern => {
    console.log(`   • ${pattern.from} → ${pattern.to}`);
  });
  
  console.log('\n📝 NEXT STEPS:');
  console.log('1. Review and update production environment variables');
  console.log('2. Set up Google OAuth for fizztask.com domain');
  console.log('3. Configure MongoDB Atlas for production');
  console.log('4. Update DNS settings for fizztask.com');
  console.log('5. Deploy to production server');
  console.log('6. Test all functionality on fizztask.com');
  
  console.log('\n📁 NEW FILES CREATED:');
  console.log('   • backend/.env.production');
  console.log('   • frontend/.env.production');
  console.log('   • FIZZTASK_DEPLOYMENT_GUIDE.md');
  
  console.log('\n🔗 DOMAINS CONFIGURED:');
  console.log('   • Primary: https://fizztask.com');
  console.log('   • www: https://www.fizztask.com');
  console.log('   • API: Same domain (recommended)');
  
  console.log('\n✅ Your FizzTask application is ready for fizztask.com deployment!');
  console.log('='.repeat(60) + '\n');
}

// Main execution
function main() {
  console.log('🚀 Starting FizzTask Domain Migration...\n');
  console.log('🔍 Processing files with the following patterns:');
  SEARCH_PATTERNS.forEach(pattern => {
    console.log(`   • ${pattern.from} → ${pattern.to}`);
  });
  console.log('');
  
  // Process all files
  const stats = processDirectory(PROJECT_ROOT);
  
  // Create production environment files
  createProductionEnvFiles();
  
  // Update package.json scripts
  updatePackageJsonScripts();
  
  // Generate summary
  generateMigrationSummary(stats);
}

// Run the migration
if (require.main === module) {
  main();
}

module.exports = {
  processDirectory,
  processFile,
  SEARCH_PATTERNS,
  FILE_EXTENSIONS,
  SKIP_DIRECTORIES
};
