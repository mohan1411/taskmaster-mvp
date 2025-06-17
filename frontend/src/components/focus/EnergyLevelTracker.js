import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  Chip,
  Button,
  Grid,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Rating
} from '@mui/material';
import {
  Bolt,
  TrendingUp,
  TrendingDown,
  Coffee,
  BatteryChargingFull,
  Lightbulb,
  Schedule,
  FitnessCenter,
  Restaurant,
  NightsStay
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';

const EnergyLevelTracker = ({ 
  currentEnergy, 
  onEnergyChange,
  showRecommendations = true,
  historicalData = [] 
}) => {
  const theme = useTheme();
  const [energy, setEnergy] = useState(currentEnergy || 7);
  const [energyTrend, setEnergyTrend] = useState('stable');
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    analyzeEnergyTrend();
    generateRecommendations();
  }, [energy, historicalData]);

  const analyzeEnergyTrend = () => {
    if (historicalData.length < 2) {
      setEnergyTrend('stable');
      return;
    }

    const recent = historicalData.slice(-5);
    const avgRecent = recent.reduce((sum, d) => sum + d.energy, 0) / recent.length;
    
    if (energy > avgRecent + 1) setEnergyTrend('increasing');
    else if (energy < avgRecent - 1) setEnergyTrend('decreasing');
    else setEnergyTrend('stable');
  };

  const generateRecommendations = () => {
    const recs = [];
    const hour = new Date().getHours();

    // Time-based recommendations
    if (hour >= 13 && hour <= 15 && energy < 5) {
      recs.push({
        icon: Coffee,
        title: 'Post-lunch dip detected',
        action: 'Take a 10-minute walk or power nap',
        type: 'recovery'
      });
    }

    // Energy level recommendations
    if (energy <= 3) {
      recs.push({
        icon: NightsStay,
        title: 'Low energy',
        action: 'Consider shorter focus sessions or routine tasks',
        type: 'caution'
      });
    } else if (energy >= 8) {
      recs.push({
        icon: Bolt,
        title: 'Peak energy',
        action: 'Perfect for complex tasks and deep work',
        type: 'optimal'
      });
    }

    // Activity recommendations
    if (energy < 5 && hour < 17) {
      recs.push({
        icon: FitnessCenter,
        title: 'Energy boost needed',
        action: 'Try 5 minutes of light exercise',
        type: 'activity'
      });
    }

    // Nutrition recommendations
    if (energy < 4 && (hour < 12 || hour > 14)) {
      recs.push({
        icon: Restaurant,
        title: 'Fuel check',
        action: 'Stay hydrated and consider a healthy snack',
        type: 'nutrition'
      });
    }

    setRecommendations(recs);
  };

  const handleEnergyChange = (event, newValue) => {
    setEnergy(newValue);
    onEnergyChange?.(newValue);
  };

  const getEnergyColor = (level) => {
    if (level >= 8) return theme.palette.success.main;
    if (level >= 5) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getEnergyLabel = (level) => {
    if (level >= 8) return 'High Energy';
    if (level >= 5) return 'Moderate Energy';
    return 'Low Energy';
  };

  const getEnergyIcon = () => {
    if (energy >= 8) return <BatteryChargingFull />;
    if (energy >= 5) return <Bolt />;
    return <Coffee />;
  };

  const energyMarks = [
    { value: 1, label: '1' },
    { value: 5, label: '5' },
    { value: 10, label: '10' }
  ];

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getEnergyIcon()}
            <Typography variant="h6">
              Energy Level Tracker
            </Typography>
          </Box>
          <Chip
            label={getEnergyLabel(energy)}
            color={energy >= 8 ? 'success' : energy >= 5 ? 'warning' : 'error'}
            size="small"
          />
        </Box>

        {/* Current Energy Slider */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" gutterBottom>
            How energized do you feel right now?
          </Typography>
          <Box sx={{ px: 2, py: 1 }}>
            <Slider
              value={energy}
              onChange={handleEnergyChange}
              min={1}
              max={10}
              marks={energyMarks}
              valueLabelDisplay="on"
              sx={{
                '& .MuiSlider-valueLabel': {
                  backgroundColor: getEnergyColor(energy)
                },
                '& .MuiSlider-thumb': {
                  backgroundColor: getEnergyColor(energy)
                },
                '& .MuiSlider-track': {
                  backgroundColor: getEnergyColor(energy)
                }
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Exhausted
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Energized
            </Typography>
          </Box>
        </Box>

        {/* Energy Trend */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2">
              Energy Trend
            </Typography>
            {energyTrend === 'increasing' && (
              <Chip
                icon={<TrendingUp />}
                label="Increasing"
                size="small"
                color="success"
              />
            )}
            {energyTrend === 'decreasing' && (
              <Chip
                icon={<TrendingDown />}
                label="Decreasing"
                size="small"
                color="error"
              />
            )}
            {energyTrend === 'stable' && (
              <Chip
                label="Stable"
                size="small"
              />
            )}
          </Box>
          
          {/* Mini visualization of recent energy levels */}
          {historicalData.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={0.5}>
                {historicalData.slice(-7).map((data, index) => (
                  <Grid item key={index}>
                    <Tooltip title={`${data.energy}/10 at ${format(new Date(data.timestamp), 'HH:mm')}`}>
                      <Box
                        sx={{
                          width: 30,
                          height: 40,
                          bgcolor: getEnergyColor(data.energy),
                          opacity: 0.3 + (data.energy / 10) * 0.7,
                          borderRadius: 0.5,
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Box
                          sx={{
                            width: '100%',
                            height: `${(data.energy / 10) * 100}%`,
                            bgcolor: getEnergyColor(data.energy),
                            borderRadius: 0.5
                          }}
                        />
                      </Box>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>

        {/* Recommendations */}
        {showRecommendations && recommendations.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Energy Optimization Tips
            </Typography>
            <Grid container spacing={1}>
              {recommendations.map((rec, index) => {
                const Icon = rec.icon;
                return (
                  <Grid item xs={12} key={index}>
                    <Alert
                      severity={rec.type === 'optimal' ? 'success' : rec.type === 'caution' ? 'warning' : 'info'}
                      icon={<Icon />}
                      sx={{ py: 0.5 }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {rec.title}
                        </Typography>
                        <Typography variant="caption">
                          {rec.action}
                        </Typography>
                      </Box>
                    </Alert>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* Quick Energy Boosters */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Quick Energy Boosters
          </Typography>
          <Grid container spacing={1}>
            <Grid item>
              <Chip
                icon={<Coffee />}
                label="Hydrate"
                variant="outlined"
                onClick={() => {}}
                sx={{ cursor: 'pointer' }}
              />
            </Grid>
            <Grid item>
              <Chip
                icon={<FitnessCenter />}
                label="Stretch"
                variant="outlined"
                onClick={() => {}}
                sx={{ cursor: 'pointer' }}
              />
            </Grid>
            <Grid item>
              <Chip
                icon={<Schedule />}
                label="Micro-break"
                variant="outlined"
                onClick={() => {}}
                sx={{ cursor: 'pointer' }}
              />
            </Grid>
            <Grid item>
              <Chip
                icon={<Lightbulb />}
                label="Bright light"
                variant="outlined"
                onClick={() => {}}
                sx={{ cursor: 'pointer' }}
              />
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EnergyLevelTracker;