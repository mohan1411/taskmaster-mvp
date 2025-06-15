import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import documentService from '../../services/documentService';

const DocumentUpload = ({ onUploadSuccess, onUploadError, multiple = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  // Get supported file types for validation display
  const supportedTypes = documentService.getSupportedFileTypes();
  const acceptedMimeTypes = Object.values(supportedTypes)
    .flatMap(type => type.mimeTypes)
    .join(',');

  // Handle file selection
  const handleFileSelect = useCallback((files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const errors = [];

    fileArray.forEach((file) => {
      const validation = documentService.validateFile(file);
      if (validation.valid) {
        validFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          type: validation.fileType,
          name: file.name,
          size: file.size
        });
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      onUploadError?.(errors.join('\n'));
    }

    if (multiple) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    } else {
      setSelectedFiles(validFiles.slice(0, 1));
    }
  }, [multiple, onUploadError]);

  // File input change handler
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  // Remove selected file
  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Upload progress handler
  const handleUploadProgress = (progressEvent) => {
    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    setUploadProgress(prev => ({ ...prev, overall: progress }));
  };

  // Handle upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress({});

    try {
      let result;
      
      if (selectedFiles.length === 1) {
        // Single file upload
        result = await documentService.scanDocument(
          selectedFiles[0].file,
          { onProgress: handleUploadProgress }
        );
      } else {
        // Multiple file upload
        const files = selectedFiles.map(f => f.file);
        result = await documentService.scanMultipleDocuments(
          files,
          { onProgress: handleUploadProgress }
        );
      }

      // Success callback
      onUploadSuccess?.(result.data);
      
      // Reset form
      setSelectedFiles([]);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(
        error.response?.data?.message || 
        'Failed to upload document(s). Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file type icon
  const getFileIcon = (type) => {
    const icons = {
      pdf: '📄',
      word: '📝',
      excel: '📊',
      csv: '📋',
      text: '📄'
    };
    return icons[type] || '📄';
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* Upload Area */}
      <Paper
        sx={{
          border: 2,
          borderStyle: 'dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 6,
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          backgroundColor: isDragging
            ? 'action.hover'
            : uploading
            ? 'action.selected'
            : 'background.paper',
          '&:hover': {
            borderColor: uploading ? 'divider' : 'primary.light',
            backgroundColor: uploading ? 'action.selected' : 'action.hover'
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedMimeTypes}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {uploading ? (
            <>
              <UploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
              <Typography variant="h6" component="h3">
                Processing Document{selectedFiles.length > 1 ? 's' : ''}...
              </Typography>
              {uploadProgress.overall && (
                <Box sx={{ width: '100%', maxWidth: 300 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress.overall} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}
            </>
          ) : (
            <>
              <UploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
              <Typography variant="h6" component="h3">
                {multiple ? 'Upload Documents' : 'Upload Document'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Drag and drop your files here, or click to browse
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supported: PDF, Word, Excel, CSV, Text files
              </Typography>
            </>
          )}
        </Box>
      </Paper>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Selected Files ({selectedFiles.length})
          </Typography>
          <List>
            {selectedFiles.map((fileData) => (
              <ListItem
                key={fileData.id}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: 'background.paper'
                }}
                secondaryAction={
                  !uploading && (
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(fileData.id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )
                }
              >
                <ListItemIcon>
                  <FileIcon />
                </ListItemIcon>
                <ListItemText
                  primary={fileData.name}
                  secondary={formatFileSize(fileData.size)}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleUpload}
            disabled={uploading}
            startIcon={uploading ? null : <FileIcon />}
            sx={{ minWidth: 200 }}
          >
            {uploading ? (
              'Processing...'
            ) : (
              `Extract Tasks (${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''})`
            )}
          </Button>
        </Box>
      )}

      {/* Help Text */}
      <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            📋 What we extract:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            <Typography component="li" variant="body2">Action items and tasks</Typography>
            <Typography component="li" variant="body2">Deadlines and due dates</Typography>
            <Typography component="li" variant="body2">Priority levels</Typography>
            <Typography component="li" variant="body2">Assignees and responsible parties</Typography>
          </Box>
        </Paper>
        
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            📁 Supported formats:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            <Typography component="li" variant="body2"><strong>PDF:</strong> Up to 50MB</Typography>
            <Typography component="li" variant="body2"><strong>Word:</strong> .docx, .doc up to 25MB</Typography>
            <Typography component="li" variant="body2"><strong>Excel:</strong> .xlsx, .xls up to 25MB</Typography>
            <Typography component="li" variant="body2"><strong>CSV:</strong> Up to 10MB</Typography>
            <Typography component="li" variant="body2"><strong>Text:</strong> .txt up to 5MB</Typography>
          </Box>
        </Paper>
      </Box>
    </Paper>
  );
};

export default DocumentUpload;
