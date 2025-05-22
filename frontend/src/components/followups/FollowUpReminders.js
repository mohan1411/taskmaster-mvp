import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  NotificationsActive as FollowUpIcon,
  Warning as UrgentIcon,
  CheckCircle as DoneIcon,
  AccessTime as OverdueIcon,
  Today as TodayIcon,
  Delete as DeleteIcon,
  Snooze as SnoozeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isPast, addDays } from 'date-fns';
import followupService from '../../services/followupService';

const FollowUpReminders = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dueFollowups, setDueFollowups] = useState([]);
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [snoozeDialogOpen, setSnoozeDialogOpen] = useState(false);
  const [snoozeDays, setSnoozeDays] = useState(1);

  useEffect(() => {
    checkDueFollowUps();
  }, []);

  const checkDueFollowUps = async () => {
    try {
      setLoading(true);
      const response = await followupService.checkDueFollowUps();
      setDueFollowups(response.followups || []);
    } catch (err) {
      console.error('Error checking due follow-ups:', err);
      setError('Failed to load follow-up reminders');
    } finally {
      setLoading(false);
    }
  };

  const getDueDateText = (date) => {
    const dueDate = new Date(date);
    
    if (isPast(dueDate) && !isToday(dueDate)) {
      return { text: 'Overdue', color: 'error', icon: <OverdueIcon /> };
    }
    if (isToday(dueDate)) {
      return { text: 'Due today', color: 'warning', icon: <TodayIcon /> };
    }
    return { text: format(dueDate, 'MMM d'), color: 'default', icon: null };
  };

  const handleMarkComplete = async (followupId, e) => {
    e.stopPropagation();
    try {
      await followupService.updateFollowUp(followupId, { status: 'completed' });
      checkDueFollowUps();
    } catch (err) {
      console.error('Error marking follow-up complete:', err);
    }
  };

  const handleSnooze = async () => {
    if (!selectedFollowup) return;
    
    try {
      await followupService.snoozeFollowUp(selectedFollowup._id, snoozeDays);
      setSnoozeDialogOpen(false);
      setSelectedFollowup(null);
      setSnoozeDays(1);
      checkDueFollowUps();
    } catch (err) {
      console.error('Error snoozing follow-up:', err);
    }
  };

  const handleFollowUpClick = (followup) => {
    navigate(`/followups?id=${followup._id}`);
  };

  const renderFollowUpItem = (followup) => {
    const dueDateInfo = getDueDateText(followup.dueDate);
    
    return (
      <ListItem
        key={followup._id}
        button
        onClick={() => handleFollowUpClick(followup)}
        sx={{ px: 1 }}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>
          {dueDateInfo.icon || (
            <Badge badgeContent={followup.priority === 'urgent' ? '!' : null} color="error">
              <FollowUpIcon color={dueDateInfo.color} />
            </Badge>
          )}
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography variant="body2" noWrap>
              {followup.subject}
            </Typography>
          }
          secondary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                label={dueDateInfo.text}
                size="small"
                color={dueDateInfo.color}
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary" noWrap>
                {followup.contactName}
              </Typography>
            </Box>
          }
        />
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Mark as complete">
            <Button
              size="small"
              color="success"
              onClick={(e) => handleMarkComplete(followup._id, e)}
              sx={{ minWidth: 'auto', p: 0.5 }}
            >
              <DoneIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Snooze reminder">
            <Button
              size="small"
              color="info"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFollowup(followup);
                setSnoozeDialogOpen(true);
              }}
              sx={{ minWidth: 'auto', p: 0.5 }}
            >
              <SnoozeIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      </ListItem>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader
          avatar={<FollowUpIcon />}
          title="Follow-up Reminders"
          subheader={`${dueFollowups.length} items due`}
          action={
            <Button
              size="small"
              onClick={() => navigate('/followups')}
            >
              View All
            </Button>
          }
        />
        <CardContent>
          {error ? (
            <Alert severity="error">{error}</Alert>
          ) : dueFollowups.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <DoneIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No follow-ups due today
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {dueFollowups.slice(0, 5).map(renderFollowUpItem)}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Snooze Dialog */}
      <Dialog open={snoozeDialogOpen} onClose={() => setSnoozeDialogOpen(false)}>
        <DialogTitle>Snooze Follow-up</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Snooze for (days)"
            type="number"
            fullWidth
            value={snoozeDays}
            onChange={(e) => setSnoozeDays(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1, max: 30 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSnoozeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSnooze} variant="contained" color="primary">
            Snooze
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FollowUpReminders;
