const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/userModel');

async function resetDemoPassword() {
  try {
    console.log('🔐 Resetting Demo User Password\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmaster', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Find or create demo user
    let user = await User.findOne({ email: 'newuser@example.com' });
    
    if (!user) {
      console.log('Creating new demo user...');
      const hashedPassword = await bcrypt.hash('demo123', 10);
      user = new User({
        name: 'Alex Johnson',
        email: 'newuser@example.com',
        password: hashedPassword,
        role: 'user',
        isEmailVerified: true
      });
      await user.save();
      console.log('✅ Created new demo user');
    } else {
      console.log('Found existing user, resetting password...');
      user.password = 'demo123'; // Let the pre-save hook hash it
      await user.save();
      console.log('✅ Password reset successfully');
    }
    
    // Verify the password works
    const loginTest = await bcrypt.compare('demo123', user.password);
    console.log(`\n✅ Password verification: ${loginTest ? 'WORKING' : 'FAILED'}`);
    
    console.log('\n📧 Login credentials:');
    console.log('   Email: newuser@example.com');
    console.log('   Password: demo123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

resetDemoPassword();