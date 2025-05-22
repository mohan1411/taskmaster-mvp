// controllers/reminderController.js
const Followup = require('../models/followupModel');
const User = require('../models/userModel');
const NotificationModel = require('../models/notificationModel');
const nodemailer = require('nodemailer');
const config = require('../config/config');

/**
 * Process reminders for follow-ups
 * This should be called by a scheduled job (e.g., cron) to check for follow-ups 
 * that need reminders sent
 */
const processReminders = async () => {
  try {
    console.log('Processing follow-up reminders...');
    
    // Get all active follow-ups (pending or in-progress)
    const activeFollowups = await Followup.find({
      status: { $in: ['pending', 'in-progress'] },
      'reminderSettings.enabled': true
    }).populate('user', 'email name notificationPreferences');
    
    console.log(`Found ${activeFollowups.length} active follow-ups to process`);
    
    const now = new Date();
    let remindersSent = 0;
    
    for (const followup of activeFollowups) {
      const dueDate = new Date(followup.dueDate);
      const schedule = followup.reminderSettings?.schedule || [];
      
      // Skip if no schedule defined
      if (schedule.length === 0) continue;
      
      // Process each reminder in the schedule
      for (const reminder of schedule) {
        const { time, notificationType } = reminder;
        
        // Calculate when this reminder should be sent
        const reminderTime = calculateReminderTime(dueDate, time, followup.priority, followup.reminderSettings.priorityBased);
        
        // Check if reminder should be sent now
        if (isTimeToSendReminder(now, reminderTime, followup.lastReminderSent)) {
          try {
            // Send the reminder
            await sendReminder(followup, notificationType);
            remindersSent++;
            
            // Update lastReminderSent
            followup.reminderSettings.lastReminderSent = now;
            await followup.save();
            
            console.log(`Sent ${notificationType} reminder for follow-up ${followup._id}`);
          } catch (err) {
            console.error(`Error sending reminder for follow-up ${followup._id}:`, err);
          }
        }
      }
    }
    
    console.log(`Processed ${activeFollowups.length} follow-ups, sent ${remindersSent} reminders`);
    return { success: true, processed: activeFollowups.length, sent: remindersSent };
  } catch (error) {
    console.error('Error processing reminders:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate when a reminder should be sent based on the due date and time string
 * @param {Date} dueDate - The due date of the follow-up
 * @param {String} timeStr - Time string (e.g., "1d" for 1 day before, "2h" for 2 hours before)
 * @param {String} priority - The follow-up priority
 * @param {Boolean} priorityBased - Whether to adjust timing based on priority
 * @returns {Date} - The date/time when the reminder should be sent
 */
const calculateReminderTime = (dueDate, timeStr, priority, priorityBased) => {
  const value = parseInt(timeStr.slice(0, -1));
  const unit = timeStr.slice(-1);
  
  let adjustedValue = value;
  
  // Adjust timing based on priority if enabled
  if (priorityBased) {
    if (priority === 'high') {
      // For high priority, send reminders 50% earlier
      adjustedValue = Math.round(value * 1.5);
    } else if (priority === 'urgent') {
      // For urgent priority, send reminders twice as early
      adjustedValue = value * 2;
    }
  }
  
  // Create a new date object from the due date
  const reminderTime = new Date(dueDate);
  
  // Subtract the appropriate amount of time
  if (unit === 'd') {
    reminderTime.setDate(reminderTime.getDate() - adjustedValue);
  } else if (unit === 'h') {
    reminderTime.setHours(reminderTime.getHours() - adjustedValue);
  } else if (unit === 'm') {
    reminderTime.setMinutes(reminderTime.getMinutes() - adjustedValue);
  }
  
  return reminderTime;
};

/**
 * Check if it's time to send a reminder
 * @param {Date} now - Current time
 * @param {Date} reminderTime - When the reminder should be sent
 * @param {Date} lastReminderSent - When the last reminder was sent
 * @returns {Boolean} - Whether the reminder should be sent now
 */
const isTimeToSendReminder = (now, reminderTime, lastReminderSent) => {
  // If the reminder time is in the past (we've reached or passed when it should be sent)
  if (reminderTime <= now) {
    // If no reminder has been sent yet, or if the last reminder was sent before this reminder time
    if (!lastReminderSent || new Date(lastReminderSent) < reminderTime) {
      return true;
    }
  }
  
  return false;
};

/**
 * Send a reminder notification
 * @param {Object} followup - The follow-up object
 * @param {String} notificationType - Type of notification to send (in-app, email, browser)
 */
const sendReminder = async (followup, notificationType) => {
  const user = followup.user;
  
  if (!user) {
    throw new Error('User not found for follow-up');
  }
  
  // Format the due date
  const dueDate = new Date(followup.dueDate);
  const formattedDueDate = dueDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Create notification content
  const title = `Follow-up Reminder: ${followup.subject}`;
  const message = `You have a follow-up due on ${formattedDueDate} with ${followup.contactName}: ${followup.reason || followup.subject}`;
  
  // Build priority indicator
  let priorityText = '';
  if (followup.priority === 'high') {
    priorityText = ' (High Priority)';
  } else if (followup.priority === 'urgent') {
    priorityText = ' (URGENT)';
  }
  
  // Add priority to title if high or urgent
  const titleWithPriority = followup.priority === 'high' || followup.priority === 'urgent' 
    ? `${title}${priorityText}`
    : title;
  
  // Send the appropriate notification type
  switch (notificationType) {
    case 'in-app':
      await createInAppNotification(user._id, titleWithPriority, message, followup._id);
      break;
    case 'email':
      await sendEmailNotification(user.email, titleWithPriority, message, followup);
      break;
    case 'browser':
      // Browser notifications would be handled by the frontend
      // Here we just create a notification record that the frontend can check
      await createInAppNotification(user._id, titleWithPriority, message, followup._id, 'browser');
      break;
    case 'all':
      // Send to all available channels
      await createInAppNotification(user._id, titleWithPriority, message, followup._id);
      try {
        await sendEmailNotification(user.email, titleWithPriority, message, followup);
      } catch (err) {
        console.error('Error sending email notification:', err);
        // Continue even if email fails
      }
      await createInAppNotification(user._id, titleWithPriority, message, followup._id, 'browser');
      break;
    default:
      await createInAppNotification(user._id, titleWithPriority, message, followup._id);
  }
};

/**
 * Create an in-app notification
 * @param {String} userId - User ID
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {String} followupId - Follow-up ID
 * @param {String} type - Notification type
 */
const createInAppNotification = async (userId, title, message, followupId, type = 'in-app') => {
  try {
    await NotificationModel.create({
      user: userId,
      title,
      message,
      type,
      referenceType: 'followup',
      referenceId: followupId,
      read: false
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Send an email notification
 * @param {String} email - Recipient email
 * @param {String} subject - Email subject
 * @param {String} message - Email message
 * @param {Object} followup - Follow-up object
 */
const sendEmailNotification = async (email, subject, message, followup) => {
  // Check for email configuration
  if (!config.email || !config.email.host || !config.email.user || !config.email.pass) {
    console.error('Email configuration is missing');
    throw new Error('Email configuration is missing');
  }
  
  // Format the due date
  const dueDate = new Date(followup.dueDate);
  const formattedDueDate = dueDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port || 587,
    secure: config.email.secure || false,
    auth: {
      user: config.email.user,
      pass: config.email.pass
    }
  });
  
  // Format the email
  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${subject}</h2>
      <p>${message}</p>
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
        <p><strong>Follow-up Details:</strong></p>
        <p><strong>Subject:</strong> ${followup.subject}</p>
        <p><strong>Contact:</strong> ${followup.contactName || 'N/A'} ${followup.contactEmail ? `(${followup.contactEmail})` : ''}</p>
        <p><strong>Due:</strong> ${formattedDueDate}</p>
        <p><strong>Priority:</strong> ${followup.priority}</p>
        ${followup.reason ? `<p><strong>Reason:</strong> ${followup.reason}</p>` : ''}
        ${followup.keyPoints && followup.keyPoints.length > 0 ? 
          `<p><strong>Key Points:</strong></p>
           <ul>${followup.keyPoints.map(point => `<li>${point}</li>`).join('')}</ul>` 
          : ''}
      </div>
      <div style="margin-top: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">
        <p>This is an automated reminder from TaskMaster. Please do not reply to this email.</p>
        <p>To view this follow-up in TaskMaster, <a href="${config.appUrl}/followups?id=${followup._id}">click here</a>.</p>
      </div>
    </div>
  `;
  
  // Send the email
  const info = await transporter.sendMail({
    from: `"TaskMaster" <${config.email.from || config.email.user}>`,
    to: email,
    subject,
    text: message, // Plain text version
    html: htmlMessage // HTML version
  });
  
  console.log(`Email sent: ${info.messageId}`);
  return info;
};

/**
 * Manually trigger reminders for a specific follow-up
 * @param {String} followupId - Follow-up ID
 * @param {String} notificationType - Type of notification to send
 */
const sendManualReminder = async (req, res) => {
  try {
    const { followupId } = req.params;
    const { notificationType } = req.body;
    
    // Find the follow-up
    const followup = await Followup.findOne({
      _id: followupId,
      user: req.user._id
    }).populate('user', 'email name notificationPreferences');
    
    if (!followup) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }
    
    // Send the reminder
    await sendReminder(followup, notificationType || 'in-app');
    
    // Update lastReminderSent
    followup.reminderSettings = followup.reminderSettings || {};
    followup.reminderSettings.lastReminderSent = new Date();
    await followup.save();
    
    res.json({ 
      message: 'Reminder sent successfully',
      success: true
    });
  } catch (error) {
    console.error('Error sending manual reminder:', error);
    res.status(500).json({ 
      message: 'Failed to send reminder',
      error: error.message
    });
  }
};

/**
 * Get reminder settings for a follow-up
 * @param {String} followupId - Follow-up ID
 */
const getReminderSettings = async (req, res) => {
  try {
    const { followupId } = req.params;
    
    // Find the follow-up
    const followup = await Followup.findOne({
      _id: followupId,
      user: req.user._id
    });
    
    if (!followup) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }
    
    // Return the reminder settings
    const reminderSettings = followup.reminderSettings || {
      enabled: true,
      schedule: [{ time: '1d', notificationType: 'in-app' }],
      priorityBased: true
    };
    
    res.json(reminderSettings);
  } catch (error) {
    console.error('Error getting reminder settings:', error);
    res.status(500).json({ 
      message: 'Failed to get reminder settings',
      error: error.message
    });
  }
};

/**
 * Snooze a follow-up by adjusting its due date
 * @param {String} followupId - Follow-up ID
 * @param {Number} days - Number of days to snooze
 */
const snoozeFollowUp = async (req, res) => {
  try {
    const { followupId } = req.params;
    const { days = 1 } = req.body;
    
    // Find the follow-up
    const followup = await Followup.findOne({
      _id: followupId,
      user: req.user._id
    });
    
    if (!followup) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }
    
    // Calculate new due date
    const currentDueDate = new Date(followup.dueDate);
    const newDueDate = new Date(currentDueDate);
    newDueDate.setDate(currentDueDate.getDate() + parseInt(days));
    
    // Update the due date
    followup.dueDate = newDueDate;
    
    // Reset lastReminderSent to ensure reminders will be sent again
    if (followup.reminderSettings) {
      followup.reminderSettings.lastReminderSent = null;
    }
    
    // Save the updated follow-up
    const updatedFollowup = await followup.save();
    
    // Create a notification about the snooze
    await createInAppNotification(
      req.user._id, 
      'Follow-up Snoozed', 
      `Follow-up "${followup.subject}" has been snoozed until ${newDueDate.toLocaleDateString()}`, 
      followupId
    );
    
    res.json({ 
      message: 'Follow-up snoozed successfully',
      success: true,
      followup: updatedFollowup
    });
  } catch (error) {
    console.error('Error snoozing follow-up:', error);
    res.status(500).json({ 
      message: 'Failed to snooze follow-up',
      error: error.message
    });
  }
};

/**
 * Update reminder settings for a follow-up
 * @param {String} followupId - Follow-up ID
 * @param {Object} settings - Reminder settings
 */
const updateReminderSettings = async (req, res) => {
  try {
    const { followupId } = req.params;
    const { reminderSettings } = req.body;
    
    // Find the follow-up
    const followup = await Followup.findOne({
      _id: followupId,
      user: req.user._id
    });
    
    if (!followup) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }
    
    // Update the reminder settings
    followup.reminderSettings = reminderSettings;
    await followup.save();
    
    res.json({ 
      message: 'Reminder settings updated successfully',
      success: true,
      reminderSettings
    });
  } catch (error) {
    console.error('Error updating reminder settings:', error);
    res.status(500).json({ 
      message: 'Failed to update reminder settings',
      error: error.message
    });
  }
};

/**
 * Manually trigger the reminder processing job
 * For testing/debugging purposes
 */
const triggerReminderProcessing = async (req, res) => {
  try {
    const result = await processReminders();
    res.json(result);
  } catch (error) {
    console.error('Error triggering reminder processing:', error);
    res.status(500).json({ 
      message: 'Failed to process reminders',
      error: error.message
    });
  }
};

module.exports = {
  processReminders,
  sendManualReminder,
  getReminderSettings,
  updateReminderSettings,
  triggerReminderProcessing,
  snoozeFollowUp
};
