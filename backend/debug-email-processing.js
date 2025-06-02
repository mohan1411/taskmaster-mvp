// Debug email processing errors
const mongoose = require('mongoose');
const config = require('../config/config');
const Email = require('../models/emailModel');
const Settings = require('../models/settingsModel');

console.log('=== Email Processing Debug ===');

const debugEmailProcessing = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.mongoUri);
    console.log('✓ Database connected');

    // Check OpenAI configuration
    console.log('\n=== OpenAI Configuration ===');
    console.log('OpenAI API Key:', config.openaiApiKey ? 'SET (starts with ' + config.openaiApiKey.substring(0, 10) + '...)' : 'MISSING');
    
    // Check if OpenAI module is available
    try {
      const { getOpenAI } = require('../utils/openaiHelper');
      const openai = getOpenAI();
      console.log('OpenAI Helper:', openai ? 'Available' : 'Not available');
    } catch (openaiError) {
      console.log('OpenAI Helper Error:', openaiError.message);
    }

    // Find a sample email to test with
    const sampleEmail = await Email.findOne().sort({ receivedAt: -1 });
    if (sampleEmail) {
      console.log('\n=== Sample Email ===');
      console.log('Email ID:', sampleEmail._id);
      console.log('Subject:', sampleEmail.subject);
      console.log('From:', sampleEmail.sender.email);
      console.log('Task Extracted:', sampleEmail.taskExtracted || false);
      console.log('Needs Follow-up:', sampleEmail.needsFollowUp || false);
    } else {
      console.log('\n❌ No emails found in database');
    }

    // Check email controller functions
    console.log('\n=== Controller Functions ===');
    try {
      const emailController = require('../controllers/emailController');
      console.log('Email Controller loaded:', !!emailController);
      console.log('Extract Tasks function:', typeof emailController.extractTasksFromEmail);
      console.log('Detect Follow-up function:', typeof emailController.detectFollowUp);
    } catch (controllerError) {
      console.log('Controller Error:', controllerError.message);
    }

    // Test API endpoints exist
    console.log('\n=== API Endpoints ===');
    console.log('Expected endpoints:');
    console.log('POST /api/emails/:id/extract');
    console.log('POST /api/emails/:id/detect-followup');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

debugEmailProcessing();
