#!/bin/bash

echo "Starting build process..."
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

echo "Navigating to frontend directory..."
cd frontend || exit 1

echo "Listing frontend directory:"
ls -la

echo "Installing dependencies..."
npm install --force || {
    echo "npm install failed with code $?"
    exit 1
}

echo "Building React app..."
CI=false npm run build || {
    echo "npm run build failed with code $?"
    exit 1
}

echo "Build completed successfully!"
echo "Checking build output:"
ls -la build/