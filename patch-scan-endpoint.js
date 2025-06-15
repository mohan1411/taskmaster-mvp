const fs = require('fs').promises;
const path = require('path');

/**
 * Patch the scanEmailAttachments endpoint to return existing documents
 */

async function patchScanEndpoint() {
  try {
    console.log('🔧 Patching scanEmailAttachments endpoint...\n');
    
    const controllerPath = path.join(__dirname, 'backend', 'controllers', 'documentController.js');
    
    // Read the controller file
    let content = await fs.readFile(controllerPath, 'utf8');
    
    // Find the scanEmailAttachments function
    const functionStart = content.indexOf('exports.scanEmailAttachments = async (req, res) => {');
    if (functionStart === -1) {
      console.log('❌ Could not find scanEmailAttachments function');
      return;
    }
    
    // Replace the implementation
    const newImplementation = `exports.scanEmailAttachments = async (req, res) => {
  try {
    const { emailId } = req.params;

    // Get email with attachments
    const email = await Email.findById(emailId);
    
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    if (!email.user.equals(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!email.attachments || email.attachments.length === 0) {
      return res.status(404).json({ error: 'No attachments found in this email' });
    }

    // FIXED: Look for existing documents instead of creating new ones
    const existingDocuments = await Document.find({
      emailId: emailId,
      userId: req.user.id,
      deleted: { $ne: true }
    }).select('originalName processingStatus extractedTasks');

    // If documents exist, return them
    if (existingDocuments.length > 0) {
      const results = existingDocuments.map(doc => ({
        documentId: doc._id.toString(),
        filename: doc.originalName,
        status: doc.processingStatus,
        extractedTasks: doc.extractedTasks || []
      }));

      return res.json({
        message: \`Found \${results.length} processed attachments\`,
        email: {
          id: email._id,
          subject: email.subject,
          from: email.from || email.sender
        },
        results: results,
        documents: results
      });
    }

    // Only process if no documents exist
    const results = await attachmentProcessor.processEmailAttachments(
      emailId,
      email.attachments.map(att => ({
        ...att.toObject ? att.toObject() : att,
        userId: req.user.id
      }))
    );

    // Wait a moment for processing to start, then fetch the documents
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the created documents to check for extracted tasks
    const processedDocuments = await Document.find({
      emailId: emailId,
      userId: req.user.id
    }).select('originalName processingStatus extractedTasks');

    // Combine results with extracted tasks
    const resultsWithTasks = results.map(result => {
      const doc = processedDocuments.find(d => d._id.toString() === result.documentId);
      return {
        ...result,
        extractedTasks: doc?.extractedTasks || []
      };
    });

    res.json({
      message: \`Processing \${results.length} attachments\`,
      email: {
        id: email._id,
        subject: email.subject,
        from: email.from || email.sender
      },
      results: resultsWithTasks,
      documents: results
    });
  } catch (error) {
    console.error('Scan email attachments error:', error);
    res.status(500).json({ error: error.message });
  }
};`;

    // Find the end of the function
    let braceCount = 0;
    let inFunction = false;
    let functionEnd = functionStart;
    
    for (let i = functionStart; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (content[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          functionEnd = i + 2; // Include the semicolon
          break;
        }
      }
    }
    
    // Replace the function
    content = content.substring(0, functionStart) + newImplementation + content.substring(functionEnd);
    
    // Write back the file
    await fs.writeFile(controllerPath, content, 'utf8');
    
    console.log('✅ Endpoint patched successfully!');
    console.log('\n📋 What changed:');
    console.log('- The endpoint now checks for existing documents first');
    console.log('- Only creates new documents if none exist');
    console.log('- Returns existing documents with their extracted tasks');
    console.log('\n🚀 Next steps:');
    console.log('1. Restart the backend server');
    console.log('2. Try clicking "Extract Tasks from 1 Document" again');
    
  } catch (error) {
    console.error('❌ Error patching endpoint:', error);
    process.exit(1);
  }
}

// Run the patch
patchScanEndpoint();
