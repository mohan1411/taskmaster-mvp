// Set up React app to use reminder server
console.log("Setting up frontend to use reminder server on port 8001");

// Create .env.local file with API URL
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, 'frontend/.env.local');
console.log("Creating .env.local at:", envPath);

try {
  fs.writeFileSync(envPath, 'REACT_APP_API_URL=http://localhost:8001\n');
  console.log("Created .env.local file with API URL: http://localhost:8001");
} catch (err) {
  console.error("Error creating .env.local file:", err.message);
  console.log("You'll need to manually create a .env.local file in the frontend directory with:");
  console.log("REACT_APP_API_URL=http://localhost:8001");
}

console.log("\nTo start the frontend, run:");
console.log("cd frontend");
console.log("npm start");
