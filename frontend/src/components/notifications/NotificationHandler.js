import React, { useEffect, useState } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import notificationService from '../../services/notificationService';
import followupService from '../../services/followupService';


/**
 * Global notification handler component
 * Handles browser notifications and permission requests
 */
const NotificationHandler = () => {
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);
  
  // Check notification permission on mount
  useEffect(() => {
    const status = notificationService.checkBrowserNotificationPermission();
    setPermissionStatus(status);
    
    // Show permission alert if not granted and not denied
    if (status !== 'granted' && status !== 'denied' && status !== 'not-supported') {
      setShowPermissionAlert(true);
    }
    
    // Start notification polling for browser-type notifications
    startNotificationPolling();
    
    // Cleanup on unmount
    return () => {
      if (window.notificationInterval) {
        clearInterval(window.notificationInterval);
      }
    };
  }, []);
  
  // Start polling for browser notifications
  const startNotificationPolling = () => {
    // Check if we already have an interval running
    if (window.notificationInterval) {
      return;
    }
    
    // Poll every 30 seconds for new notifications
    window.notificationInterval = setInterval(async () => {
      if (permissionStatus === 'granted') {
        try {
          // Get notifications with browser type that haven't been read
          const result = await notificationService.getNotifications({
            read: false,
            type: 'browser'
          });
          
          if (result && result.notifications && result.notifications.length > 0) {
            processNotifications(result.notifications);
          }
        } catch (error) {
          console.error('Error polling for notifications:', error);
        }
      }
    }, 30000); // 30 seconds
  };
  
  // Process notifications and show browser notifications
  const processNotifications = async (notifications) => {
    for (const notification of notifications) {
      // Check if this is a follow-up notification
      if (notification.referenceType === 'followup' && notification.referenceId) {
        try {
          // Get the follow-up details
          const followup = await followupService.getFollowUpById(notification.referenceId);
          
          if (followup) {
            // Show the notification
            notificationService.showFollowUpReminder(followup);
            
            // Mark the notification as read
            await notificationService.markNotificationRead(notification._id);
          }
        } catch (error) {
          console.error('Error processing follow-up notification:', error);
        }
      } else {
        // Generic notification
        notificationService.showBrowserNotification(
          notification.title,
          {
            body: notification.message,
            tag: `notification-${notification._id}`
          }
        );
        
        // Mark the notification as read
        await notificationService.markNotificationRead(notification._id);
      }
    }
  };
  
  // Request notification permission
  const requestPermission = async () => {
    const status = await notificationService.requestBrowserNotificationPermission();
    setPermissionStatus(status);
    setShowPermissionAlert(false);
  };
  
  // Dismiss the permission alert
  const dismissPermissionAlert = () => {
    setShowPermissionAlert(false);
  };
  
  return (
    <Snackbar
      open={showPermissionAlert}
      onClose={dismissPermissionAlert}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity="info"
        onClose={dismissPermissionAlert}
        action={
          <Button color="primary" size="small" onClick={requestPermission}>
            Enable
          </Button>
        }
      >
        Enable browser notifications for follow-up reminders
      </Alert>
    </Snackbar>
  );
};

export default NotificationHandler;