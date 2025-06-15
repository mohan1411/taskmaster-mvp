const mongoose = require('mongoose');
const User = require('./models/userModel');
require('dotenv').config();

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('\nConnected to MongoDB');
    
    const users = await User.find({}).select('name email _id createdAt');
    
    if (users.length === 0) {
      console.log('\nNo users found in the database.');
    } else {
      console.log(`\nFound ${users.length} user(s):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listUsers();
