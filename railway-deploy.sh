#!/bin/bash
# Quick fix for Railway deployment issues

echo "Removing landing folder from deployment..."
rm -rf landing/

echo "Removing landing-specific files..."
rm -f vercel.json
rm -f .vercel*

echo "Starting normal build process..."
npm install

echo "Building backend..."
cd backend && npm install

echo "Building frontend..."
cd ../frontend && npm install && npm run build

echo "Copying frontend build to backend..."
cd ..
mkdir -p backend/public
cp -r frontend/build/* backend/public/

echo "Starting server..."
cd backend
node server.js
