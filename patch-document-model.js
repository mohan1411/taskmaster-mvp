const fs = require('fs').promises;
const path = require('path');

/**
 * Patch the Document model to accept string emailIds
 */

async function patchDocumentModel() {
  try {
    console.log('🔧 Patching Document model to accept string emailIds...\n');
    
    const modelPath = path.join(__dirname, 'backend', 'models', 'documentModel.js');
    
    // Read the current model
    let content = await fs.readFile(modelPath, 'utf8');
    
    // Check if already patched
    if (content.includes('emailId: { type: String')) {
      console.log('✅ Document model already accepts string emailIds');
      return;
    }
    
    // Replace the emailId definition
    const oldDefinition = `emailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email',
    index: true
  }`;
    
    const newDefinition = `emailId: {
    type: String,  // Changed to accept both ObjectId and string formats
    index: true
  }`;
    
    if (content.includes(oldDefinition)) {
      content = content.replace(oldDefinition, newDefinition);
      console.log('✅ Found and replaced emailId definition');
    } else {
      // Try a more flexible search
      const regex = /emailId:\s*{\s*type:\s*mongoose\.Schema\.Types\.ObjectId[^}]*}/s;
      if (regex.test(content)) {
        content = content.replace(regex, newDefinition);
        console.log('✅ Found and replaced emailId definition (regex)');
      } else {
        console.log('⚠️  Could not find emailId definition to replace');
        console.log('   You may need to manually edit the Document model');
      }
    }
    
    // Write back the file
    await fs.writeFile(modelPath, content, 'utf8');
    
    console.log('✅ Document model patched successfully!');
    console.log('\n📋 What changed:');
    console.log('- emailId now accepts String type instead of ObjectId');
    console.log('- This allows non-standard ID formats');
    console.log('\n🚀 Next: Run fix-string-id.bat to process the PDF');
    
  } catch (error) {
    console.error('❌ Error patching model:', error);
    process.exit(1);
  }
}

// Run the patch
patchDocumentModel();
