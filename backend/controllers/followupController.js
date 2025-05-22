// controllers/followupController.js
const Followup = require('../models/followupModel');
const Email = require('../models/emailModel');
const config = require('../config/config');
const { getEmailWithBody } = require('../utils/emailUtils');
const { followupExists, createFollowupIfNotExists } = require('../utils/followupUtils');
const { getOpenAI } = require('../utils/openaiHelper');

/**
 * Detect if an email needs follow-up using OpenAI
 * @param {Object} email - Email object with body content
 * @returns {Promise<Object>} - Follow-up analysis results
 */
const detectFollowUpNeeds = async (email) => {
  try {
    console.log('Analyzing email for follow-up needs:', email._id);

    // Check for valid API key
    if (!config.openaiApiKey) {
      console.error('ERROR: OpenAI API key is not configured');
      return { success: false, error: 'OpenAI API key is not configured' };
    }
    
    // Get the OpenAI client
    const openai = getOpenAI();
    if (!openai) {
      console.error('ERROR: OpenAI client could not be initialized');
      return { success: false, error: 'OpenAI client could not be initialized' };
    }

    // Format email context
    const emailContext = `
    From: ${email.sender.name} <${email.sender.email}>
    Subject: ${email.subject}
    Date: ${email.receivedAt}
    
    ${email.body || ''}
    `;

    // Create prompt for follow-up detection
    const prompt = `
    Analyze this email to determine if it requires a follow-up response. Check for:
    1. Explicit questions that need answers
    2. Requests for actions, information, or feedback
    3. Deadlines or timeframes mentioned for a response
    4. Implied expectations of a reply

    If a follow-up is needed, provide:
    1. A brief reason why follow-up is needed
    2. Suggested follow-up date (YYYY-MM-DD format)
    3. Key points to address in the follow-up

    Format the response as a valid JSON object:
    {
      "needsFollowUp": true/false,
      "reason": "Brief explanation of why follow-up is needed",
      "suggestedDate": "YYYY-MM-DD",
      "keyPoints": ["Point 1", "Point 2", ...]
    }

    IMPORTANT: Your response must be a valid JSON object. Do not include any text before or after the JSON object.
    If no follow-up is needed, still provide the full JSON object with needsFollowUp set to false.

    Email: """
    ${emailContext}
    """
    `;

    console.log('Calling OpenAI API...');
    
    try {
      // Call OpenAI API
      const completion = await openai.createChatCompletion({
        model: "gpt-4o-mini", // Using newer model
        messages: [
          { role: "system", content: "You are a helpful assistant that analyzes emails for follow-up needs." },
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.2,
      });

      console.log('OpenAI API call completed');
      
      // Extract and parse response
      const responseText = completion.data.choices[0].message.content.trim();
      console.log('Raw API response:', responseText);
      
      let followUpAnalysis = {};
      
      // Check if response is valid JSON
      if (responseText.startsWith('{') && responseText.endsWith('}')) {
        try {
          followUpAnalysis = JSON.parse(responseText);
          console.log('Successfully parsed JSON directly');
        } catch (parseError) {
          console.error('Error parsing direct JSON:', parseError.message);
          // Continue to alternative parsing methods
        }
      }
      
      // If direct parsing failed, try to extract JSON from text
      if (!followUpAnalysis.needsFollowUp) {
        console.log('Trying alternative JSON extraction...');
        try {
          const jsonMatch = responseText.match(/\{[^\{\}]*"needsFollowUp"[^\{\}]*\}/s);
          if (jsonMatch) {
            followUpAnalysis = JSON.parse(jsonMatch[0]);
            console.log('Successfully extracted and parsed JSON from response');
          }
        } catch (matchError) {
          console.error('Error extracting JSON pattern:', matchError.message);
          // Continue to fallback
        }
      }
      
      // If all parsing fails, create a fallback analysis
      if (!followUpAnalysis.needsFollowUp) {
        console.log('Using fallback analysis');
        followUpAnalysis = {
          "needsFollowUp": false,
          "reason": "Could not determine follow-up needs automatically",
          "suggestedDate": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          "keyPoints": ["Review email manually to determine if follow-up is needed"]
        };
      }
      
      console.log(`Follow-up analysis: ${followUpAnalysis.needsFollowUp ? 'Needs follow-up' : 'No follow-up needed'}`);
      return { success: true, followUpAnalysis };
    } catch (apiError) {
      console.error('OpenAI API error:', apiError.message);
      if (apiError.response) {
        console.error('API response status:', apiError.response.status);
        console.error('API response:', apiError.response.data);
        return { 
          success: false, 
          error: `OpenAI API error: ${apiError.response.status} - ${JSON.stringify(apiError.response.data)}` 
        };
      }
      return { success: false, error: `OpenAI API error: ${apiError.message}` };
    }
  } catch (error) {
    console.error('Follow-up detection error:', error.message);
    return { success: false, error: `Follow-up detection error: ${error.message}` };
  }
};

// @desc    Get all follow-ups for a user
// @route   GET /api/followups
// @access  Private
const getFollowUps = async (req, res) => {
  try {
    // Parse query parameters
    const status = req.query.status || 'pending,in-progress';
    const statusArray = status.split(',');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build the query
    const query = {
      user: req.user._id,
      status: { $in: statusArray }
    };
    
    // Add priority filter if provided
    if (req.query.priority) {
      const priorityArray = req.query.priority.split(',');
      query.priority = { $in: priorityArray };
    }

    // Add due date filter if provided
    if (req.query.dueBefore) {
      query.dueDate = { ...query.dueDate, $lte: new Date(req.query.dueBefore) };
    }
    
    if (req.query.dueAfter) {
      query.dueDate = { ...query.dueDate, $gte: new Date(req.query.dueAfter) };
    }

    // Execute the query with pagination
    const followups = await Followup.find(query)
      .sort({ dueDate: 1, priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Followup.countDocuments(query);
    
    res.json({
      followups,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get follow-up by ID
// @route   GET /api/followups/:id
// @access  Private
const getFollowUpById = async (req, res) => {
  try {
    const followup = await Followup.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (followup) {
      res.json(followup);
    } else {
      res.status(404).json({ message: 'Follow-up not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new follow-up
// @route   POST /api/followups
// @access  Private
const createFollowUp = async (req, res) => {
  try {
    const { 
      emailId, 
      threadId, 
      subject, 
      contactName, 
      contactEmail, 
      priority, 
      dueDate, 
      notes, 
      reason,
      keyPoints 
    } = req.body;

    const followup = await Followup.create({
      user: req.user._id,
      emailId,
      threadId,
      subject,
      contactName,
      contactEmail,
      priority: priority || 'medium',
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default: 7 days from now
      notes,
      reason,
      keyPoints: keyPoints || [],
      status: 'pending',
      aiGenerated: false
    });

    if (followup) {
      // Update the email to mark that it needs follow-up
      if (emailId) {
        await Email.findOneAndUpdate(
          { messageId: emailId, user: req.user._id },
          { needsFollowUp: true, followUpDueDate: dueDate }
        );
      }
      
      res.status(201).json(followup);
    } else {
      res.status(400).json({ message: 'Invalid follow-up data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a follow-up
// @route   PUT /api/followups/:id
// @access  Private
const updateFollowUp = async (req, res) => {
  try {
    console.log(`UPDATE FOLLOWUP: Request for followup ${req.params.id} by user ${req.user._id}`);
    console.log('UPDATE FOLLOWUP: Request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      status, 
      priority, 
      dueDate, 
      notes, 
      completionNotes, 
      relatedTasks,
      reminderSettings 
    } = req.body;

    const followup = await Followup.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!followup) {
      console.log(`UPDATE FOLLOWUP: Follow-up ${req.params.id} not found for user ${req.user._id}`);
      return res.status(404).json({ message: 'Follow-up not found' });
    }

    console.log('UPDATE FOLLOWUP: Current followup data:', JSON.stringify(followup.toObject(), null, 2));

    // Update follow-up fields if provided
    if (status) {
      followup.status = status;
      // If marking as completed, set completedAt date
      if (status === 'completed' && !followup.completedAt) {
        followup.completedAt = new Date();
      } else if (status !== 'completed') {
        followup.completedAt = null;
      }
    }
    if (priority) followup.priority = priority;
    if (dueDate) followup.dueDate = dueDate;
    if (notes) followup.notes = notes;
    if (completionNotes) followup.completionNotes = completionNotes;
    if (relatedTasks) followup.relatedTasks = relatedTasks;
    if (reminderSettings) {
      console.log('UPDATE FOLLOWUP: Updating reminder settings:', JSON.stringify(reminderSettings, null, 2));
      // Update reminder settings
      followup.reminderSettings = {
        ...followup.reminderSettings,
        ...reminderSettings
      };
      console.log('UPDATE FOLLOWUP: New reminder settings:', JSON.stringify(followup.reminderSettings, null, 2));
    }

    console.log('UPDATE FOLLOWUP: Saving followup...');
    const updatedFollowup = await followup.save();
    console.log('UPDATE FOLLOWUP: Successfully saved followup');
    
    // Update the email if follow-up status changed
    if (status) {
      await Email.findOneAndUpdate(
        { messageId: followup.emailId, user: req.user._id },
        { 
          needsFollowUp: status !== 'completed' && status !== 'ignored',
          followUpStatus: status
        }
      );
    }
    
    console.log('UPDATE FOLLOWUP: Returning updated followup:', JSON.stringify(updatedFollowup.toObject(), null, 2));
    res.json(updatedFollowup);
  } catch (error) {
    console.error('UPDATE FOLLOWUP: Error updating followup:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a follow-up
// @route   DELETE /api/followups/:id
// @access  Private
const deleteFollowUp = async (req, res) => {
  try {
    const followup = await Followup.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!followup) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }

    // Get the email ID before removing the follow-up
    const emailId = followup.emailId;
    
    // Delete the follow-up
    await Followup.findByIdAndDelete(followup._id);
    
    // Check if there are any other follow-ups for this email
    const otherFollowups = await Followup.findOne({
      user: req.user._id,
      emailId: emailId
    });
    
    // Find the email
    const email = await Email.findOne({ 
      messageId: emailId,
      user: req.user._id
    });
    
    if (email) {
      // Update the email status based on whether other follow-ups exist
      email.needsFollowUp = !!otherFollowups;
      if (!otherFollowups) {
        email.followUpDueDate = null;
        email.followUpStatus = null;
      }
      await email.save();
      
      console.log(`Updated email ${email._id} (${email.subject}): needsFollowUp = ${email.needsFollowUp}`);
    }
    
    res.json({ 
      message: 'Follow-up removed',
      emailUpdated: !!email,
      needsFollowUp: otherFollowups ? true : false
    });
  } catch (error) {
    console.error('Error in deleteFollowUp:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Detect follow-up needs for an email
// @route   POST /api/emails/:id/detect-followup
// @access  Private
const detectFollowUp = async (req, res) => {
  try {
    // Find the email
    const email = await Email.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Check for valid OpenAI API key
    if (!config.openaiApiKey) {
      return res.status(500).json({ 
        message: 'OpenAI API key is not configured. Follow-up detection is unavailable.'
      });
    }
    
    // Get email body from getEmailWithBody utility
    const emailWithBody = await getEmailWithBody(email, req.user._id);
    
    if (!emailWithBody.success) {
      return res.status(500).json({ 
        message: 'Failed to retrieve email content', 
        error: emailWithBody.error 
      });
    }
    
    // Detect follow-up needs
    const result = await detectFollowUpNeeds(emailWithBody.email);
    
    if (!result.success) {
      return res.status(500).json({ 
        message: 'Failed to detect follow-up needs', 
        error: result.error 
      });
    }
    
    const followUpAnalysis = result.followUpAnalysis;
    
    // Update email with follow-up info
    if (followUpAnalysis.needsFollowUp) {
      email.needsFollowUp = true;
      email.followUpDueDate = new Date(followUpAnalysis.suggestedDate);
      await email.save();
      
      // Check if follow-up already exists before creating
      const followupData = {
        user: req.user._id,
        emailId: email.messageId,
        threadId: email.threadId,
        subject: email.subject,
        contactName: email.sender.name,
        contactEmail: email.sender.email,
        status: 'pending',
        dueDate: new Date(followUpAnalysis.suggestedDate),
        notes: followUpAnalysis.keyPoints.join('\n'),
        reason: followUpAnalysis.reason,
        keyPoints: followUpAnalysis.keyPoints,
        aiGenerated: true
      };
      
      // Create follow-up only if it doesn't already exist
      const followup = await createFollowupIfNotExists(followupData);
      
      res.json({
        ...followUpAnalysis,
        followup
      });
    } else {
      email.needsFollowUp = false;
      await email.save();
      
      res.json(followUpAnalysis);
    }
  } catch (error) {
    console.error('Follow-up detection error:', error);
    res.status(500).json({ 
      message: 'Server error during follow-up detection', 
      error: error.message 
    });
  }
};

// @desc    Check for due follow-ups
// @route   GET /api/followups/check-due
// @access  Private
const checkDueFollowUps = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find follow-ups due today or overdue
    const dueFollowUps = await Followup.find({
      user: req.user._id,
      status: { $in: ['pending', 'in-progress'] },
      dueDate: { $lte: today }
    }).sort({ dueDate: 1 });
    
    res.json({
      count: dueFollowUps.length,
      followups: dueFollowUps
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get follow-up analytics
// @route   GET /api/followups/analytics
// @access  Private
const getFollowUpAnalytics = async (req, res) => {
  try {
    // Status counts
    const statusCounts = await Followup.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Due this week
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);
    
    const dueThisWeek = await Followup.countDocuments({
      user: req.user._id,
      status: { $in: ['pending', 'in-progress'] },
      dueDate: { $gte: today, $lt: endOfWeek }
    });
    
    // Overdue count
    const overdueCount = await Followup.countDocuments({
      user: req.user._id,
      status: { $in: ['pending', 'in-progress'] },
      dueDate: { $lt: today }
    });
    
    // Completion rate (last 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const completedCount = await Followup.countDocuments({
      user: req.user._id,
      status: 'completed',
      updatedAt: { $gte: thirtyDaysAgo }
    });
    
    const totalRecentCount = await Followup.countDocuments({
      user: req.user._id,
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    const completionRate = totalRecentCount > 0 ? (completedCount / totalRecentCount) * 100 : 0;
    
    // Average completion time (days between creation and completion)
    const completionTimes = await Followup.aggregate([
      { 
        $match: { 
          user: req.user._id,
          status: 'completed',
          completedAt: { $exists: true, $ne: null }
        } 
      },
      {
        $project: {
          completionDays: { 
            $divide: [
              { $subtract: ['$completedAt', '$createdAt'] }, 
              1000 * 60 * 60 * 24 // Convert ms to days
            ] 
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDays: { $avg: '$completionDays' },
          minDays: { $min: '$completionDays' },
          maxDays: { $max: '$completionDays' }
        }
      }
    ]);
    
    const avgCompletionTime = completionTimes.length > 0 ? completionTimes[0].avgDays : 0;
    
    res.json({
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      dueThisWeek,
      overdueCount,
      completionRate,
      avgCompletionTime,
      totalFollowUps: await Followup.countDocuments({ user: req.user._id })
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getFollowUps,
  getFollowUpById,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  detectFollowUp,
  checkDueFollowUps,
  getFollowUpAnalytics,
  detectFollowUpNeeds
};