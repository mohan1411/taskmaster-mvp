const User = require('./models/userModel'); 
const Settings = require('./models/settingsModel'); 
const bcrypt = require('bcryptjs'); 
require('dotenv').config(); 
 
async function createAdmin() { 
  try { 
    await mongoose.connect(process.env.MONGODB_URI); 
    console.log('Connected to MongoDB'); 
 
    const adminEmail = ''; 
    const adminPassword = ''; 
 
    const existingAdmin = await User.findOne({ email: adminEmail }); 
 
    if (existingAdmin) { 
      console.log(`Admin already exists: ${existingAdmin.email}`); 
      const salt = await bcrypt.genSalt(10); 
      const hashedPassword = await bcrypt.hash(adminPassword, salt); 
      await User.updateOne({ _id: existingAdmin._id }, { $set: { password: hashedPassword, role: 'admin' } }); 
      console.log('Admin password updated'); 
      mongoose.connection.close(); 
      return; 
    } 
 
    const salt = await bcrypt.genSalt(10); 
    const hashedPassword = await bcrypt.hash(adminPassword, salt); 
 
    const newAdmin = new User({ 
      name: 'Administrator', 
      email: adminEmail, 
      password: hashedPassword, 
      role: 'admin', 
      isEmailVerified: true, 
    }); 
 
    const savedAdmin = await newAdmin.save(); 
    console.log(`Admin created: ${savedAdmin.email}`); 
 
    const settings = new Settings({ 
      user: savedAdmin._id, 
    }); 
    await settings.save(); 
 
    console.log('Admin settings created'); 
    mongoose.connection.close(); 
 
  } catch (error) { 
    console.error('Error creating admin:', error); 
  } 
} 
 
createAdmin(); 
