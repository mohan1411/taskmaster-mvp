import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Collapse,
  Tooltip,
  Divider,
  FormControlLabel,
  Switch,
  Rating,
  Stack
} from '@mui/material';
import {
  AutoAwesome,
  Psychology,
  Timer,
  TrendingUp,
  CalendarToday,
  Bolt,
  Category,
  Refresh,
  Info,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Schedule,
  LocalFireDepartment
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { format, formatDistanceToNow } from 'date-fns';
import smartTaskService from '../../services/smartTaskService';

const SmartTaskSelector = ({ 
  tasks = [], 
  sessionDuration = 60, 
  sessionType = 'regular',
  energyLevel = 7,
  onTasksSelected,
  recentSessions = []
}) => {
  const theme = useTheme();
  const [recommendations, setRecommendations] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState({});
  const [autoSelectBest, setAutoSelectBest] = useState(true);
  const [sessionRecommendation, setSessionRecommendation] = useState(null);

  useEffect(() => {
    generateRecommendations();
  }, [tasks, sessionDuration, sessionType, energyLevel]);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      // Get smart recommendations
      const recommendations = smartTaskService.getSmartTaskRecommendations({
        tasks,
        sessionDuration,
        energyLevel,
        sessionType,
        recentSessions,
        preferences: {} // Could load from user settings
      });

      setRecommendations(recommendations);

      // Auto-select top recommendations if enabled
      if (autoSelectBest && recommendations.length > 0) {
        const autoSelected = recommendations
          .slice(0, Math.min(3, recommendations.length))
          .map(r => r.task._id || r.task.id);
        setSelectedTasks(autoSelected);
        onTasksSelected?.(autoSelected);
      }

      // Get session type recommendation
      const sessionRec = smartTaskService.recommendSessionType(energyLevel);
      setSessionRecommendation(sessionRec);

    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = (taskId) => {
    const newSelected = selectedTasks.includes(taskId)
      ? selectedTasks.filter(id => id !== taskId)
      : [...selectedTasks, taskId];
    
    setSelectedTasks(newSelected);
    onTasksSelected?.(newSelected);
  };

  const handleRefresh = () => {
    generateRecommendations();
  };

  const toggleDetails = (taskId) => {
    setShowDetails(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return theme.palette.success.main;
    if (score >= 0.6) return theme.palette.warning.main;
    return theme.palette.text.secondary;
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'Not set';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const totalSelectedDuration = recommendations
    .filter(r => selectedTasks.includes(r.task._id || r.task.id))
    .reduce((sum, r) => sum + (r.task.estimatedDuration || 30), 0);

  const capacityUsed = (totalSelectedDuration / sessionDuration) * 100;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6">
              Smart Task Selection
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoSelectBest}
                  onChange={(e) => setAutoSelectBest(e.target.checked)}
                  size="small"
                />
              }
              label="Auto-select"
            />
            <IconButton onClick={handleRefresh} size="small">
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {/* Session Recommendation */}
        {sessionRecommendation && (
          <Alert 
            severity="info" 
            sx={{ mb: 2 }}
            icon={<Psychology />}
          >
            <Box>
              <Typography variant="body2">
                <strong>Recommended:</strong> {sessionRecommendation.duration}-minute {sessionRecommendation.type.replace('_', ' ')} session
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {sessionRecommendation.reason}
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Energy Level Display */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Bolt fontSize="small" />
            <Typography variant="subtitle2">
              Your Energy Level
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Rating 
              value={energyLevel / 2} 
              max={5} 
              readOnly 
              icon={<Bolt fontSize="inherit" />}
              emptyIcon={<Bolt fontSize="inherit" />}
            />
            <Typography variant="body2" color="text.secondary">
              {energyLevel}/10 - {energyLevel >= 8 ? 'High' : energyLevel >= 5 ? 'Medium' : 'Low'}
            </Typography>
          </Box>
        </Box>

        {/* Task Recommendations */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : recommendations.length === 0 ? (
          <Alert severity="info">
            No tasks available for smart selection. Add some tasks to get started!
          </Alert>
        ) : (
          <>
            <List sx={{ p: 0 }}>
              {recommendations.map((rec, index) => {
                const task = rec.task;
                const taskId = task._id || task.id;
                const isSelected = selectedTasks.includes(taskId);
                const isExpanded = showDetails[taskId];

                return (
                  <React.Fragment key={taskId}>
                    <ListItem
                      sx={{
                        px: 0,
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: isSelected ? 'action.selected' : 'transparent',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={isSelected}
                          onChange={() => handleTaskToggle(taskId)}
                          color="primary"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">
                              {task.title}
                            </Typography>
                            {index === 0 && (
                              <Chip 
                                label="Best Match" 
                                size="small" 
                                color="primary"
                                icon={<AutoAwesome />}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Chip 
                                label={task.priority} 
                                size="small"
                                color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'}
                              />
                              <Chip 
                                label={formatDuration(task.estimatedDuration)} 
                                size="small"
                                icon={<Timer />}
                              />
                              {task.dueDate && (
                                <Chip 
                                  label={formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                                  size="small"
                                  icon={<CalendarToday />}
                                  color={new Date(task.dueDate) < new Date(Date.now() + 24*60*60*1000) ? 'error' : 'default'}
                                />
                              )}
                              <Chip
                                label={`Score: ${Math.round(rec.totalScore * 100)}%`}
                                size="small"
                                sx={{ color: getScoreColor(rec.totalScore) }}
                              />
                            </Box>
                            
                            {/* Reasoning */}
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {rec.reasoning}
                            </Typography>
                          </Box>
                        }
                      />
                      <IconButton size="small" onClick={() => toggleDetails(taskId)}>
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </ListItem>

                    {/* Expanded Details */}
                    <Collapse in={isExpanded}>
                      <Box sx={{ pl: 7, pr: 2, pb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Scoring Breakdown
                        </Typography>
                        <Stack spacing={1}>
                          {Object.entries(rec.scores).map(([criterion, score]) => (
                            <Box key={criterion} sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ width: 100, textTransform: 'capitalize' }}>
                                {criterion}:
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={score * 100}
                                sx={{ 
                                  flexGrow: 1, 
                                  mr: 1,
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: 'action.hover',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: getScoreColor(score)
                                  }
                                }}
                              />
                              <Typography variant="caption" sx={{ minWidth: 35 }}>
                                {Math.round(score * 100)}%
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                        
                        {task.description && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              {task.description}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Collapse>

                    {index < recommendations.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>

            {/* Session Capacity */}
            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2">
                  Session Capacity
                </Typography>
                <Typography variant="body2">
                  {formatDuration(totalSelectedDuration)} / {formatDuration(sessionDuration)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, capacityUsed)}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: capacityUsed > 100 ? 'error.main' : capacityUsed > 80 ? 'warning.main' : 'success.main'
                  }
                }}
              />
              {capacityUsed > 100 && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Selected tasks exceed session duration. Consider removing some tasks.
                </Alert>
              )}
            </Box>
          </>
        )}

        {/* Tips */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Info fontSize="small" />
            Smart Selection Tips
          </Typography>
          <Typography variant="caption" color="text.secondary">
            • Tasks are ranked by priority, deadline urgency, and energy match<br />
            • Similar tasks are grouped to minimize context switching<br />
            • Adjust your energy level for better recommendations
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SmartTaskSelector;