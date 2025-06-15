import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Upload as UploadIcon,
  Description as DocumentIcon,
  Analytics as AnalyticsIcon,
  Assignment as TaskIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import DocumentUpload from '../components/documents/DocumentUpload';
import TaskExtractionReview from '../components/documents/TaskExtractionReview';
import DocumentHistory from '../components/documents/DocumentHistory';
import documentService from '../services/documentService';
import '../styles/GlobalPages.css';

const DocumentsPage = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [showExtractionReview, setShowExtractionReview] = useState(false);
  const [extractionData, setExtractionData] = useState(null);
  const [stats, setStats] = useState(null);
  const [notification, setNotification] = useState(null);

  // Load stats on component mount
  useEffect(() => {
    loadStats();
  }, []);

  // Load processing statistics
  const loadStats = async () => {
    try {
      const response = await documentService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Handle successful upload
  const handleUploadSuccess = (result) => {
    console.log('Upload successful:', result);
    
    if (result.documents) {
      // Multiple documents uploaded
      const totalTasks = result.documents.reduce((acc, doc) => acc + (doc.tasksExtracted || 0), 0);
      
      showNotification(
        `Successfully processed ${result.documents.length} documents and extracted ${totalTasks} tasks!`,
        'success'
      );
      
      // If any document has tasks, show the first one for review
      const docWithTasks = result.documents.find(doc => doc.tasksExtracted > 0);
      if (docWithTasks && docWithTasks.extractedTasks) {
        setExtractionData({
          documentId: docWithTasks.document?.id || docWithTasks.documentId,
          tasks: docWithTasks.extractedTasks
        });
        setShowExtractionReview(true);
      }
    } else {
      // Single document uploaded
      showNotification(
        `Successfully processed document and extracted ${result.tasksExtracted || 0} tasks!`,
        'success'
      );
      
      if (result.extractedTasks && result.extractedTasks.length > 0) {
        setExtractionData({
          documentId: result.document?.id || result.documentId,
          tasks: result.extractedTasks
        });
        setShowExtractionReview(true);
      }
    }
    
    // Refresh stats
    loadStats();
  };

  // Handle upload error
  const handleUploadError = (error) => {
    console.error('Upload error:', error);
    showNotification(error, 'error');
  };

  // Handle tasks created from extraction
  const handleTasksCreated = (result) => {
    console.log('Tasks created:', result);
    showNotification(
      `Successfully created ${result.created} task${result.created !== 1 ? 's' : ''}!`,
      'success'
    );
    setShowExtractionReview(false);
    setExtractionData(null);
    
    // Optionally switch to tasks page
    // You could add navigation here if needed
  };

  // Handle document reprocessing
  const handleDocumentReprocess = (documentId) => {
    showNotification('Document reprocessing started...', 'info');
    loadStats();
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Format number with commas
  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  return (
    <div className="page-container">
      <div className="page-content">
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Document Hub
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Extract tasks automatically from your documents using AI
          </Typography>
        
          {/* Quick Stats */}
          {stats && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText'
                    }}>
                      <DocumentIcon />
                    </Box>
                    <Box>
                      <Typography variant="h5" component="div">
                        {formatNumber(stats.totalDocuments)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Documents
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      backgroundColor: 'success.light',
                      color: 'success.contrastText'
                    }}>
                      <TaskIcon />
                    </Box>
                    <Box>
                      <Typography variant="h5" component="div">
                        {formatNumber(stats.totalTasks)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tasks Extracted
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      backgroundColor: 'warning.light',
                      color: 'warning.contrastText'
                    }}>
                      <SpeedIcon />
                    </Box>
                    <Box>
                      <Typography variant="h5" component="div">
                        {Math.round(stats.avgConfidence || 0)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Confidence
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>

        {/* Navigation Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(event, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
          >
            <Tab 
              value="upload" 
              label="Upload Documents" 
              icon={<UploadIcon />} 
              iconPosition="start"
            />
            <Tab 
              value="history" 
              label="Document History" 
              icon={<DocumentIcon />} 
              iconPosition="start"
            />
            <Tab 
              value="analytics" 
              label="Analytics" 
              icon={<AnalyticsIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Main Content */}
        <Box>
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <Box>
              <Typography variant="h5" component="h2" gutterBottom>
                Upload & Process Documents
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                Supported formats: PDF, Word, Excel, CSV, Text files
              </Typography>
            
            <DocumentUpload
              multiple={true}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
            
              {/* Processing Tips */}
              <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  💡 Tips for Better Extraction
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Clear formatting:</strong> Well-structured documents with headings and bullet points work best
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Action words:</strong> Use verbs like "complete," "review," "submit," "schedule"
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Date formats:</strong> Include specific dates like "by Friday" or "due March 15th"
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Assignees:</strong> Mention names or email addresses for task assignment
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <Box>
              <DocumentHistory
                onViewDocument={(doc) => {
                  // Handle viewing document details
                  console.log('View document:', doc);
                  // Could open a modal or navigate to detail page
                }}
                onReprocessDocument={handleDocumentReprocess}
              />
            </Box>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <Box>
              <Typography variant="h5" component="h2" gutterBottom>
                Processing Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                Insights into your document processing activity
              </Typography>
              
              {stats ? (
                <Grid container spacing={3}>
                  {/* Overview Cards */}
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6">Document Processing</Typography>
                          <DocumentIcon color="primary" />
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Total Processed:</Typography>
                            <Typography variant="body2" fontWeight="bold">{formatNumber(stats.totalDocuments)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Successfully Completed:</Typography>
                            <Typography variant="body2" fontWeight="bold">{formatNumber(stats.successfulDocuments)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Success Rate:</Typography>
                            <Typography variant="body2" fontWeight="bold">{Math.round((stats.successfulDocuments / stats.totalDocuments) * 100) || 0}%</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6">Task Extraction</Typography>
                          <TaskIcon color="success" />
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Total Tasks:</Typography>
                            <Typography variant="body2" fontWeight="bold">{formatNumber(stats.totalTasks)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">High Confidence:</Typography>
                            <Typography variant="body2" fontWeight="bold">{formatNumber(stats.highConfidenceTasks)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Avg per Document:</Typography>
                            <Typography variant="body2" fontWeight="bold">{Math.round(stats.avgTasksPerDocument || 0)}</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6">Quality Metrics</Typography>
                          <AnalyticsIcon color="warning" />
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Avg Confidence:</Typography>
                            <Typography variant="body2" fontWeight="bold">{Math.round(stats.avgConfidence || 0)}%</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Processing Time:</Typography>
                            <Typography variant="body2" fontWeight="bold">{Math.round(stats.avgProcessingTime / 1000 || 0)}s</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">User Rating:</Typography>
                            <Typography variant="body2" fontWeight="bold">{stats.avgUserRating ? `${stats.avgUserRating}/5` : 'N/A'}</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

              ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    No analytics data available yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Process some documents to see insights!
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </Box>

        {/* Task Extraction Review Modal */}
        {showExtractionReview && extractionData && (
          <TaskExtractionReview
            extractedTasks={extractionData.tasks}
            documentId={extractionData.documentId}
            onTasksCreated={handleTasksCreated}
            onClose={() => {
              setShowExtractionReview(false);
              setExtractionData(null);
            }}
          />
        )}

        {/* Notification */}
        <Snackbar 
          open={!!notification} 
          autoHideDuration={5000} 
          onClose={() => setNotification(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setNotification(null)} 
            severity={notification?.type || 'info'}
            sx={{ width: '100%' }}
          >
            {notification?.message}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default DocumentsPage;
