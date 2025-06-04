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
  Task as TaskIcon,
  NotificationsActive as FollowUpIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Schedule as ScheduleIcon,
  AttachFile as AttachmentIcon
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
                    backgroundColor: !email.isRead ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                    transition: 'all 0.2s',
                    py: 1.5,
                    px: 2,
                    '&:hover': {
                      backgroundColor: !email.isRead ? 'rgba(25, 118, 210, 0.08)' : 'rgba(0, 0, 0, 0.02)',
                    },
                    position: 'relative'
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
                        
                        {/* Email indicators - Compact badges */}
                        <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                          {email.taskExtracted && (
                            <Chip 
                              icon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
                              label="Tasks" 
                              size="small" 
                              sx={{
                                height: 20,
                                fontSize: '0.75rem',
                                bgcolor: 'success.50',
                                color: 'success.700',
                                border: 'none',
                                '& .MuiChip-icon': {
                                  color: 'success.600',
                                  marginLeft: '4px',
                                  marginRight: '-2px'
                                }
                              }}
                            />
                          )}
                          {email.needsFollowUp === true && (
                            <Chip 
                              icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                              label="Follow-up" 
                              size="small" 
                              sx={{
                                height: 20,
                                fontSize: '0.75rem',
                                bgcolor: 'warning.50',
                                color: 'warning.700',
                                border: 'none',
                                '& .MuiChip-icon': {
                                  color: 'warning.600',
                                  marginLeft: '4px',
                                  marginRight: '-2px'
                                }
                              }}
                            />
                          )}
                          {email.hasAttachments && (
                            <Chip 
                              icon={<AttachmentIcon sx={{ fontSize: 14 }} />}
                              label="Files" 
                              size="small" 
                              sx={{
                                height: 20,
                                fontSize: '0.75rem',
                                bgcolor: 'grey.100',
                                color: 'grey.700',
                                border: 'none',
                                '& .MuiChip-icon': {
                                  marginLeft: '4px',
                                  marginRight: '-2px'
                                }
                              }}
                            />
                          )}
                          {!email.isRead && (
                            <Box 
                              sx={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: '50%', 
                                bgcolor: 'primary.main',
                                flexShrink: 0
                              }} 
                              title="Unread"
                            />
                          )}
                        </Box>
                        
                        {/* Quick actions - only show on hover */}
                        <Box 
                          className="email-actions"
                          sx={{ 
                            mt: 1, 
                            display: 'flex', 
                            gap: 0.5,
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            '.MuiListItem-root:hover &': {
                              opacity: 1
                            }
                          }}
                        >
                          {!email.taskExtracted && (
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<TaskIcon sx={{ fontSize: 16 }} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                onExtractTasks(email);
                              }}
                              sx={{
                                fontSize: '0.75rem',
                                textTransform: 'none',
                                px: 1.5,
                                py: 0.25,
                                minWidth: 'auto',
                                color: 'primary.main',
                                '&:hover': {
                                  bgcolor: 'primary.50'
                                }
                              }}
                            >
                              Extract Tasks
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<FollowUpIcon sx={{ fontSize: 16 }} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDetectFollowUp(email);
                            }}
                            sx={{
                              fontSize: '0.75rem',
                              textTransform: 'none',
                              px: 1.5,
                              py: 0.25,
                              minWidth: 'auto',
                              color: 'warning.main',
                              '&:hover': {
                                bgcolor: 'warning.50'
                              }
                            }}
                          >
                            Follow-up
                          </Button>
                        </Box>
                      </>
                    }
                  />
                  
                  <IconButton
                    edge="end"
                    aria-label="email actions"
                    onClick={(e) => handleOpenMenu(e, email)}
                    sx={{ mt: 1, ml: 'auto', flexShrink: 0 }}
                    size="small"
                  >
                    <MoreVertIcon fontSize="small" />
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
          <TaskIcon fontSize="small" sx={{ mr: 1 }} />
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
