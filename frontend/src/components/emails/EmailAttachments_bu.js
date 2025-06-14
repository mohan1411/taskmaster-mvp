import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  AttachFile as AttachmentIcon,
  Description as DocumentIcon,
  TableChart as SpreadsheetIcon,
  PictureAsPdf as PdfIcon,
  TextFields as TextIcon,
  FileDownload as DownloadIcon,
  AutoAwesome as ExtractIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import documentService from '../../services/documentService';
import TaskExtractionReview from '../documents/TaskExtractionReview';

const EmailAttachments = ({ email, onTasksExtracted }) => {
  const [extracting, setExtracting] = useState(false);
  const [extractionResults, setExtractionResults] = useState(null);
  const [showTaskReview, setShowTaskReview] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedAttachment, setExpandedAttachment] = useState(null);

  // Get file icon based on type
  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <PdfIcon color="error" />;
      case 'doc':
      case 'docx':
        return <DocumentIcon color="primary" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <SpreadsheetIcon color="success" />;
      case 'txt':
        return <TextIcon color="action" />;
      default:
        return <AttachmentIcon color="action" />;
    }
  };

  // Check if file is processable
  const isProcessableFile = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const supportedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'];
    return supportedTypes.includes(extension);
  };

  // Get file type description
  const getFileTypeDescription = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const descriptions = {
      pdf: 'PDF Document',
      doc: 'Word Document',
      docx: 'Word Document',
      xls: 'Excel Spreadsheet',
      xlsx: 'Excel Spreadsheet',
      csv: 'CSV File',
      txt: 'Text File'
    };
    return descriptions[extension] || 'Unknown File Type';
  };

  // Extract tasks from email attachments
  const handleExtractFromAttachments = async () => {
    try {
      setExtracting(true);
      setError(null);
      setSuccess(null);

      // Use the email attachment scanning endpoint
      const response = await documentService.scanEmailAttachments(email._id);
      
      if (response.data.results && response.data.results.length > 0) {
        // Combine all extracted tasks from all attachments
        const allTasks = response.data.results.flatMap(result => 
          result.extractedTasks || []
        );

        if (allTasks.length > 0) {
          setExtractionResults({
            attachmentResults: response.data.results,
            allTasks,
            totalDocuments: response.data.results.length,
            totalTasks: allTasks.length
          });
          setShowTaskReview(true);
        } else {
          setError('No tasks found in the email attachments.');
        }
      } else {
        setError('No processable attachments found or no tasks extracted.');
      }
    } catch (err) {
      console.error('Error extracting tasks from attachments:', err);
      setError(
        err.response?.data?.message || 
        'Failed to extract tasks from attachments. Please try again.'
      );
    } finally {
      setExtracting(false);
    }
  };

  // Handle successful task creation
  const handleTasksCreated = (result) => {
    setShowTaskReview(false);
    setExtractionResults(null);
    setSuccess(`Successfully created ${result.created} tasks from email attachments!`);
    
    // Notify parent component
    if (onTasksExtracted) {
      onTasksExtracted(result);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // If no attachments, don't render anything
  if (!email.attachments || email.attachments.length === 0) {
    return null;
  }

  // Count processable attachments
  const processableAttachments = email.attachments.filter(att => 
    isProcessableFile(att.filename)
  );

  return (
    <Box sx={{ mt: 2 }}>
      <Accordion 
        expanded={expandedAttachment === 'attachments'} 
        onChange={() => setExpandedAttachment(
          expandedAttachment === 'attachments' ? null : 'attachments'
        )}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachmentIcon color="action" />
            <Typography variant="subtitle1">
              Attachments ({email.attachments.length})
            </Typography>
            {processableAttachments.length > 0 && (
              <Chip
                label={`${processableAttachments.length} can extract tasks`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          {/* Extract Tasks Button */}
          {processableAttachments.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<ExtractIcon />}
                onClick={handleExtractFromAttachments}
                disabled={extracting}
                sx={{ mb: 1 }}
              >
                {extracting ? 'Extracting Tasks...' : `Extract Tasks from ${processableAttachments.length} Document${processableAttachments.length !== 1 ? 's' : ''}`}
              </Button>
              
              {extracting && (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Processing attachments and extracting tasks...
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Error/Success Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              <AlertTitle>Extraction Failed</AlertTitle>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              <AlertTitle>Success!</AlertTitle>
              {success}
            </Alert>
          )}

          {/* Attachment List */}
          <List dense>
            {email.attachments.map((attachment, index) => (
              <ListItem key={index} divider>
                <ListItemIcon>
                  {getFileIcon(attachment.filename)}
                </ListItemIcon>
                
                <ListItemText
                  primary={attachment.filename}
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {getFileTypeDescription(attachment.filename)} • {formatFileSize(attachment.size)}
                      </Typography>
                      {isProcessableFile(attachment.filename) && (
                        <Chip
                          label="Can extract tasks"
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    aria-label="download"
                    size="small"
                    onClick={() => {
                      // Handle download - would need to implement download functionality
                      console.log('Download attachment:', attachment.filename);
                    }}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          {/* Processing Tips */}
          {processableAttachments.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <AlertTitle>💡 Attachment Processing Tips</AlertTitle>
              <Typography variant="body2">
                • <strong>PDFs & Documents:</strong> Works best with structured content and clear action items<br/>
                • <strong>Spreadsheets:</strong> Extracts tasks from columns with task-related headers<br/>
                • <strong>Large files:</strong> May take longer to process - please be patient
              </Typography>
            </Alert>
          )}

          {/* No Processable Files Warning */}
          {processableAttachments.length === 0 && (
            <Alert severity="warning">
              <AlertTitle>No Processable Documents</AlertTitle>
              <Typography variant="body2">
                None of the attachments can be processed for task extraction. 
                Supported formats: PDF, Word (.doc/.docx), Excel (.xls/.xlsx), CSV, and Text files.
              </Typography>
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Task Extraction Review Modal */}
      {showTaskReview && extractionResults && (
        <Dialog 
          open={showTaskReview} 
          onClose={() => setShowTaskReview(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { minHeight: '70vh' }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ExtractIcon color="primary" />
              <Typography variant="h6">
                Tasks from Email Attachments
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Found {extractionResults.totalTasks} tasks in {extractionResults.totalDocuments} document{extractionResults.totalDocuments !== 1 ? 's' : ''}
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ p: 0 }}>
            <TaskExtractionReview
              extractedTasks={extractionResults.allTasks}
              documentId={email._id}
              onTasksCreated={handleTasksCreated}
              onClose={() => setShowTaskReview(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default EmailAttachments;
