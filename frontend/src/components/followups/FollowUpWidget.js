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
  Badge
} from '@mui/material';
import {
  NotificationsActive as FollowUpIcon,
  Schedule as ScheduleIcon,
  Warning as UrgentIcon,
  CheckCircle as DoneIcon,
  Flag as FlagIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow, isPast, addDays } from 'date-fns';
import followupService from '../../services/followupService';

const FollowUpWidget = ({ compact = false }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followups, setFollowups] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchFollowUps();
    fetchAnalytics();
  }, []);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      // Fetch only pending and in-progress follow-ups
      const response = await followupService.getFollowUps({
        status: 'pending,in-progress',
        limit: compact ? 5 : 10,
        sortBy: 'dueDate'
      });
      setFollowups(response.followups || []);
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
      setError('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await followupService.getFollowUpAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getDueDateText = (date) => {
    const dueDate = new Date(date);
    
    if (isPast(dueDate) && !isToday(dueDate)) {
      return { text: 'Overdue', color: 'error' };
    }
    if (isToday(dueDate)) {
      return { text: 'Due today', color: 'warning' };
    }
    if (isTomorrow(dueDate)) {
      return { text: 'Due tomorrow', color: 'info' };
    }
    
    const daysUntil = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 7) {
      return { text: `Due in ${daysUntil} days`, color: 'default' };
    }
    
    return { text: format(dueDate, 'MMM d'), color: 'default' };
  };

  const handleFollowUpClick = (followup) => {
    navigate(`/followups?id=${followup._id}`);
  };

  const renderAnalyticsSummary = () => {
    if (!analytics) return null;

    return (
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-around' }}>
        <Tooltip title="Pending follow-ups">
          <Chip
            icon={<FollowUpIcon />}
            label={analytics.statusCounts?.pending || 0}
            color="primary"
            size="small"
          />
        </Tooltip>
        <Tooltip title="Due this week">
          <Chip
            icon={<ScheduleIcon />}
            label={analytics.dueThisWeek || 0}
            color="info"
            size="small"
          />
        </Tooltip>
        <Tooltip title="Overdue">
          <Chip
            icon={<UrgentIcon />}
            label={analytics.overdueCount || 0}
            color="error"
            size="small"
          />
        </Tooltip>
        <Tooltip title="Completion rate">
          <Chip
            icon={<DoneIcon />}
            label={`${Math.round(analytics.completionRate || 0)}%`}
            color="success"
            size="small"
          />
        </Tooltip>
      </Box>
    );
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
          <Tooltip title={`Priority: ${followup.priority}`}>
            <Badge
              badgeContent={followup.priority === 'urgent' ? '!' : null}
              color="error"
            >
              <FlagIcon color={getPriorityColor(followup.priority)} />
            </Badge>
          </Tooltip>
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography
              variant="body2"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
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
              {followup.contactName && (
                <Typography variant="caption" color="text.secondary">
                  {followup.contactName}
                </Typography>
              )}
            </Box>
          }
        />
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
    <Card>
      <CardHeader
        avatar={<FollowUpIcon />}
        title="Follow-ups"
        action={
          <Button
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/followups')}
          >
            View All
          </Button>
        }
      />
      <CardContent>
        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            {!compact && renderAnalyticsSummary()}
            
            {followups.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <FollowUpIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No pending follow-ups
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {followups.map(renderFollowUpItem)}
              </List>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FollowUpWidget;
