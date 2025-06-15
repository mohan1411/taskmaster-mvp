// Add document routes to server.js
// This code should be added to your existing server.js file

// After other route imports, add:
const documentRoutes = require('./routes/documentRoutes');

// After other route definitions, add:
app.use('/api/documents', documentRoutes);

// Also add a background job to process pending documents
// This can be added after database connection is established:

// Start background document processing
const attachmentProcessor = require('./services/attachmentProcessor');
setInterval(() => {
  attachmentProcessor.processPendingDocuments()
    .catch(error => console.error('Background document processing error:', error));
}, 30000); // Run every 30 seconds

console.log('Document processing service started');
