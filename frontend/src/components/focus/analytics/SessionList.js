import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Collapse,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Divider,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Timer,
  Task,
  Psychology,
  Block,
  ExpandMore,
  ExpandLess,
  Search,
  FilterList,
  Download,
  TrendingUp,
  CheckCircle
} from '@mui/icons-material';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

const SessionList = ({ sessions }) => {
  const [expandedSession, setExpandedSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Filter and sort sessions
  const filteredSessions = sessions
    .filter(session => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const hasMatchingTask = session.tasks?.some(t => 
          t.task?.title?.toLowerCase().includes(searchLower)
        );
        const hasMatchingNotes = session.notes?.toLowerCase().includes(searchLower);
        if (!hasMatchingTask && !hasMatchingNotes) return false;
      }

      // Type filter
      if (filterType !== 'all') {
        if (filterType === 'flow' && (!session.flowMetrics?.totalFlowTime || session.flowMetrics.totalFlowTime === 0)) {
          return false;
        }
        if (filterType === 'completed' && session.status !== 'completed') {
          return false;
        }
        if (filterType === 'high-score' && (session.focusScore || 0) < 80) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.startTime) - new Date(a.startTime);
        case 'duration':
          return (b.actualDuration || 0) - (a.actualDuration || 0);
        case 'score':
          return (b.focusScore || 0) - (a.focusScore || 0);
        default:
          return 0;
      }
    });

  const handleToggleExpand = (sessionId) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  const getSessionTypeColor = (session) => {
    if (session.flowMetrics?.totalFlowTime > 30) return 'secondary';
    if (session.focusScore >= 80) return 'success';
    if (session.status === 'abandoned') return 'error';
    return 'primary';
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const exportSessions = () => {
    const data = filteredSessions.map(session => ({
      date: format(new Date(session.startTime), 'yyyy-MM-dd'),
      time: format(new Date(session.startTime), 'HH:mm'),
      duration: session.actualDuration || session.plannedDuration,
      tasks: session.tasks?.length || 0,
      completed: session.completedTasks?.length || 0,
      score: session.focusScore || 0,
      flow: session.flowMetrics?.totalFlowTime || 0,
      distractions: session.distractions?.blocked || 0,
      notes: session.notes || ''
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focus-sessions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Session History
          </Typography>
          <Button
            startIcon={<Download />}
            size="small"
            onClick={exportSessions}
          >
            Export
          </Button>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            size="small"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
            sx={{ flexGrow: 1 }}
          />
          <TextField
            select
            size="small"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">All Sessions</MenuItem>
            <MenuItem value="flow">Flow State</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="high-score">High Score</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            sx={{ minWidth: 100 }}
          >
            <MenuItem value="date">Date</MenuItem>
            <MenuItem value="duration">Duration</MenuItem>
            <MenuItem value="score">Score</MenuItem>
          </TextField>
        </Box>

        {/* Session List */}
        <List sx={{ p: 0 }}>
          {filteredSessions.map((session, index) => {
            const isExpanded = expandedSession === session._id;
            const completionRate = session.tasks?.length > 0
              ? (session.completedTasks?.length || 0) / session.tasks.length
              : 0;

            return (
              <React.Fragment key={session._id}>
                <ListItem
                  sx={{
                    px: 0,
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    borderRadius: 1
                  }}
                  onClick={() => handleToggleExpand(session._id)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: `${getSessionTypeColor(session)}.main` }}>
                      <Timer />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          {formatDuration(session.actualDuration || session.plannedDuration)}
                        </Typography>
                        {session.flowMetrics?.totalFlowTime > 0 && (
                          <Chip
                            icon={<Psychology />}
                            label="Flow"
                            size="small"
                            color="secondary"
                          />
                        )}
                        {session.focusScore >= 80 && (
                          <Chip
                            icon={<TrendingUp />}
                            label={session.focusScore}
                            size="small"
                            color="success"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(session.startTime), 'MMM d, yyyy')} at {format(new Date(session.startTime), 'h:mm a')}
                          {' • '}
                          {session.tasks?.length || 0} tasks
                          {session.distractions?.blocked > 0 && ` • ${session.distractions.blocked} blocked`}
                        </Typography>
                        
                        {/* Task preview */}
                        {session.tasks && session.tasks.length > 0 && !isExpanded && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            {session.tasks.slice(0, 2).map(t => t.task?.title).join(', ')}
                            {session.tasks.length > 2 && ` +${session.tasks.length - 2} more`}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <IconButton size="small" onClick={(e) => {
                    e.stopPropagation();
                    handleToggleExpand(session._id);
                  }}>
                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </ListItem>

                {/* Expanded Details */}
                <Collapse in={isExpanded}>
                  <Box sx={{ pl: 7, pr: 1, pb: 2 }}>
                    {/* Metrics */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Actual Duration
                        </Typography>
                        <Typography variant="body2">
                          {formatDuration(session.actualDuration || session.plannedDuration)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Focus Score
                        </Typography>
                        <Typography variant="body2">
                          {session.focusScore || 0}/100
                        </Typography>
                      </Box>
                      {session.flowMetrics?.totalFlowTime > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Flow Time
                          </Typography>
                          <Typography variant="body2">
                            {formatDuration(session.flowMetrics.totalFlowTime)}
                          </Typography>
                        </Box>
                      )}
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Energy Level
                        </Typography>
                        <Typography variant="body2">
                          {session.energyLevel?.start || 0} → {session.energyLevel?.end || 0}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Tasks */}
                    {session.tasks && session.tasks.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Tasks ({session.completedTasks?.length || 0}/{session.tasks.length})
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={completionRate * 100}
                          sx={{ mb: 1, height: 6, borderRadius: 3 }}
                        />
                        <List dense sx={{ p: 0 }}>
                          {session.tasks.map((taskItem, i) => {
                            const isCompleted = session.completedTasks?.includes(taskItem.task._id);
                            return (
                              <ListItem key={i} sx={{ px: 0 }}>
                                <ListItemAvatar sx={{ minWidth: 32 }}>
                                  <CheckCircle
                                    fontSize="small"
                                    color={isCompleted ? 'success' : 'disabled'}
                                  />
                                </ListItemAvatar>
                                <ListItemText
                                  primary={taskItem.task.title}
                                  secondary={`Planned: ${taskItem.plannedDuration}min`}
                                  primaryTypographyProps={{
                                    variant: 'body2',
                                    sx: {
                                      textDecoration: isCompleted ? 'line-through' : 'none',
                                      color: isCompleted ? 'text.secondary' : 'text.primary'
                                    }
                                  }}
                                />
                              </ListItem>
                            );
                          })}
                        </List>
                      </Box>
                    )}

                    {/* Notes */}
                    {session.notes && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Notes
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {session.notes}
                        </Typography>
                      </Box>
                    )}

                    {/* Distractions */}
                    {session.distractions && session.distractions.blocked > 0 && (
                      <Box>
                        <Chip
                          icon={<Block />}
                          label={`${session.distractions.blocked} distractions blocked`}
                          size="small"
                          color="warning"
                        />
                      </Box>
                    )}
                  </Box>
                </Collapse>

                {index < filteredSessions.length - 1 && <Divider sx={{ my: 1 }} />}
              </React.Fragment>
            );
          })}
        </List>

        {filteredSessions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              {searchTerm || filterType !== 'all' 
                ? 'No sessions match your criteria'
                : 'No focus sessions yet'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionList;