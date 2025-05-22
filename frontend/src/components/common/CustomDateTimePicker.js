import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Paper, 
  Button, 
  IconButton, 
  Typography, 
  Popover, 
  Stack,
  MenuItem
} from '@mui/material';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isWithinInterval, addHours } from 'date-fns';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';

/**
 * A custom DateTimePicker component that doesn't rely on MUI's DateTimePicker
 * Use this as a direct replacement for TaskForm
 */
const CustomDateTimePicker = ({ 
  label, 
  value, 
  onChange, 
  size = 'medium',
  fullWidth = true,
  disabled = false,
  error = false,
  helperText = '',
  format: dateFormat = 'MMM d, yyyy - h:mm a',
  minDate,
  maxDate,
  ...props 
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewDate, setViewDate] = useState(value || new Date());
  const [time, setTime] = useState({
    hours: value ? value.getHours() : new Date().getHours(),
    minutes: value ? value.getMinutes() : new Date().getMinutes()
  });
  
  const open = Boolean(anchorEl);
  
  const handleOpenCalendar = (event) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
      // If we have a selected value, set the view to that month
      if (value) {
        setViewDate(value);
        setTime({
          hours: value.getHours(),
          minutes: value.getMinutes()
        });
      }
    }
  };
  
  const handleCloseCalendar = () => {
    setAnchorEl(null);
  };
  
  const handleDateChange = (date) => {
    // Create a new date with the selected date and current time
    const updatedDate = new Date(date);
    updatedDate.setHours(time.hours);
    updatedDate.setMinutes(time.minutes);
    
    onChange(updatedDate);
  };
  
  const handleTimeChange = (type, value) => {
    const newTime = { ...time, [type]: parseInt(value, 10) };
    setTime(newTime);
    
    if (viewDate) {
      const updatedDate = new Date(viewDate);
      updatedDate.setHours(newTime.hours);
      updatedDate.setMinutes(newTime.minutes);
      
      onChange(updatedDate);
    }
  };
  
  const handlePrevMonth = () => {
    setViewDate(prevDate => subMonths(prevDate, 1));
  };
  
  const handleNextMonth = () => {
    setViewDate(prevDate => addMonths(prevDate, 1));
  };
  
  // Generate days for the calendar
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Create rows for the calendar
  const weeks = [];
  let week = [];
  
  // Add empty slots for days before the first of the month
  const firstDayOfMonth = monthStart.getDay();
  for (let i = 0; i < firstDayOfMonth; i++) {
    week.push(null);
  }
  
  // Add the days of the month
  daysInMonth.forEach((day) => {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  });
  
  // Add empty slots for days after the last of the month
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null);
    }
    weeks.push(week);
  }
  
  // Check if a date is selectable
  const isDateSelectable = (date) => {
    if (!date) return false;
    
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    
    return true;
  };
  
  // Generate hours options
  const hoursOptions = Array.from({ length: 24 }, (_, i) => i);
  
  // Generate minutes options
  const minutesOptions = Array.from({ length: 60 }, (_, i) => i);
  
  return (
    <>
      <TextField
        label={label}
        value={value ? format(value, dateFormat) : ''}
        onClick={handleOpenCalendar}
        InputProps={{
          endAdornment: (
            <IconButton 
              size="small" 
              onClick={handleOpenCalendar}
              disabled={disabled}
            >
              <CalendarIcon />
            </IconButton>
          ),
          readOnly: true,
        }}
        size={size}
        fullWidth={fullWidth}
        disabled={disabled}
        error={error}
        helperText={helperText}
        {...props}
      />
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleCloseCalendar}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Paper sx={{ p: 2, width: 320 }}>
          {/* Calendar header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <IconButton size="small" onClick={handlePrevMonth}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="subtitle1">
              {format(viewDate, 'MMMM yyyy')}
            </Typography>
            <IconButton size="small" onClick={handleNextMonth}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
          
          {/* Day names */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', mb: 1 }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <Typography key={day} variant="caption" sx={{ fontWeight: 'bold' }}>
                {day}
              </Typography>
            ))}
          </Box>
          
          {/* Calendar grid */}
          {weeks.map((week, weekIndex) => (
            <Box 
              key={`week-${weekIndex}`} 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)', 
                gap: 0.5,
                mb: 0.5 
              }}
            >
              {week.map((day, dayIndex) => (
                <Button
                  key={`day-${weekIndex}-${dayIndex}`}
                  variant={day && value && isSameDay(day, value) ? 'contained' : 'text'}
                  color={day && isToday(day) ? 'primary' : 'inherit'}
                  disabled={!day || !isDateSelectable(day)}
                  onClick={() => day && handleDateChange(day)}
                  sx={{
                    minWidth: 32,
                    maxWidth: 32,
                    height: 32,
                    p: 0,
                    borderRadius: '50%',
                    opacity: day ? 1 : 0,
                    cursor: day && isDateSelectable(day) ? 'pointer' : 'default',
                  }}
                >
                  {day && day.getDate()}
                </Button>
              ))}
            </Box>
          ))}
          
          {/* Time selector */}
          <Box sx={{ mt: 2, py: 1, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
              <TimeIcon fontSize="small" sx={{ mr: 0.5 }} />
              Time
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                select
                label="Hour"
                value={time.hours}
                onChange={(e) => handleTimeChange('hours', e.target.value)}
                size="small"
                sx={{ width: '40%' }}
              >
                {hoursOptions.map((hour) => (
                  <MenuItem key={hour} value={hour}>
                    {hour.toString().padStart(2, '0')}
                  </MenuItem>
                ))}
              </TextField>
              <Typography>:</Typography>
              <TextField
                select
                label="Minute"
                value={time.minutes}
                onChange={(e) => handleTimeChange('minutes', e.target.value)}
                size="small"
                sx={{ width: '40%' }}
              >
                {minutesOptions.map((minute) => (
                  <MenuItem key={minute} value={minute}>
                    {minute.toString().padStart(2, '0')}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Box>
          
          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button size="small" onClick={() => handleDateChange(new Date())}>
              Now
            </Button>
            <Button size="small" onClick={handleCloseCalendar}>
              Close
            </Button>
          </Box>
        </Paper>
      </Popover>
    </>
  );
};

export default CustomDateTimePicker;