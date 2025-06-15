const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/userModel');

async function listAllUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmaster', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('📋 All Users in Database:\n');
    
    const users = await User.find({}, 'email name role createdAt');
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('   Run: node populate-demo-data.js');
    } else {
      users.forEach((user, index) => {
        console.log(`User ${index + 1}:`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Created: ${user.createdAt}`);
        console.log('---');
      });
      
      console.log(`\nTotal users: ${users.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

listAllUsers();