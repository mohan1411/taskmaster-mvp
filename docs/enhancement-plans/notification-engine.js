/**
 * NotificationEngine.js
 * 
 * Core component of the Smart Follow-up Reminders system
 * Responsible for checking due follow-ups and sending notifications
 */

const Followup = require('../models/followupModel');
const User = require('../models/userModel');
const Settings = require('../models/settingsModel');
const emailService = require('./emailService');
const logger = require('../utils/logger');

/**
 * Notification Engine for Follow-up reminders
 */
class NotificationEngine {
  constructor() {
    this.channels = {
      'in-app': this.sendInAppNotification,
      'email': this.sendEmailNotification,
      'browser': this.sendBrowserNotification
    };
  }

  /**
   * Check for follow-ups that need reminders and process them
   */
  async processReminders() {
    logger.info('Starting follow-up reminder processing');
    
    try {
      // Get all active follow-ups
      const followups = await Followup.find({
        status: { $in: ['pending', 'in-progress'] },
        'reminderSettings.enabled': true
      }).populate('user');
      
      logger.info(`Found ${followups.length} active follow-ups to check for reminders`);
      
      const now = new Date();
      let remindersProcessed = 0;
      
      // Process each follow-up
      for (const followup of followups) {
        const remindersToSend = this.calculateDueReminders(followup, now);
        
        if (remindersToSend.length > 0) {
          // Get user notification preferences
          const userSettings = await Settings.findOne({ user: followup.user._id });
          
          // Send reminders on enabled channels
          for (const reminder of remindersToSend) {
            for (const channel of reminder.channels) {
              // Check if user has enabled this channel
              if (this.isChannelEnabled(channel, userSettings)) {
                await this.channels[channel](followup, reminder, followup.user);
                
                // Mark reminder as sent
                reminder.sent = true;
                reminder.sentAt = now;
              }
            }
          }
          
          // Update the follow-up with sent reminders
          followup.reminderSettings.lastReminderSent = now;
          await followup.save();
          
          remindersProcessed += remindersToSend.length;
        }
      }
      
      logger.info(`Processed ${remindersProcessed} reminders`);
      return remindersProcessed;
      
    } catch (error) {
      logger.error('Error processing follow-up reminders:', error);
      throw error;
    }
  }
  
  /**
   * Calculate which reminders are due for a follow-up
   * @param {Object} followup - The follow-up object
   * @param {Date} currentTime - Current time
   * @returns {Array} - Array of due reminders
   */
  calculateDueReminders(followup, currentTime) {
    const dueReminders = [];
    
    if (!followup.reminderSettings || !followup.reminderSettings.schedule) {
      return dueReminders;
    }
    
    for (const reminder of followup.reminderSettings.schedule) {
      if (reminder.sent) continue;
      
      // Calculate when this reminder should trigger
      const dueDate = new Date(followup.dueDate);
      let triggerTime = new Date(dueDate);
      
      switch (reminder.triggerTime.unit) {
        case 'minutes':
          triggerTime.setMinutes(triggerTime.getMinutes() - reminder.triggerTime.value);
          break;
        case 'hours':
          triggerTime.setHours(triggerTime.getHours() - reminder.triggerTime.value);
          break;
        case 'days':
          triggerTime.setDate(triggerTime.getDate() - reminder.triggerTime.value);
          break;
      }
      
      // Adjust timing based on priority
      if (followup.priority === 'high' || followup.priority === 'urgent') {
        // Send high priority reminders 20% earlier
        const timeAdjustment = (dueDate - triggerTime) * 0.2;
        triggerTime = new Date(triggerTime.getTime() - timeAdjustment);
      }
      
      // Check if the reminder is due
      if (triggerTime <= currentTime) {
        dueReminders.push(reminder);
      }
    }
    
    return dueReminders;
  }
  
  /**
   * Check if notification channel is enabled in user settings
   * @param {String} channel - Notification channel
   * @param {Object} userSettings - User settings object
   * @returns {Boolean} - Whether channel is enabled
   */
  isChannelEnabled(channel, userSettings) {
    if (!userSettings || !userSettings.notifications) {
      return true; // Default to enabled if settings not found
    }
    
    switch (channel) {
      case 'in-app':
        return true; // In-app is always enabled
      case 'email':
        return userSettings.notifications.email && userSettings.notifications.email.enabled;
      case 'browser':
        return userSettings.notifications.browser && userSettings.notifications.browser.enabled;
      default:
        return false;
    }
  }
  
  /**
   * Send in-app notification
   * @param {Object} followup - Follow-up object
   * @param {Object} reminder - Reminder object
   * @param {Object} user - User object
   */
  async sendInAppNotification(followup, reminder, user) {
    try {
      logger.info(`Sending in-app notification for follow-up: ${followup._id}`);
      
      // Implementation would depend on your in-app notification system
      // This is a placeholder for the actual implementation
      
      return {
        success: true,
        channel: 'in-app'
      };
    } catch (error) {
      logger.error(`Error sending in-app notification for follow-up ${followup._id}:`, error);
      return {
        success: false,
        channel: 'in-app',
        error
      };
    }
  }
  
  /**
   * Send email notification
   * @param {Object} followup - Follow-up object
   * @param {Object} reminder - Reminder object
   * @param {Object} user - User object
   */
  async sendEmailNotification(followup, reminder, user) {
    try {
      logger.info(`Sending email notification for follow-up: ${followup._id}`);
      
      const emailContent = this.generateEmailContent(followup, user);
      
      await emailService.sendEmail({
        to: user.email,
        subject: `Follow-up Reminder: ${followup.subject}`,
        html: emailContent
      });
      
      return {
        success: true,
        channel: 'email'
      };
    } catch (error) {
      logger.error(`Error sending email notification for follow-up ${followup._id}:`, error);
      return {
        success: false,
        channel: 'email',
        error
      };
    }
  }
  
  /**
   * Send browser notification
   * @param {Object} followup - Follow-up object
   * @param {Object} reminder - Reminder object
   * @param {Object} user - User object
   */
  async sendBrowserNotification(followup, reminder, user) {
    try {
      logger.info(`Sending browser notification for follow-up: ${followup._id}`);
      
      // This would be implemented through a WebSocket connection to the client
      // This is a placeholder for the actual implementation
      
      return {
        success: true,
        channel: 'browser'
      };
    } catch (error) {
      logger.error(`Error sending browser notification for follow-up ${followup._id}:`, error);
      return {
        success: false,
        channel: 'browser',
        error
      };
    }
  }
  
  /**
   * Generate email content for notification
   * @param {Object} followup - Follow-up object
   * @param {Object} user - User object
   * @returns {String} - HTML content for email
   */
  generateEmailContent(followup, user) {
    const dueDate = new Date(followup.dueDate).toLocaleDateString();
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const followupUrl = `${appUrl}/followups/${followup._id}`;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Follow-up Reminder</h2>
        <p>Hello ${user.name},</p>
        <p>This is a reminder about a follow-up that requires your attention:</p>
        
        <div style="border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin: 15px 0;">
          <h3>${followup.subject}</h3>
          <p><strong>Contact:</strong> ${followup.contactName} (${followup.contactEmail})</p>
          <p><strong>Due Date:</strong> ${dueDate}</p>
          <p><strong>Priority:</strong> ${followup.priority}</p>
          ${followup.notes ? `<p><strong>Notes:</strong> ${followup.notes}</p>` : ''}
        </div>
        
        <p>
          <a href="${followupUrl}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View Follow-up
          </a>
        </p>
        
        <p>Thank you,<br>TaskMaster</p>
      </div>
    `;
  }
}

module.exports = new NotificationEngine();
