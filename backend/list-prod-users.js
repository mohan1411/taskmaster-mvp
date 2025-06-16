require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/userModel');

// Force production database
const PROD_URI = 'mongodb+srv://fizztask:Cworx$6211@fizztask.2c8tdm8.mongodb.net/fizztask?retryWrites=true&w=majority&appName=fizztask';

async function listProdUsers() {
  try {
    console.log('Connecting to PRODUCTION database...');
    await mongoose.connect(PROD_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to:', mongoose.connection.host);
    console.log('Database:', mongoose.connection.name);
    
    const users = await User.find({}, 'email name createdAt').sort('email');
    
    console.log(`\nTotal users: ${users.length}\n`);
    console.log('All users in production database:');
    console.log('================================');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Created: ${user.createdAt}\n`);
    });
    
    // Look for users with "mohan" in email
    const mohanUsers = users.filter(u => u.email.toLowerCase().includes('mohan'));
    if (mohanUsers.length > 0) {
      console.log('\nUsers with "mohan" in email:');
      console.log('============================');
      mohanUsers.forEach(u => {
        console.log(`- ${u.email}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listProdUsers();