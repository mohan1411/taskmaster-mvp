const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Setup script for TaskMaster project
console.log('Starting TaskMaster setup...');

// Create .env files if they don't exist
const createEnvFile = (directory, templatePath) => {
  const envPath = path.join(directory, '.env');
  const templateEnvPath = path.join(directory, templatePath);
  
  if (!fs.existsSync(envPath) && fs.existsSync(templateEnvPath)) {
    fs.copyFileSync(templateEnvPath, envPath);
    console.log(`Created .env file in ${directory}`);
  } else if (fs.existsSync(envPath)) {
    console.log(`.env file already exists in ${directory}`);
  } else {
    console.log(`Warning: Could not create .env file in ${directory} (template not found)`);
  }
};

// Install dependencies for a directory
const installDependencies = (directory) => {
  console.log(`Installing dependencies in ${directory}...`);
  try {
    execSync('npm install', { cwd: directory, stdio: 'inherit' });
    console.log(`Dependencies installed in ${directory}`);
  } catch (error) {
    console.error(`Error installing dependencies in ${directory}:`, error.message);
  }
};

// Setup backend
const setupBackend = () => {
  const backendDir = path.join(__dirname, 'backend');
  
  // Create .env file
  createEnvFile(backendDir, '.env.example');
  
  // Install dependencies
  installDependencies(backendDir);
};

// Setup frontend
const setupFrontend = () => {
  const frontendDir = path.join(__dirname, 'frontend');
  
  // Create .env file if needed
  if (fs.existsSync(path.join(frontendDir, '.env.example'))) {
    createEnvFile(frontendDir, '.env.example');
  }
  
  // Install dependencies
  installDependencies(frontendDir);
};

// Check if directories exist
if (fs.existsSync(path.join(__dirname, 'backend'))) {
  setupBackend();
} else {
  console.error('Backend directory not found!');
}

if (fs.existsSync(path.join(__dirname, 'frontend'))) {
  setupFrontend();
} else {
  console.error('Frontend directory not found!');
}

console.log('\nSetup complete!');
console.log('\nNext steps:');
console.log('1. Configure your .env files with appropriate values');
console.log('2. Start the backend: cd backend && npm run dev');
console.log('3. Start the frontend: cd frontend && npm start');
