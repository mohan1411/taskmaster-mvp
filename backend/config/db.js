const mongoose = require('mongoose');
const createIndexes = require('../utils/createIndexes');

// Fix deprecation warning
mongoose.set('strictQuery', false);

// Enable query logging in development
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}

const connectDB = async () => {
  try {
    // Log the connection string (partially hidden for security)
    const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/fizztask';
    console.log(`Connecting to MongoDB: ${connectionString.includes('@') ? 
      connectionString.replace(/\/\/(.+?)@/, '//***@') : 
      connectionString}`);

    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Connection pool settings
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes after connection
    if (process.env.NODE_ENV === 'production' || process.env.CREATE_INDEXES === 'true') {
      console.log('Creating database indexes...');
      try {
        await createIndexes();
      } catch (indexError) {
        console.error('Warning: Failed to create some indexes:', indexError.message);
        // Don't exit on index creation failure
      }
    }
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
