/**
 * Migration: Add database indexes for performance optimization
 * 
 * Run this migration with:
 * node migrations/001-add-indexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const createIndexes = require('../utils/createIndexes');

const migrate = async () => {
  console.log('Starting migration: Add database indexes');
  console.log('Environment:', process.env.NODE_ENV);
  
  try {
    // Connect to database
    await connectDB();
    
    console.log('Connected to database, creating indexes...');
    
    // Create all indexes
    await createIndexes();
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
migrate();