const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting FizzTask build process...');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

try {
  // Log NPM version
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log('NPM version:', npmVersion);
} catch (e) {
  console.error('Failed to get NPM version:', e.message);
}

// Change to frontend directory
const frontendPath = path.join(process.cwd(), 'frontend');
console.log('Frontend path:', frontendPath);

if (!fs.existsSync(frontendPath)) {
  console.error('❌ Frontend directory not found!');
  process.exit(1);
}

process.chdir(frontendPath);
console.log('Changed to frontend directory');

// List directory contents
console.log('\n📁 Frontend directory contents:');
const files = fs.readdirSync('.');
files.forEach(file => console.log(`  - ${file}`));

// Check if package.json exists
if (!fs.existsSync('package.json')) {
  console.error('❌ package.json not found in frontend directory!');
  process.exit(1);
}

console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install --force', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ npm install failed:', error.message);
  process.exit(1);
}

console.log('\n🏗️  Building React app...');
try {
  execSync('CI=false npm run build', { stdio: 'inherit', env: { ...process.env, CI: 'false' } });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Check if build directory was created
if (fs.existsSync('build')) {
  console.log('\n✅ Build directory created successfully');
  const buildFiles = fs.readdirSync('build');
  console.log('Build directory contents:', buildFiles.length, 'files');
} else {
  console.error('❌ Build directory not found after build!');
  process.exit(1);
}

console.log('\n🎉 Build process completed successfully!');