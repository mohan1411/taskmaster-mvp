// Distraction blocking service for focus sessions
class DistractionService {
  constructor() {
    this.originalNotificationPermission = null;
    this.blockedNotifications = [];
    this.blockedSites = [
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'reddit.com',
      'youtube.com',
      'tiktok.com',
      'linkedin.com',
      'twitch.tv',
      'discord.com'
    ];
    this.customBlockedSites = [];
    this.isBlocking = false;
    this.emergencyContacts = [];
    this.tabMonitor = null;
    this.originalTitle = document.title;
  }

  // Start blocking distractions
  async startBlocking(options = {}) {
    const {
      blockNotifications = true,
      blockSites = true,
      emergencyContacts = [],
      customSites = []
    } = options;

    this.isBlocking = true;
    this.emergencyContacts = emergencyContacts;
    this.customBlockedSites = customSites;

    if (blockNotifications) {
      this.blockNotifications();
    }

    if (blockSites) {
      this.startSiteBlocking();
    }

    this.startTabMonitoring();
    this.setupVisibilityTracking();

    return {
      status: 'active',
      blockedNotifications: this.blockedNotifications.length,
      monitoring: true
    };
  }

  // Stop blocking distractions
  async stopBlocking() {
    this.isBlocking = false;
    
    // Restore notifications
    this.restoreNotifications();
    
    // Stop monitoring
    this.stopTabMonitoring();
    this.stopVisibilityTracking();
    
    // Return queued notifications
    const queuedNotifications = [...this.blockedNotifications];
    this.blockedNotifications = [];
    
    return {
      status: 'stopped',
      queuedNotifications
    };
  }

  // Block browser notifications
  blockNotifications() {
    // Store original permission state
    if ('Notification' in window) {
      this.originalNotificationPermission = Notification.permission;
      
      // Override notification constructor
      this._overrideNotification();
      
      // Block permission requests
      this._blockPermissionRequests();
    }

    // Intercept service worker notifications
    this._interceptServiceWorkerNotifications();
  }

  // Override Notification constructor
  _overrideNotification() {
    const self = this;
    const OriginalNotification = window.Notification;
    
    window.Notification = function(title, options) {
      if (self.isBlocking && !self._isEmergency(title, options)) {
        // Queue the notification
        self.blockedNotifications.push({
          title,
          options,
          timestamp: Date.now(),
          type: 'browser'
        });
        
        // Return a fake notification object
        return {
          close: () => {},
          addEventListener: () => {},
          removeEventListener: () => {}
        };
      }
      
      return new OriginalNotification(title, options);
    };
    
    // Copy static properties
    Object.setPrototypeOf(window.Notification, OriginalNotification);
    Object.setPrototypeOf(window.Notification.prototype, OriginalNotification.prototype);
  }

  // Block permission requests during focus
  _blockPermissionRequests() {
    const self = this;
    const originalRequestPermission = Notification.requestPermission;
    
    Notification.requestPermission = function() {
      if (self.isBlocking) {
        return Promise.resolve('denied');
      }
      return originalRequestPermission.apply(this, arguments);
    };
  }

  // Intercept service worker notifications
  _interceptServiceWorkerNotifications() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (this.isBlocking && event.data && event.data.type === 'notification') {
          if (!this._isEmergency(event.data.title, event.data.options)) {
            // Block and queue
            this.blockedNotifications.push({
              ...event.data,
              timestamp: Date.now(),
              type: 'service-worker'
            });
            
            // Acknowledge but don't show
            event.ports[0].postMessage({ blocked: true });
          }
        }
      });
    }
  }

  // Check if notification is emergency
  _isEmergency(title, options) {
    const content = `${title} ${options?.body || ''}`.toLowerCase();
    
    // Check emergency keywords
    const emergencyKeywords = ['urgent', 'emergency', 'critical', 'important', 'boss', 'family'];
    if (emergencyKeywords.some(keyword => content.includes(keyword))) {
      return true;
    }
    
    // Check emergency contacts
    return this.emergencyContacts.some(contact => 
      content.includes(contact.toLowerCase())
    );
  }

  // Restore notification functionality
  restoreNotifications() {
    // Show queued notifications
    if (this.blockedNotifications.length > 0) {
      this._showNotificationSummary();
    }
  }

  // Show summary of blocked notifications
  _showNotificationSummary() {
    const count = this.blockedNotifications.length;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Focus Session Complete', {
        body: `You have ${count} notification${count > 1 ? 's' : ''} waiting`,
        icon: '/icon-192x192.png',
        tag: 'focus-summary',
        requireInteraction: true
      });
    }
  }

  // Start monitoring for distracting sites
  startSiteBlocking() {
    // This would require a browser extension for full functionality
    // For now, we'll monitor tab changes and show warnings
    this._monitorTabFocus();
  }

  // Monitor tab focus changes
  _monitorTabFocus() {
    // Check if page visibility API is available
    if (typeof document.hidden !== 'undefined') {
      document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this));
    }
  }

  // Handle visibility changes
  _handleVisibilityChange() {
    if (!document.hidden && this.isBlocking) {
      // User returned to tab, check if they were distracted
      this._checkForDistraction();
    }
  }

  // Start tab monitoring
  startTabMonitoring() {
    let lastActiveTime = Date.now();
    let inactiveTime = 0;
    
    this.tabMonitor = setInterval(() => {
      if (document.hidden) {
        inactiveTime += 5000; // 5 seconds
        
        // If inactive for more than 30 seconds, show reminder
        if (inactiveTime > 30000 && this.isBlocking) {
          this._showFocusReminder();
        }
      } else {
        inactiveTime = 0;
        lastActiveTime = Date.now();
      }
    }, 5000);
  }

  // Stop tab monitoring
  stopTabMonitoring() {
    if (this.tabMonitor) {
      clearInterval(this.tabMonitor);
      this.tabMonitor = null;
    }
  }

  // Show focus reminder
  _showFocusReminder() {
    // Update page title as a reminder
    if (document.title !== '🎯 Stay Focused!') {
      this.originalTitle = document.title;
      document.title = '🎯 Stay Focused!';
      
      // Restore original title after 5 seconds
      setTimeout(() => {
        document.title = this.originalTitle;
      }, 5000);
    }
  }

  // Setup visibility tracking
  setupVisibilityTracking() {
    this.visibilityLog = [];
    
    document.addEventListener('visibilitychange', () => {
      this.visibilityLog.push({
        timestamp: Date.now(),
        hidden: document.hidden
      });
    });
  }

  // Stop visibility tracking
  stopVisibilityTracking() {
    // Calculate total distraction time
    let totalDistractedTime = 0;
    
    for (let i = 0; i < this.visibilityLog.length - 1; i++) {
      if (this.visibilityLog[i].hidden) {
        const duration = this.visibilityLog[i + 1].timestamp - this.visibilityLog[i].timestamp;
        totalDistractedTime += duration;
      }
    }
    
    return {
      totalDistractedTime: Math.round(totalDistractedTime / 1000), // seconds
      distractionCount: this.visibilityLog.filter(log => log.hidden).length
    };
  }

  // Check for distraction
  _checkForDistraction() {
    // This would integrate with browser history API if available
    // For now, we'll just log the return
    console.log('User returned to focus tab');
  }

  // Get blocking status
  getStatus() {
    return {
      isBlocking: this.isBlocking,
      blockedNotifications: this.blockedNotifications.length,
      emergencyContacts: this.emergencyContacts,
      blockedSites: [...this.blockedSites, ...this.customBlockedSites]
    };
  }

  // Add custom site to block list
  addBlockedSite(site) {
    if (!this.customBlockedSites.includes(site)) {
      this.customBlockedSites.push(site);
    }
  }

  // Remove custom site from block list
  removeBlockedSite(site) {
    this.customBlockedSites = this.customBlockedSites.filter(s => s !== site);
  }

  // Emergency override
  emergencyOverride() {
    this.stopBlocking();
    return {
      status: 'overridden',
      message: 'Emergency override activated. Focus mode disabled.'
    };
  }
}

// Create singleton instance
const distractionService = new DistractionService();

export default distractionService;