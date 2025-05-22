# TaskMaster AI MVP - Development Setup Guide

This guide walks through setting up your development environment for the TaskMaster AI MVP project. Follow these steps to get your local development environment running.

## Prerequisites

Before beginning, ensure you have the following installed:

- **Node.js** (v16+ recommended) and npm
- **Git** for version control
- **MongoDB** (local installation or MongoDB Atlas account)
- **Visual Studio Code** (recommended) or your preferred code editor
- **Postman** (or similar) for API testing

## Project Setup

### 1. Clone or Create the Repository

You can either create a new repository or work with a local folder structure:

```bash
# Create the project directory structure
mkdir -p TaskMaster/client TaskMaster/server
cd TaskMaster
```

### 2. Frontend Setup (React)

```bash
# Navigate to client directory
cd client

# Initialize a new React app
npx create-react-app .

# Install required dependencies
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install react-router-dom axios date-fns recharts

# Create .env file
touch .env
```

Edit the `.env` file and add:

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Backend Setup (Node.js/Express)

```bash
# Navigate to server directory
cd ../server

# Initialize a new Node.js project
npm init -y

# Install required dependencies
npm install express mongoose dotenv cors passport passport-google-oauth20 
npm install jsonwebtoken googleapis openai helmet morgan winston
npm install nodemon -D

# Create .env file
touch .env
```

Edit the `.env` file and add:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskmaster
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### 4. Database Setup

#### Option 1: Local MongoDB

If using a local MongoDB installation:

```bash
# Start MongoDB service (Linux/Mac)
sudo service mongod start

# Or on Windows, ensure MongoDB service is running
```

#### Option 2: MongoDB Atlas (Recommended)

1. Create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (the free tier is sufficient for development)
3. Set up database access credentials
4. Whitelist your IP address
5. Get your connection string and update your `.env` file:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskmaster?retryWrites=true&w=majority
```

## API Credentials Setup

### 1. Google API Setup

You'll need to create a Google Cloud project and configure OAuth credentials for Gmail API access:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Gmail API and Google OAuth APIs
4. Configure the OAuth consent screen:
   - Select "External" user type
   - Add required app information
   - Add scopes for Gmail API (especially `.../auth/gmail.readonly`)
   - Add your email as a test user
5. Create OAuth 2.0 credentials:
   - Add authorized JavaScript origins: `http://localhost:3000`
   - Add authorized redirect URIs: `http://localhost:3000/auth/google/callback`
6. Copy your Client ID and Client Secret to your `.env` files

### 2. OpenAI API Setup

For the AI task extraction features:

1. Create an account at [OpenAI](https://platform.openai.com/)
2. Generate a new API key
3. Add your API key to the server `.env` file

## Project Configuration

### 1. Configure MongoDB Connection

Create `server/config/database.js`:

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### 2. Configure Express Server

Create `server/server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Default route
app.get('/', (req, res) => {
  res.send('TaskMaster API is running...');
});

// Define routes later
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/tasks', require('./routes/tasks'));
// app.use('/api/emails', require('./routes/emails'));
// app.use('/api/followups', require('./routes/followups'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
```

### 3. Configure Package Scripts

Update `server/package.json` scripts:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

Update `client/package.json` to add proxy for local development:

```json
"proxy": "http://localhost:5000"
```

## Running the Development Environment

### Start Backend Server

```bash
cd server
npm run dev
```

### Start Frontend Development Server

```bash
cd client
npm start
```

Your React application should now be running on `http://localhost:3000` and the API server on `http://localhost:5000`.

## Project Structure Implementation

Follow these steps to set up the project structure:

### Frontend Structure

```bash
cd client/src
mkdir -p components/{auth,dashboard,email,followups,layout,shared}
mkdir -p contexts hooks services utils
touch App.js index.js routes.js
```

### Backend Structure

```bash
cd ../../server
mkdir -p config controllers middleware models routes services utils
touch server.js
```

## Testing the Setup

### Check the MongoDB Connection

Start your server and check the console for:
```
MongoDB Connected: your_connection_host
```

### Test the API Server

Access `http://localhost:5000` in your browser or with Postman, should see:
```
TaskMaster API is running...
```

### Test the React App

Access `http://localhost:3000` in your browser to confirm the React app is running.

## Troubleshooting Common Issues

### Connection Issues with MongoDB

- Check if MongoDB service is running
- Verify the connection string in your `.env` file
- Ensure your IP is whitelisted if using MongoDB Atlas

### CORS Errors

If you see CORS errors in your browser console:
- Verify your CORS middleware is properly configured
- Check that your API URLs match the expected format

### OAuth Configuration Issues

- Ensure your Google OAuth credentials include the correct redirect URLs
- Verify all required scopes are added to your project

## Next Steps

After completing this setup:

1. Implement the authentication system using Google OAuth
2. Set up the database models
3. Start implementing the API endpoints 
4. Develop the React frontend components

For a detailed implementation guide, refer to the [API Integration Guide](../api/API_Integration.md) and [Technical Architecture](../../architecture/technical/Technical_Architecture.md).
