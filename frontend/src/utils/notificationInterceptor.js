// Notification interceptor for focus mode
import distractionService from '../services/distractionService';

class NotificationInterceptor {
  constructor() {
    this.originalNotification = window.Notification;
    this.originalPermission = window.Notification?.permission;
    this.intercepted = false;
  }

  // Initialize the interceptor
  init() {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser');
      return;
    }

    try {
      // Store original methods
      this.originalRequestPermission = Notification.requestPermission;
      
      // Override global notification methods
      this.interceptNotifications();
      this.interceptPermissionRequests();
      
      // Listen for service worker messages
      this.interceptServiceWorkerNotifications();
      
      this.intercepted = true;
    } catch (error) {
      console.warn('Could not initialize notification interceptor:', error);
      // Continue without notification interception
    }
  }

  // Intercept notification creation
  interceptNotifications() {
    const self = this;
    
    // Create a new Notification constructor
    window.Notification = function(title, options) {
      const status = distractionService.getStatus();
      
      // If blocking is active and this isn't an emergency
      if (status.isBlocking) {
        const isEmergency = self.checkIfEmergency(title, options);
        
        if (!isEmergency) {
          // Queue the notification
          console.log('Notification blocked:', title);
          
          // Return a mock notification object
          return {
            close: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            onclick: null,
            onclose: null,
            onerror: null,
            onshow: null
          };
        }
      }
      
      // Create real notification
      return new self.originalNotification(title, options);
    };
    
    // Copy static properties and methods
    Object.setPrototypeOf(window.Notification, this.originalNotification);
    
    // Use Object.defineProperty for read-only properties
    try {
      Object.defineProperty(window.Notification, 'permission', {
        get: () => this.originalNotification.permission,
        configurable: true
      });
      
      if ('maxActions' in this.originalNotification) {
        Object.defineProperty(window.Notification, 'maxActions', {
          get: () => this.originalNotification.maxActions,
          configurable: true
        });
      }
    } catch (e) {
      console.warn('Could not copy Notification static properties:', e);
    }
  }

  // Intercept permission requests
  interceptPermissionRequests() {
    const self = this;
    
    window.Notification.requestPermission = function() {
      const status = distractionService.getStatus();
      
      // If blocking is active, deny permission requests
      if (status.isBlocking) {
        console.log('Permission request blocked during focus mode');
        return Promise.resolve('denied');
      }
      
      // Otherwise, use original method
      return self.originalRequestPermission.apply(this, arguments);
    };
  }

  // Intercept service worker notifications
  interceptServiceWorkerNotifications() {
    if (!('serviceWorker' in navigator)) return;
    
    // Override the showNotification method if service worker is ready
    navigator.serviceWorker.ready.then(registration => {
      if (registration.active) {
        // Send message to service worker to enable interception
        registration.active.postMessage({
          type: 'ENABLE_NOTIFICATION_INTERCEPTION',
          blocking: distractionService.getStatus().isBlocking
        });
      }
    });
    
    // Listen for notification events from service worker
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data.type === 'NOTIFICATION_REQUEST') {
        const status = distractionService.getStatus();
        
        if (status.isBlocking && !this.checkIfEmergency(event.data.title, event.data.options)) {
          // Tell service worker to block
          event.ports[0].postMessage({ block: true });
        } else {
          // Allow notification
          event.ports[0].postMessage({ block: false });
        }
      }
    });
  }

  // Check if notification is emergency
  checkIfEmergency(title, options) {
    const content = `${title || ''} ${options?.body || ''} ${options?.tag || ''}`.toLowerCase();
    
    // Emergency keywords
    const emergencyKeywords = [
      'urgent',
      'emergency',
      'critical',
      'alert',
      'warning',
      'immediately',
      'asap'
    ];
    
    // Check for emergency keywords
    if (emergencyKeywords.some(keyword => content.includes(keyword))) {
      return true;
    }
    
    // Check against emergency contacts from distraction service
    const status = distractionService.getStatus();
    if (status.emergencyContacts) {
      return status.emergencyContacts.some(contact => 
        content.includes(contact.toLowerCase())
      );
    }
    
    return false;
  }

  // Restore original notification functionality
  restore() {
    if (!this.intercepted) return;
    
    // Restore original Notification constructor
    window.Notification = this.originalNotification;
    window.Notification.requestPermission = this.originalRequestPermission;
    
    // Notify service worker to disable interception
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if (registration.active) {
          registration.active.postMessage({
            type: 'DISABLE_NOTIFICATION_INTERCEPTION'
          });
        }
      });
    }
    
    this.intercepted = false;
  }

  // Update blocking status
  updateBlockingStatus(isBlocking) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if (registration.active) {
          registration.active.postMessage({
            type: 'UPDATE_NOTIFICATION_BLOCKING',
            blocking: isBlocking
          });
        }
      });
    }
  }
}

// Create singleton instance
const notificationInterceptor = new NotificationInterceptor();

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  notificationInterceptor.init();
}

export default notificationInterceptor;