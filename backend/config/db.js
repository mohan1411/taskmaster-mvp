const mongoose = require('mongoose');

// Fix deprecation warning
mongoose.set('strictQuery', false);

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
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
