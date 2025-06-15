const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function forceCreateUser() {
  try {
    console.log('🚨 FORCE CREATING DEMO USER\n');
    
    // Direct connection
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmaster', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Define user schema inline to avoid any model issues
    const userSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true, lowercase: true },
      password: String,
      role: { type: String, default: 'user' },
      isEmailVerified: { type: Boolean, default: false }
    }, { timestamps: true });
    
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Delete any existing user
    console.log('Deleting any existing demo user...');
    await User.deleteMany({ email: 'newuser@example.com' });
    
    // Create new user with manually hashed password
    console.log('Creating fresh demo user...');
    const hashedPassword = await bcrypt.hash('demo123', 10);
    console.log('Password hash created:', hashedPassword.substring(0, 20) + '...');
    
    const newUser = await User.create({
      name: 'Alex Johnson',
      email: 'newuser@example.com',
      password: hashedPassword,
      role: 'user',
      isEmailVerified: true
    });
    
    console.log('✅ User created with ID:', newUser._id);
    
    // Verify
    const verifyUser = await User.findOne({ email: 'newuser@example.com' });
    console.log('\nVerification:');
    console.log('  Found user:', verifyUser ? 'Yes' : 'No');
    console.log('  Email:', verifyUser.email);
    console.log('  Has password:', verifyUser.password ? 'Yes' : 'No');
    
    // Test password
    const passwordTest = await bcrypt.compare('demo123', verifyUser.password);
    console.log('  Password test:', passwordTest ? '✅ PASS' : '❌ FAIL');
    
    console.log('\n✅ DONE! Login with:');
    console.log('  Email: newuser@example.com');
    console.log('  Password: demo123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

forceCreateUser();