import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

const SessionHistoryChart = ({ sessions, timeRange = '7d' }) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState('area');
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    processSessionData();
  }, [sessions, timeRange]);

  const processSessionData = () => {
    setLoading(true);
    
    // Get date range
    const endDate = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = subDays(endDate, 7);
        break;
      case '30d':
        startDate = subDays(endDate, 30);
        break;
      case 'week':
        startDate = startOfWeek(endDate);
        break;
      default:
        startDate = subDays(endDate, 7);
    }

    // Get all days in range
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Aggregate data by day
    const dailyData = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySessions = sessions.filter(session => {
        const sessionDate = format(new Date(session.startTime), 'yyyy-MM-dd');
        return sessionDate === dayStr;
      });

      const totalMinutes = daySessions.reduce((sum, session) => 
        sum + (session.actualDuration || session.plannedDuration), 0
      );
      
      const flowMinutes = daySessions.reduce((sum, session) => {
        if (session.flowMetrics) {
          return sum + (session.flowMetrics.totalFlowTime || 0);
        }
        return sum;
      }, 0);

      const tasksCompleted = daySessions.reduce((sum, session) => 
        sum + (session.completedTasks?.length || 0), 0
      );

      const distractionsBlocked = daySessions.reduce((sum, session) => 
        sum + (session.distractions?.blocked || 0), 0
      );

      return {
        date: format(day, 'MMM dd'),
        dayOfWeek: format(day, 'EEE'),
        focusMinutes: totalMinutes,
        focusHours: Number((totalMinutes / 60).toFixed(1)),
        flowMinutes,
        sessions: daySessions.length,
        tasksCompleted,
        distractionsBlocked,
        avgFocusScore: daySessions.length > 0 
          ? Math.round(daySessions.reduce((sum, s) => sum + (s.focusScore || 0), 0) / daySessions.length)
          : 0
      };
    });

    setChartData(dailyData);
    setLoading(false);
  };

  const handleChartTypeChange = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: theme.shadows[8]
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.name.includes('Hours') ? 'hrs' : entry.name.includes('Minutes') ? 'min' : ''}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
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
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Session History
          </Typography>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            size="small"
          >
            <ToggleButton value="area">Area</ToggleButton>
            <ToggleButton value="bar">Bar</ToggleButton>
            <ToggleButton value="line">Line</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            {chartType === 'area' ? (
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey="date" 
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: '0.875rem' }}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: '0.875rem' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="focusHours"
                  stackId="1"
                  stroke={theme.palette.primary.main}
                  fill={theme.palette.primary.main}
                  fillOpacity={0.6}
                  name="Focus Hours"
                />
                <Area
                  type="monotone"
                  dataKey="flowMinutes"
                  stackId="2"
                  stroke={theme.palette.secondary.main}
                  fill={theme.palette.secondary.main}
                  fillOpacity={0.4}
                  name="Flow Minutes"
                />
              </AreaChart>
            ) : chartType === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey="date" 
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: '0.875rem' }}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: '0.875rem' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="focusHours" 
                  fill={theme.palette.primary.main}
                  name="Focus Hours"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="sessions" 
                  fill={theme.palette.secondary.main}
                  name="Sessions"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="tasksCompleted" 
                  fill={theme.palette.success.main}
                  name="Tasks"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey="date" 
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: '0.875rem' }}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: '0.875rem' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="focusHours"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  dot={{ fill: theme.palette.primary.main }}
                  name="Focus Hours"
                />
                <Line
                  type="monotone"
                  dataKey="avgFocusScore"
                  stroke={theme.palette.secondary.main}
                  strokeWidth={2}
                  dot={{ fill: theme.palette.secondary.main }}
                  name="Avg Score"
                  yAxisId="right"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </Box>

        {/* Summary Stats */}
        <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {chartData.reduce((sum, day) => sum + day.focusHours, 0).toFixed(1)}h
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Focus
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="secondary">
              {chartData.reduce((sum, day) => sum + day.sessions, 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sessions
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              {chartData.reduce((sum, day) => sum + day.tasksCompleted, 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tasks Done
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main">
              {chartData.reduce((sum, day) => sum + day.distractionsBlocked, 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Blocked
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SessionHistoryChart;