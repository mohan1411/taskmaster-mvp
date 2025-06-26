# Document Extraction Required Packages

The document extraction feature requires the following npm packages:

## Document Parsing
- `pdf-parse` - Parse PDF documents
- `mammoth` - Convert Word documents to HTML/text
- `xlsx` - Parse Excel and CSV files

## Natural Language Processing
- `natural` - NLP library for task detection
- `compromise` - Text analysis and understanding

## File Type Detection
- `file-type` - Detect file type from buffer
- `mime-types` - MIME type detection and extension mapping

## Installation

To install all required packages:

```bash
npm install pdf-parse mammoth xlsx natural compromise file-type mime-types
```

## Enable Feature

After installing packages:

1. Uncomment in `backend/server.js`:
   - Line 144: `const documentRoutes = require('./routes/documentRoutes');`
   - Line 167: `app.use('/api/documents', documentRoutes);`

2. The frontend EmailAttachments component is already enabled

## Verify Installation

Run the check script:
```bash
node backend/scripts/enable-document-extraction.js
```