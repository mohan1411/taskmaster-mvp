// Compare Production vs Development DB schemas
const mongoose = require('mongoose');

console.log('=== Database Schema Comparison Tool ===');

const compareSchemas = async () => {
  try {
    // Development DB Connection
    const devUri = 'mongodb+srv://mohan1411:Cworx$6211@taskmaster.wizlccc.mongodb.net/fizztask?retryWrites=true&w=majority&appName=TaskMaster';
    
    console.log('1. Connecting to Development DB...');
    await mongoose.connect(devUri);
    console.log('✓ Connected to Development DB');

    // Get development collections
    const devDb = mongoose.connection.db;
    const devCollections = await devDb.listCollections().toArray();
    
    console.log('\n=== DEVELOPMENT DATABASE ===');
    console.log('Database:', devDb.databaseName);
    console.log('Collections:');
    for (const collection of devCollections) {
      const count = await devDb.collection(collection.name).countDocuments();
      console.log(`  📁 ${collection.name}: ${count} documents`);
    }

    // Check if Task model exists in dev
    console.log('\n=== DEVELOPMENT TASK MODEL ===');
    try {
      const Task = require('../models/taskModel');
      console.log('✓ Task model found');
      
      // Get a sample task to see schema
      const sampleTask = await Task.findOne();
      if (sampleTask) {
        console.log('Sample task fields:', Object.keys(sampleTask.toObject()));
        console.log('Sample task:', JSON.stringify(sampleTask, null, 2));
      } else {
        console.log('❌ No tasks found in development');
        
        // Try to create a test task to see if model works
        console.log('Testing task creation...');
        const User = require('../models/userModel');
        const testUser = await User.findOne();
        
        if (testUser) {
          const testTask = new Task({
            title: 'Schema Test Task',
            description: 'Testing if task model works',
            user: testUser._id,
            status: 'pending',
            priority: 'medium'
          });
          
          await testTask.save();
          console.log('✅ Test task created successfully:', testTask._id);
        }
      }
      
    } catch (taskError) {
      console.log('❌ Task model error:', taskError.message);
    }

    await mongoose.disconnect();

    // Now connect to production to compare
    console.log('\n2. Connecting to Production DB...');
    
    // You'll need to provide the production connection string
    // For now, let's check the local task model schema
    console.log('\n=== TASK MODEL SCHEMA ANALYSIS ===');
    
    // Load and analyze task model
    const Task = require('../models/taskModel');
    const taskSchema = Task.schema;
    
    console.log('Task Schema Paths:');
    Object.keys(taskSchema.paths).forEach(path => {
      const schemaType = taskSchema.paths[path];
      console.log(`  ${path}: ${schemaType.instance || schemaType.constructor.name}`);
      if (schemaType.isRequired) console.log(`    - Required`);
      if (schemaType.default !== undefined) console.log(`    - Default: ${schemaType.default}`);
    });

    console.log('\nTask Schema Indexes:');
    taskSchema.indexes().forEach(index => {
      console.log(`  Index:`, index);
    });

  } catch (error) {
    console.error('❌ Schema comparison failed:', error);
  }
};

compareSchemas();
