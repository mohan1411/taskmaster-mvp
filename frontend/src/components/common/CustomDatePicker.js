import React, { useState } from 'react';
import { Box, TextField, Paper, Button, IconButton, Typography, Popover } from '@mui/material';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isWithinInterval } from 'date-fns';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

/**
 * A custom DatePicker component that doesn't rely on MUI's DatePicker
 * Use this as a temporary replacement while the MUI DatePicker issues are fixed
 */
const CustomDatePicker = ({ 
  label, 
  value, 
  onChange, 
  size = 'medium',
  fullWidth = true,
  disabled = false,
  format: dateFormat = 'MMM d, yyyy',
  minDate,
  maxDate,
  ...props 
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewDate, setViewDate] = useState(value || new Date());
  
  const open = Boolean(anchorEl);
  
  const handleOpenCalendar = (event) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
      // If we have a selected value, set the view to that month
      if (value) {
        setViewDate(value);
      }
    }
  };
  
  const handleCloseCalendar = () => {
    setAnchorEl(null);
  };
  
  const handleDateChange = (date) => {
    onChange(date);
    handleCloseCalendar();
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
        <Paper sx={{ p: 2, width: 280 }}>
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
          
          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Button size="small" onClick={() => handleDateChange(new Date())}>
              Today
            </Button>
            <Button size="small" onClick={handleCloseCalendar}>
              Cancel
            </Button>
          </Box>
        </Paper>
      </Popover>
    </>
  );
};

export default CustomDatePicker;