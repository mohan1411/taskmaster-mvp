 
const supportedTypes = { 
  'application/pdf': 'pdf', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word', 
  'application/msword': 'word', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel', 
  'application/vnd.ms-excel': 'excel', 
  'text/csv': 'csv', 
  'text/plain': 'text' 
}; 
 
exports.isSupported = (mimeType) => { 
  return mimeType in supportedTypes; 
}; 
 
exports.getProcessor = (mimeType) => { 
  return supportedTypes[mimeType]; 
}; 
 
exports.sanitizeFilename = (filename) => { 
  const timestamp = Date.now(); 
  const random = Math.random().toString(36).substring(7); 
  const ext = filename.split('.').pop(); 
  return `${timestamp}-${random}.${ext}`; 
}; 
 
exports.validateFile = async (filePath, mimeType) => { 
  return { valid: true }; 
}; 
 
exports.detectDocumentType = async (text) => { 
  if (text.includes('agreement') || text.includes('contract')) return 'contract'; 
  if (text.includes('meeting') || text.includes('minutes')) return 'meeting'; 
  if (text.includes('project') || text.includes('plan')) return 'project'; 
  return 'general'; 
}; 
 
exports.getSupportedTypes = () => Object.keys(supportedTypes); 
