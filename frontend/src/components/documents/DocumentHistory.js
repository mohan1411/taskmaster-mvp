import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Description as FileIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import documentService from '../../services/documentService';

const DocumentHistory = ({ onViewDocument, onReprocessDocument }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Load documents
  const loadDocuments = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        sort: `${sortBy}:${sortOrder}`,
        ...(filter !== 'all' && { status: filter }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await documentService.getUserDocuments(params);
      const { documents: docs, pagination: paginationData } = response.data;

      setDocuments(docs);
      setPagination(paginationData);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [filter, sortBy, sortOrder]);

  // Handle search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== '') {
        loadDocuments(1);
      } else if (searchTerm === '') {
        loadDocuments(1);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Delete document
  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document and all its extracted tasks?')) {
      return;
    }

    try {
      await documentService.deleteDocument(documentId);
      loadDocuments(pagination.page);
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  // Reprocess document
  const handleReprocess = async (documentId) => {
    try {
      await documentService.reprocessDocument(documentId);
      loadDocuments(pagination.page);
      onReprocessDocument?.(documentId);
    } catch (error) {
      console.error('Error reprocessing document:', error);
      // Check if it's a file not found error
      if (error.response?.data?.error?.includes('file no longer exists')) {
        alert('Cannot reprocess this document because the original file no longer exists. Only newly uploaded documents can be reprocessed.');
      } else {
        alert('Failed to reprocess document. Please try again.');
      }
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

  // Format date
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Get status badge
  const getStatusBadge = (status, tasksExtracted = 0) => {
    switch (status) {
      case 'processing':
        return <Chip label="Processing" color="warning" size="small" />;
      case 'completed':
        return <Chip label={`${tasksExtracted} tasks extracted`} color="success" size="small" />;
      case 'failed':
        return <Chip label="Failed" color="error" size="small" />;
      default:
        return <Chip label="Pending" color="default" size="small" />;
    }
  };

  // Get file type icon
  const getFileIcon = (fileName) => {
    if (!fileName) return '📄';
    const extension = fileName.split('.').pop()?.toLowerCase() || 'txt';
    const icons = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      csv: '📋',
      txt: '📄'
    };
    return icons[extension] || '📄';
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    loadDocuments(newPage);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Document Processing History
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        View and manage your uploaded documents and extracted tasks
      </Typography>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            }}
            size="small"
          />

          <FormControl size="small">
            <InputLabel>Filter</InputLabel>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              label="Filter"
            >
              <MenuItem value="all">All Documents</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Sort</InputLabel>
            <Select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split(':');
                setSortBy(field);
                setSortOrder(order);
              }}
              label="Sort"
            >
              <MenuItem value="createdAt:desc">Newest First</MenuItem>
              <MenuItem value="createdAt:asc">Oldest First</MenuItem>
              <MenuItem value="fileName:asc">Name A-Z</MenuItem>
              <MenuItem value="fileName:desc">Name Z-A</MenuItem>
              <MenuItem value="fileSize:desc">Largest First</MenuItem>
              <MenuItem value="tasksExtracted:desc">Most Tasks</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Document List */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>Loading documents...</Typography>
        </Box>
      ) : documents.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <FileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>No documents found</Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || filter !== 'all' 
              ? 'No documents match your current filters'
              : 'Upload your first document to get started'
            }
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Document</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FileIcon />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {doc.fileName || doc.originalName || doc.filename || "Unnamed Document"}
                        </Typography>
                        {doc.extractionSummary && (
                          <Typography variant="caption" color="text.secondary">
                            Confidence: {Math.round(doc.extractionSummary.avgConfidence)}%
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(doc.status || doc.processingStatus, doc.taskCount || 0)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatFileSize(doc.fileSize || doc.size || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(doc.createdAt)}
                    </Typography>
                    {doc.processingTime && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {Math.round(doc.processingTime / 1000)}s processing
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => onViewDocument?.(doc)} size="small">
                      <ViewIcon sx={{ color: theme => theme.palette.text.primary }} />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(doc.id)} size="small">
                      <DeleteIcon sx={{ color: theme => theme.palette.text.primary }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {!loading && documents.length > 0 && (
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          onPageChange={(event, newPage) => handlePageChange(newPage + 1)}
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={() => {}}
          rowsPerPageOptions={[]}
        />
      )}
    </Box>
  );
};

export default DocumentHistory;
