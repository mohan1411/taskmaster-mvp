import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Slide, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

function SlideTransition(props) {
  return <Slide {...props} direction="up" />;
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);

  const showNotification = useCallback((message, severity = 'info', duration = 6000) => {
    const notification = {
      id: Date.now(),
      message,
      severity,
      duration
    };
    
    setNotifications(prev => [...prev, notification]);
    
    if (!open) {
      setCurrentNotification(notification);
      setOpen(true);
    }
  }, [open]);

  const success = useCallback((message, duration) => {
    showNotification(message, 'success', duration);
  }, [showNotification]);

  const error = useCallback((message, duration) => {
    showNotification(message, 'error', duration);
  }, [showNotification]);

  const warning = useCallback((message, duration) => {
    showNotification(message, 'warning', duration);
  }, [showNotification]);

  const info = useCallback((message, duration) => {
    showNotification(message, 'info', duration);
  }, [showNotification]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const handleExited = () => {
    setNotifications(prev => prev.filter(n => n.id !== currentNotification?.id));
    
    // Show next notification if any
    if (notifications.length > 1) {
      const nextNotification = notifications.find(n => n.id !== currentNotification?.id);
      if (nextNotification) {
        setCurrentNotification(nextNotification);
        setOpen(true);
      }
    } else {
      setCurrentNotification(null);
    }
  };

  const showSuccess = success;
  const showError = error;
  const showInfo = info;
  const showWarning = warning;
  
  const value = {
    showNotification,
    success,
    error,
    warning,
    info,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={currentNotification?.duration || 6000}
        onClose={handleClose}
        onExited={handleExited}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ 
          '& .MuiSnackbarContent-root': { 
            minWidth: '300px',
            maxWidth: '600px'
          } 
        }}
      >
        <Alert
          severity={currentNotification?.severity || 'info'}
          onClose={handleClose}
          sx={{ 
            width: '100%',
            boxShadow: 3,
            alignItems: 'center',
            '& .MuiAlert-message': {
              flex: 1,
              padding: '0 8px'
            }
          }}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
              sx={{ ml: 1 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {currentNotification?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};