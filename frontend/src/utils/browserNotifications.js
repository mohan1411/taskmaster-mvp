/**
 * Browser notification utility
 * Handles browser notifications with permission management
 */

// Check if browser notifications are supported
export const isSupported = () => {
  return 'Notification' in window;
};

// Get the current notification permission status
export const getPermissionStatus = () => {
  if (!isSupported()) {
    return 'not-supported';
  }
  return Notification.permission;
};

// Request permission to show notifications
export const requestPermission = async () => {
  if (!isSupported()) {
    return 'not-supported';
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

// Show a browser notification
export const showNotification = (title, options = {}) => {
  if (!isSupported() || Notification.permission !== 'granted') {
    return false;
  }
  
  try {
    // Default options
    const defaultOptions = {
      icon: '/logo192.png', // Assuming the app has this favicon
      badge: '/favicon.ico',
      requireInteraction: true,
      timestamp: Date.now(),
      ...options
    };
    
    const notification = new Notification(title, defaultOptions);
    
    // Add click handler to open the app
    if (options.url) {
      notification.onclick = () => {
        window.open(options.url, '_blank');
        notification.close();
      };
    }
    
    return notification;
  } catch (error) {
    console.error('Error showing browser notification:', error);
    return false;
  }
};

// Show a follow-up reminder notification
export const showFollowUpReminder = (followup) => {
  if (!followup) return false;
  
  const options = {
    body: `Follow-up with ${followup.contactName || 'contact'} is due ${formatDueDate(followup.dueDate)}`,
    tag: `followup-${followup._id}`,
    url: `/followups?id=${followup._id}`,
    data: {
      followupId: followup._id,
      type: 'followup-reminder'
    }
  };
  
  // Add priority to title for high or urgent
  let title = `Follow-up Reminder: ${followup.subject}`;
  if (followup.priority === 'high') {
    title += ' (High Priority)';
  } else if (followup.priority === 'urgent') {
    title += ' (URGENT)';
  }
  
  return showNotification(title, options);
};

// Format due date for notification
const formatDueDate = (dateString) => {
  const dueDate = new Date(dateString);
  const today = new Date();
  
  // Set times to midnight for comparison
  today.setHours(0, 0, 0, 0);
  const dueDateMidnight = new Date(dueDate);
  dueDateMidnight.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const diffDays = Math.round((dueDateMidnight - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'} ago`;
  } else if (diffDays === 0) {
    return 'today';
  } else if (diffDays === 1) {
    return 'tomorrow';
  } else {
    return `in ${diffDays} days`;
  }
};

// Export all functions as default object
const browserNotifications = {
  isSupported,
  getPermissionStatus,
  requestPermission,
  showNotification,
  showFollowUpReminder
};

export default browserNotifications;