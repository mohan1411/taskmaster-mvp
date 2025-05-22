import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Divider,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Stack,
  LinearProgress,
  Alert,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Email as EmailIcon,
  EmailOutlined as UnreadIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  ExtractOutlined as ExtractIcon,
  NotificationsOutlined as FollowUpIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const EmailList = ({ 
  emails = [], 
  loading = false, 
  error = null,
  onRefresh,
  onSelectEmail,
  onExtractTasks,
  onDetectFollowUp
}) => {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Email action menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  
  // Handle opening email menu
  const handleOpenMenu = (event, email) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedEmail(email);
  };

  // Handle closing email menu
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setSelectedEmail(null);
  };

  // Handle extract tasks action
  const handleExtractTasks = () => {
    if (selectedEmail && onExtractTasks) {
      onExtractTasks(selectedEmail);
    }
    handleCloseMenu();
  };

  // Handle detect follow-up action
  const handleDetectFollowUp = () => {
    if (selectedEmail && onDetectFollowUp) {
      onDetectFollowUp(selectedEmail);
    }
    handleCloseMenu();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if date is today
    if (date.toDateString() === today.toDateString()) {
      return format(date, 'h:mm a'); // e.g. "3:45 PM"
    }
    
    // Check if date is yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // For older dates
    return format(date, 'MMM d'); // e.g. "Nov 14"
  };

  // Get avatar letter from email sender
  const getAvatarLetter = (sender) => {
    if (!sender) return '?';
    if (sender.name && sender.name.trim() !== '') {
      return sender.name.charAt(0).toUpperCase();
    }
    if (sender.email) {
      return sender.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  // Filter emails by search term
  const filteredEmails = emails.filter(email => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    return (
      (email.subject && email.subject.toLowerCase().includes(searchLower)) ||
      (email.sender && email.sender.name && email.sender.name.toLowerCase().includes(searchLower)) ||
      (email.sender && email.sender.email && email.sender.email.toLowerCase().includes(searchLower)) ||
      (email.snippet && email.snippet.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Box>
      {/* Search and refresh section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search emails..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button 
            variant="contained" 
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>
      </Paper>

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Empty state */}
      {!loading && filteredEmails.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <EmailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No emails found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search' : 'Sync your Gmail account to see emails here'}
          </Typography>
        </Paper>
      )}

      {/* Email list */}
      {filteredEmails.length > 0 && (
        <Paper>
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {filteredEmails.map((email, index) => (
              <React.Fragment key={email._id || email.messageId}>
                <ListItem 
                  alignItems="flex-start"
                  button
                  onClick={() => onSelectEmail && onSelectEmail(email)}
                  sx={{ 
                    backgroundColor: !email.isRead ? 'rgba(25, 118, 210, 0.05)' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar alt={email.sender?.name || 'Sender'}>
                      {getAvatarLetter(email.sender)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          variant="subtitle1"
                          component="span"
                          sx={{ 
                            fontWeight: !email.isRead ? 700 : 400,
                            display: 'inline-block',
                            maxWidth: { xs: '180px', sm: '250px', md: '400px' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {email.sender?.name || email.sender?.email || 'Unknown Sender'}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          component="span"
                        >
                          {formatDate(email.receivedAt)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Box sx={{ mb: 1 }}>
                          <Typography
                            variant="body2"
                            component="span"
                            sx={{ 
                              display: 'inline',
                              fontWeight: !email.isRead ? 600 : 400
                            }}
                          >
                            {email.subject || '(No Subject)'}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          component="span"
                          sx={{ 
                            display: 'inline-block',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {email.snippet || 'No preview available'}
                        </Typography>
                        
                        {/* Email indicators */}
                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                          {email.taskExtracted && (
                            <Chip 
                              label="Tasks Extracted" 
                              size="small" 
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          {email.needsFollowUp === true && (
                            <Chip 
                              icon={<FollowUpIcon />}
                              label="Needs Follow-up" 
                              size="small" 
                              color="warning"
                              variant="outlined"
                            />
                          )}
                          {email.hasAttachments && (
                            <Chip 
                              label="Attachment" 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                          {!email.isRead && (
                            <Chip 
                              icon={<UnreadIcon />}
                              label="Unread" 
                              size="small" 
                              color="info"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </>
                    }
                  />
                  
                  <IconButton
                    edge="end"
                    aria-label="email actions"
                    onClick={(e) => handleOpenMenu(e, email)}
                    sx={{ mt: 1 }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </ListItem>
                {index < filteredEmails.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Email action menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleExtractTasks}>
          <ExtractIcon fontSize="small" sx={{ mr: 1 }} />
          Extract Tasks
        </MenuItem>
        <MenuItem onClick={handleDetectFollowUp}>
          <FollowUpIcon fontSize="small" sx={{ mr: 1 }} />
          Detect Follow-up
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default EmailList;
