import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Alert,
  Divider,
  Button,
  Collapse
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Schedule,
  Psychology,
  Coffee,
  Task,
  Block,
  EmojiEvents,
  Lightbulb,
  Warning,
  Info,
  CheckCircle
} from '@mui/icons-material';
import { format, startOfWeek, differenceInMinutes } from 'date-fns';

const FocusInsights = ({ sessions, tasks }) => {
  const [insights, setInsights] = useState([]);
  const [expandedInsight, setExpandedInsight] = useState(null);

  useEffect(() => {
    generateInsights();
  }, [sessions, tasks]);

  const generateInsights = () => {
    const insights = [];

    // Analyze peak performance times
    const peakTimeInsight = analyzePeakTimes();
    if (peakTimeInsight) insights.push(peakTimeInsight);

    // Analyze flow state patterns
    const flowInsight = analyzeFlowPatterns();
    if (flowInsight) insights.push(flowInsight);

    // Analyze task completion patterns
    const taskInsight = analyzeTaskPatterns();
    if (taskInsight) insights.push(taskInsight);

    // Analyze distraction patterns
    const distractionInsight = analyzeDistractionPatterns();
    if (distractionInsight) insights.push(distractionInsight);

    // Analyze break patterns
    const breakInsight = analyzeBreakPatterns();
    if (breakInsight) insights.push(breakInsight);

    // Analyze session duration effectiveness
    const durationInsight = analyzeSessionDurations();
    if (durationInsight) insights.push(durationInsight);

    // Analyze weekly patterns
    const weeklyInsight = analyzeWeeklyPatterns();
    if (weeklyInsight) insights.push(weeklyInsight);

    // Sort by priority
    insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    setInsights(insights);
  };

  const analyzePeakTimes = () => {
    const hourlyStats = {};
    
    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = {
          count: 0,
          totalScore: 0,
          flowCount: 0,
          totalMinutes: 0
        };
      }
      
      hourlyStats[hour].count += 1;
      hourlyStats[hour].totalScore += session.focusScore || 0;
      hourlyStats[hour].flowCount += session.flowMetrics?.totalFlowTime > 0 ? 1 : 0;
      hourlyStats[hour].totalMinutes += session.actualDuration || 0;
    });

    // Find best performing hours
    const bestHours = Object.entries(hourlyStats)
      .filter(([_, stats]) => stats.count >= 3) // At least 3 sessions
      .map(([hour, stats]) => ({
        hour: parseInt(hour),
        avgScore: stats.totalScore / stats.count,
        flowRate: stats.flowCount / stats.count,
        avgMinutes: stats.totalMinutes / stats.count
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 3);

    if (bestHours.length === 0) return null;

    const formatHour = (h) => {
      if (h === 0) return '12am';
      if (h === 12) return '12pm';
      return h > 12 ? `${h - 12}pm` : `${h}am`;
    };

    return {
      id: 'peak-times',
      type: 'performance',
      icon: Schedule,
      priority: 'high',
      title: 'Peak Performance Hours',
      summary: `You perform best at ${bestHours.map(h => formatHour(h.hour)).join(', ')}`,
      details: {
        bestHours,
        avgScore: Math.round(bestHours[0].avgScore),
        flowRate: Math.round(bestHours[0].flowRate * 100)
      },
      recommendation: `Schedule your most important tasks between ${formatHour(bestHours[0].hour)} and ${formatHour(bestHours[0].hour + 1)}`,
      actions: [
        'Block calendar during peak hours',
        'Save routine tasks for off-peak times',
        'Protect these hours from meetings'
      ]
    };
  };

  const analyzeFlowPatterns = () => {
    const flowSessions = sessions.filter(s => s.flowMetrics?.totalFlowTime > 0);
    if (flowSessions.length < 5) return null;

    const avgFlowDuration = flowSessions.reduce((sum, s) => 
      sum + (s.flowMetrics.totalFlowTime || 0), 0
    ) / flowSessions.length;

    const flowRate = (flowSessions.length / sessions.length) * 100;

    // Find common patterns
    const patterns = {
      taskTypes: {},
      durations: {},
      timeOfDay: {}
    };

    flowSessions.forEach(session => {
      // Analyze session duration
      const duration = session.plannedDuration;
      const durationBucket = duration <= 30 ? 'short' : duration <= 60 ? 'medium' : 'long';
      patterns.durations[durationBucket] = (patterns.durations[durationBucket] || 0) + 1;

      // Analyze time of day
      const hour = new Date(session.startTime).getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      patterns.timeOfDay[timeOfDay] = (patterns.timeOfDay[timeOfDay] || 0) + 1;
    });

    const bestDuration = Object.entries(patterns.durations)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      id: 'flow-patterns',
      type: 'flow',
      icon: Psychology,
      priority: flowRate < 30 ? 'high' : 'medium',
      title: 'Flow State Analysis',
      summary: `You achieve flow state in ${Math.round(flowRate)}% of sessions`,
      details: {
        avgFlowDuration: Math.round(avgFlowDuration),
        flowRate: Math.round(flowRate),
        bestDuration,
        totalFlowTime: Math.round(flowSessions.reduce((sum, s) => 
          sum + (s.flowMetrics.totalFlowTime || 0), 0
        ) / 60) // hours
      },
      recommendation: flowRate < 30 
        ? 'Try longer sessions (60-90 min) to increase flow state frequency'
        : `Keep scheduling ${bestDuration} sessions for optimal flow`,
      actions: [
        'Minimize interruptions during first 25 minutes',
        'Use noise-cancelling headphones',
        'Clear your desk before starting'
      ]
    };
  };

  const analyzeTaskPatterns = () => {
    const sessionsWithTasks = sessions.filter(s => s.tasks && s.tasks.length > 0);
    if (sessionsWithTasks.length < 5) return null;

    const completionRates = sessionsWithTasks.map(session => ({
      taskCount: session.tasks.length,
      completedCount: session.completedTasks?.length || 0,
      rate: (session.completedTasks?.length || 0) / session.tasks.length
    }));

    const avgCompletionRate = completionRates.reduce((sum, r) => sum + r.rate, 0) / completionRates.length;

    // Find optimal task count
    const taskCountStats = {};
    completionRates.forEach(r => {
      if (!taskCountStats[r.taskCount]) {
        taskCountStats[r.taskCount] = { total: 0, completed: 0 };
      }
      taskCountStats[r.taskCount].total += r.taskCount;
      taskCountStats[r.taskCount].completed += r.completedCount;
    });

    const optimalTaskCount = Object.entries(taskCountStats)
      .map(([count, stats]) => ({
        count: parseInt(count),
        rate: stats.completed / stats.total
      }))
      .sort((a, b) => b.rate - a.rate)[0]?.count || 3;

    return {
      id: 'task-patterns',
      type: 'productivity',
      icon: Task,
      priority: avgCompletionRate < 0.7 ? 'high' : 'low',
      title: 'Task Completion Patterns',
      summary: `You complete ${Math.round(avgCompletionRate * 100)}% of planned tasks`,
      details: {
        avgCompletionRate: Math.round(avgCompletionRate * 100),
        optimalTaskCount,
        totalTasksCompleted: sessions.reduce((sum, s) => 
          sum + (s.completedTasks?.length || 0), 0
        )
      },
      recommendation: avgCompletionRate < 0.7
        ? `Reduce task count to ${optimalTaskCount} per session for better completion`
        : 'Your task planning is well-calibrated',
      actions: [
        'Break large tasks into smaller subtasks',
        'Estimate task duration more conservatively',
        'Keep buffer time between tasks'
      ]
    };
  };

  const analyzeDistractionPatterns = () => {
    const sessionsWithDistractions = sessions.filter(s => s.distractions);
    if (sessionsWithDistractions.length < 5) return null;

    const totalBlocked = sessionsWithDistractions.reduce((sum, s) => 
      sum + (s.distractions.blocked || 0), 0
    );
    
    const avgPerSession = totalBlocked / sessionsWithDistractions.length;

    // Find patterns by time
    const distractionsByHour = {};
    sessionsWithDistractions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      distractionsByHour[hour] = (distractionsByHour[hour] || 0) + (session.distractions.blocked || 0);
    });

    const worstHour = Object.entries(distractionsByHour)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      id: 'distraction-patterns',
      type: 'focus',
      icon: Block,
      priority: avgPerSession > 10 ? 'high' : 'low',
      title: 'Distraction Management',
      summary: `Blocked ${totalBlocked} distractions (avg ${Math.round(avgPerSession)}/session)`,
      details: {
        totalBlocked,
        avgPerSession: Math.round(avgPerSession),
        worstHour: worstHour ? parseInt(worstHour[0]) : null
      },
      recommendation: avgPerSession > 10
        ? 'Enable strict blocking mode during focus sessions'
        : 'Your distraction blocking is effective',
      actions: [
        'Close all browser tabs before starting',
        'Put phone in another room',
        'Use website blockers for social media'
      ]
    };
  };

  const analyzeBreakPatterns = () => {
    // Analyze session durations and gaps
    const sessionPairs = [];
    for (let i = 1; i < sessions.length; i++) {
      const prevEnd = new Date(sessions[i-1].endTime || sessions[i-1].startTime);
      const currentStart = new Date(sessions[i].startTime);
      const gap = differenceInMinutes(currentStart, prevEnd);
      
      if (gap > 0 && gap < 120) { // Breaks less than 2 hours
        sessionPairs.push({
          sessionDuration: sessions[i-1].actualDuration || sessions[i-1].plannedDuration,
          breakDuration: gap,
          nextSessionScore: sessions[i].focusScore || 0
        });
      }
    }

    if (sessionPairs.length < 5) return null;

    // Find optimal break duration
    const breakBuckets = {
      short: { breaks: [], scores: [] },
      medium: { breaks: [], scores: [] },
      long: { breaks: [], scores: [] }
    };

    sessionPairs.forEach(pair => {
      const bucket = pair.breakDuration <= 10 ? 'short' 
        : pair.breakDuration <= 20 ? 'medium' : 'long';
      breakBuckets[bucket].breaks.push(pair.breakDuration);
      breakBuckets[bucket].scores.push(pair.nextSessionScore);
    });

    const optimalBreak = Object.entries(breakBuckets)
      .filter(([_, data]) => data.scores.length > 0)
      .map(([type, data]) => ({
        type,
        avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length
      }))
      .sort((a, b) => b.avgScore - a.avgScore)[0];

    return {
      id: 'break-patterns',
      type: 'recovery',
      icon: Coffee,
      priority: 'medium',
      title: 'Break Optimization',
      summary: `${optimalBreak?.type || 'Medium'} breaks (10-20 min) work best for you`,
      details: {
        optimalBreakType: optimalBreak?.type,
        avgNextScore: Math.round(optimalBreak?.avgScore || 0)
      },
      recommendation: 'Take regular breaks to maintain high performance',
      actions: [
        'Set a timer for break reminders',
        'Do light physical activity during breaks',
        'Stay hydrated between sessions'
      ]
    };
  };

  const analyzeSessionDurations = () => {
    const durationBuckets = {
      short: { sessions: [], scores: [] },
      medium: { sessions: [], scores: [] },
      long: { sessions: [], scores: [] }
    };

    sessions.forEach(session => {
      const duration = session.plannedDuration;
      const bucket = duration <= 30 ? 'short' : duration <= 60 ? 'medium' : 'long';
      durationBuckets[bucket].sessions.push(session);
      durationBuckets[bucket].scores.push(session.focusScore || 0);
    });

    const optimalDuration = Object.entries(durationBuckets)
      .filter(([_, data]) => data.sessions.length >= 3)
      .map(([type, data]) => ({
        type,
        avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        count: data.sessions.length
      }))
      .sort((a, b) => b.avgScore - a.avgScore)[0];

    if (!optimalDuration) return null;

    const durationMap = {
      short: '25-30 minutes',
      medium: '45-60 minutes', 
      long: '90+ minutes'
    };

    return {
      id: 'session-duration',
      type: 'optimization',
      icon: Timer,
      priority: 'low',
      title: 'Optimal Session Length',
      summary: `Your best sessions are ${durationMap[optimalDuration.type]}`,
      details: {
        optimalType: optimalDuration.type,
        avgScore: Math.round(optimalDuration.avgScore)
      },
      recommendation: `Plan more ${durationMap[optimalDuration.type]} sessions`,
      actions: [
        'Adjust default session duration in settings',
        'Match task complexity to session length',
        'Consider energy levels when planning duration'
      ]
    };
  };

  const analyzeWeeklyPatterns = () => {
    const dayStats = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    sessions.forEach(session => {
      const day = format(new Date(session.startTime), 'EEEE');
      if (!dayStats[day]) {
        dayStats[day] = {
          count: 0,
          totalMinutes: 0,
          totalScore: 0
        };
      }
      dayStats[day].count += 1;
      dayStats[day].totalMinutes += session.actualDuration || 0;
      dayStats[day].totalScore += session.focusScore || 0;
    });

    const bestDay = Object.entries(dayStats)
      .filter(([_, stats]) => stats.count > 0)
      .map(([day, stats]) => ({
        day,
        avgMinutes: stats.totalMinutes / stats.count,
        avgScore: stats.totalScore / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgScore - a.avgScore)[0];

    if (!bestDay) return null;

    return {
      id: 'weekly-patterns',
      type: 'planning',
      icon: EmojiEvents,
      priority: 'low',
      title: 'Weekly Performance',
      summary: `${bestDay.day} is your most productive day`,
      details: {
        bestDay: bestDay.day,
        avgMinutes: Math.round(bestDay.avgMinutes),
        avgScore: Math.round(bestDay.avgScore)
      },
      recommendation: `Schedule important work on ${bestDay.day}s`,
      actions: [
        'Block time for deep work on best days',
        'Save meetings for less productive days',
        'Plan weekly reviews on Fridays'
      ]
    };
  };

  const getInsightIcon = (type) => {
    const iconMap = {
      performance: Schedule,
      flow: Psychology,
      productivity: Task,
      focus: Block,
      recovery: Coffee,
      optimization: Timer,
      planning: EmojiEvents
    };
    return iconMap[type] || Lightbulb;
  };

  const getPriorityColor = (priority) => {
    const colorMap = {
      high: 'error',
      medium: 'warning',
      low: 'info'
    };
    return colorMap[priority] || 'default';
  };

  const handleToggleExpand = (insightId) => {
    setExpandedInsight(expandedInsight === insightId ? null : insightId);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Personalized Insights
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        AI-powered recommendations based on your focus patterns
      </Typography>

      <List sx={{ p: 0 }}>
        {insights.map((insight, index) => {
          const Icon = getInsightIcon(insight.type);
          const isExpanded = expandedInsight === insight.id;

          return (
            <React.Fragment key={insight.id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  px: 0,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                  borderRadius: 1
                }}
                onClick={() => handleToggleExpand(insight.id)}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: `${getPriorityColor(insight.priority)}.main` }}>
                    <Icon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">
                        {insight.title}
                      </Typography>
                      <Chip
                        label={insight.priority}
                        size="small"
                        color={getPriorityColor(insight.priority)}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {insight.summary}
                      </Typography>
                      
                      <Collapse in={isExpanded}>
                        <Box sx={{ mt: 2 }}>
                          <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                              <strong>Recommendation:</strong> {insight.recommendation}
                            </Typography>
                          </Alert>
                          
                          {insight.actions && insight.actions.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                Action Items:
                              </Typography>
                              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                {insight.actions.map((action, i) => (
                                  <Typography
                                    key={i}
                                    component="li"
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 0.5 }}
                                  >
                                    {action}
                                  </Typography>
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </Box>
                  }
                />
              </ListItem>
              {index < insights.length - 1 && <Divider sx={{ my: 1 }} />}
            </React.Fragment>
          );
        })}
      </List>

      {insights.length === 0 && (
        <Alert severity="info">
          Complete more focus sessions to unlock personalized insights
        </Alert>
      )}
    </Box>
  );
};

export default FocusInsights;