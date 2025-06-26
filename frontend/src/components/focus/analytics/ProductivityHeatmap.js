import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tooltip,
  Chip,
  useTheme
} from '@mui/material';
import { format } from 'date-fns';

const ProductivityHeatmap = ({ sessions }) => {
  const theme = useTheme();
  const [heatmapData, setHeatmapData] = useState([]);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    calculateHeatmapData();
  }, [sessions]);

  const calculateHeatmapData = () => {
    // Initialize heatmap data structure
    const heatmap = {};
    days.forEach(day => {
      heatmap[day] = {};
      hours.forEach(hour => {
        heatmap[day][hour] = {
          sessions: 0,
          totalMinutes: 0,
          flowMinutes: 0,
          tasks: 0,
          avgScore: 0
        };
      });
    });

    // Aggregate session data
    sessions.forEach(session => {
      const startTime = new Date(session.startTime);
      const dayName = format(startTime, 'EEE');
      const hour = startTime.getHours();
      
      if (heatmap[dayName] && heatmap[dayName][hour]) {
        const cell = heatmap[dayName][hour];
        cell.sessions += 1;
        cell.totalMinutes += session.actualDuration || session.plannedDuration || 0;
        cell.flowMinutes += session.flowMetrics?.totalFlowTime || 0;
        cell.tasks += session.completedTasks?.length || 0;
        cell.avgScore = ((cell.avgScore * (cell.sessions - 1)) + (session.focusScore || 0)) / cell.sessions;
      }
    });

    setHeatmapData(heatmap);
  };

  const getIntensity = (dayData, hour) => {
    const cell = dayData[hour];
    if (!cell || cell.sessions === 0) return 0;
    
    // Calculate intensity based on total minutes and session count
    const minutesScore = Math.min(cell.totalMinutes / 120, 1); // Normalize to 2 hours max
    const sessionScore = Math.min(cell.sessions / 3, 1); // Normalize to 3 sessions max
    const flowScore = cell.flowMinutes > 0 ? 0.2 : 0; // Bonus for flow state
    
    return Math.min((minutesScore * 0.6 + sessionScore * 0.4 + flowScore), 1);
  };

  const getCellColor = (intensity) => {
    if (intensity === 0) {
      return theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(0, 0, 0, 0.02)';
    }
    
    const baseColor = theme.palette.primary.main;
    return `${baseColor}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`;
  };

  const formatHour = (hour) => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    return hour > 12 ? `${hour - 12}pm` : `${hour}am`;
  };

  const HeatmapCell = ({ day, hour, data }) => {
    const intensity = getIntensity(data, hour);
    const cellData = data[hour];
    
    return (
      <Tooltip
        title={
          <Box>
            <Typography variant="body2">
              <strong>{day} {formatHour(hour)}</strong>
            </Typography>
            {cellData.sessions > 0 ? (
              <>
                <Typography variant="caption" display="block">
                  Sessions: {cellData.sessions}
                </Typography>
                <Typography variant="caption" display="block">
                  Total: {Math.round(cellData.totalMinutes)}min
                </Typography>
                <Typography variant="caption" display="block">
                  Tasks: {cellData.tasks}
                </Typography>
                {cellData.flowMinutes > 0 && (
                  <Typography variant="caption" display="block" color="secondary">
                    Flow: {Math.round(cellData.flowMinutes)}min
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="caption">No sessions</Typography>
            )}
          </Box>
        }
        arrow
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            backgroundColor: getCellColor(intensity),
            border: 1,
            borderColor: theme.palette.divider,
            borderRadius: 0.5,
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: theme.shadows[4]
            }
          }}
        />
      </Tooltip>
    );
  };

  // Find peak hours
  const findPeakHours = () => {
    const hourStats = {};
    hours.forEach(hour => {
      hourStats[hour] = {
        totalSessions: 0,
        totalMinutes: 0
      };
      days.forEach(day => {
        if (heatmapData[day] && heatmapData[day][hour]) {
          hourStats[hour].totalSessions += heatmapData[day][hour].sessions;
          hourStats[hour].totalMinutes += heatmapData[day][hour].totalMinutes;
        }
      });
    });

    return Object.entries(hourStats)
      .filter(([_, stats]) => stats.totalSessions > 0)
      .sort((a, b) => b[1].totalMinutes - a[1].totalMinutes)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  };

  const peakHours = findPeakHours();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Productivity Heatmap
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Your focus patterns by day and hour
        </Typography>

        {/* Hour labels */}
        <Box sx={{ display: 'flex', mb: 1 }}>
          <Box sx={{ width: 40 }} /> {/* Spacer for day labels */}
          {hours.map(hour => (
            <Box
              key={hour}
              sx={{
                width: 28,
                textAlign: 'center',
                fontSize: '0.75rem',
                color: theme.palette.text.secondary,
                fontWeight: peakHours.includes(hour) ? 'bold' : 'normal'
              }}
            >
              {hour % 3 === 0 ? formatHour(hour) : ''}
            </Box>
          ))}
        </Box>

        {/* Heatmap grid */}
        {days.map(day => (
          <Box key={day} sx={{ display: 'flex', mb: 0.5 }}>
            <Box
              sx={{
                width: 40,
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: theme.palette.text.secondary
              }}
            >
              {day}
            </Box>
            {hours.map(hour => (
              <Box key={`${day}-${hour}`} sx={{ mr: 0.5 }}>
                {heatmapData[day] && (
                  <HeatmapCell
                    day={day}
                    hour={hour}
                    data={heatmapData[day]}
                  />
                )}
              </Box>
            ))}
          </Box>
        ))}

        {/* Legend */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Less
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[0, 0.25, 0.5, 0.75, 1].map(intensity => (
              <Box
                key={intensity}
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: getCellColor(intensity),
                  border: 1,
                  borderColor: theme.palette.divider,
                  borderRadius: 0.5
                }}
              />
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary">
            More
          </Typography>
        </Box>

        {/* Peak hours */}
        {peakHours.length > 0 && (
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Your Peak Hours
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {peakHours.map(hour => (
                <Chip
                  key={hour}
                  label={formatHour(hour)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductivityHeatmap;