const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import all models
const User = require('../models/userModel');
const Email = require('../models/emailModel');
const Task = require('../models/taskModel');
const FollowUp = require('../models/followUpModel');
const FocusSession = require('../models/focusSessionModel');
const FocusPattern = require('../models/focusPatternModel');

// Sample emails data
const sampleEmails = [
  {
    subject: "Q1 Project Planning Meeting - Action Items",
    sender: { name: "Sarah Chen", email: "sarah.chen@company.com" },
    body: `Hi Alex,

Following up on our Q1 planning meeting. Here are the action items we discussed:

1. Please prepare the budget forecast for the new marketing campaign by next Friday (deadline: Jan 24th). We'll need detailed breakdowns for digital and print media.

2. Schedule a follow-up meeting with the design team to review the new brand guidelines. This should happen before the end of the month.

3. Can you review and approve the updated project timeline? I've attached the latest version. We need your feedback by Wednesday.

4. Don't forget to send the quarterly report to the board members. This is high priority and due on Monday, Jan 22nd.

Also, please coordinate with John about the website redesign proposal. He's waiting for your input on the technical requirements.

Best regards,
Sarah Chen
Project Manager`,
    receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    hasAttachments: true,
    tags: ['project', 'urgent', 'planning']
  },
  {
    subject: "RE: Product Launch Preparations",
    sender: { name: "Mike Johnson", email: "mike.j@techstartup.com" },
    body: `Alex,

Quick update on the product launch preparations:

The marketing materials are ready for review. Please take a look and provide feedback by EOD tomorrow. This is critical for our timeline.

I need you to:
- Review the press release draft (attached)
- Approve the social media campaign schedule
- Finalize the demo script for the launch event

Also, can you confirm the venue booking for the launch party? We need to send out invitations by Thursday.

The dev team mentioned there's a bug in the payment flow that needs urgent attention. Can you prioritize this for tomorrow morning?

Let me know if you need any clarification.

Thanks,
Mike`,
    receivedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    hasAttachments: true,
    tags: ['product-launch', 'marketing', 'urgent']
  },
  {
    subject: "Weekly Team Sync - Tasks and Updates",
    sender: { name: "Emily Rodriguez", email: "emily.r@company.com" },
    body: `Good morning Alex,

Here's a summary from our weekly sync and your tasks for this week:

Development Tasks:
- Complete the API integration for the customer portal (due Wednesday)
- Review and merge the pull requests from the team
- Update the documentation for the new features

Administrative:
- Submit your expense report for last month's conference
- Complete the performance reviews for your team members (deadline: Friday)
- Schedule 1-on-1s with the new hires

Reminders:
- The client presentation is scheduled for Thursday at 2 PM. Please prepare the technical demo.
- Don't forget about the team building event on Friday afternoon

Can you also look into the performance issues on the staging server? The QA team reported slow response times.

Thanks!
Emily`,
    receivedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    tags: ['weekly-sync', 'team', 'tasks']
  },
  {
    subject: "Urgent: Client Feedback Requires Immediate Action",
    sender: { name: "David Kim", email: "david.kim@agency.com" },
    body: `Alex,

Just got off a call with our biggest client. They have some concerns that need immediate attention:

1. The dashboard loading time is unacceptable (>5 seconds). This needs to be fixed ASAP - they're threatening to cancel the contract.

2. They want a complete redesign of the reports section. Can you put together a proposal by tomorrow morning?

3. Bug fix needed: Users are getting logged out randomly. This is affecting their productivity.

Also, they've requested:
- A detailed roadmap for Q1 features
- Performance optimization plan
- Weekly progress reports starting this Friday

I've scheduled an emergency meeting for tomorrow at 9 AM. Please come prepared with solutions.

This is our top priority right now.

David`,
    receivedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    isRead: false,
    tags: ['client', 'urgent', 'critical']
  },
  {
    subject: "Follow-up: Training Materials and Onboarding",
    sender: { name: "Lisa Wang", email: "lisa.w@company.com" },
    body: `Hi Alex,

Following up on our discussion about the new employee onboarding process.

Action items for you:
- Create training videos for the core platform features (due by end of week)
- Update the onboarding checklist with the latest security protocols
- Review and approve the new hire welcome packet

I also need you to:
1. Set up accounts for the three new developers starting next Monday
2. Prepare their workstations with all necessary software
3. Schedule orientation sessions with each department

The HR team is waiting for your input on the technical skills assessment. Can you send that over by Wednesday?

Let me know if you need any resources or have questions.

Best,
Lisa`,
    receivedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    tags: ['hr', 'onboarding', 'training']
  },
  {
    subject: "Budget Review Meeting - Preparation Required",
    sender: { name: "Robert Taylor", email: "robert.t@company.com" },
    body: `Alex,

The quarterly budget review is scheduled for next Tuesday. I need you to prepare the following:

1. Detailed breakdown of IT expenses for Q4
2. Projections for Q1 with justifications
3. Cost-benefit analysis for the proposed infrastructure upgrades
4. Vendor contract renewals summary

Please also:
- Review the attached budget template and fill in your department's data
- Prepare a 10-minute presentation on cost optimization initiatives
- Identify areas where we can reduce spending without impacting productivity

Send me the draft by Monday morning so I can review before the meeting.

This is important for our annual planning, so please prioritize accordingly.

Regards,
Robert
CFO`,
    receivedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    hasAttachments: true,
    tags: ['finance', 'budget', 'meeting']
  }
];

async function completeDataReset() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find newuser@example.com
    const targetUser = await User.findOne({ email: 'newuser@example.com' });
    if (!targetUser) {
      console.error('User newuser@example.com not found!');
      process.exit(1);
    }

    console.log(`Found user: ${targetUser.email}`);

    // Clear all data except users
    console.log('\n1. Clearing all non-user data...');
    await Task.deleteMany({});
    console.log('   - Tasks cleared');
    
    await Email.deleteMany({});
    console.log('   - Emails cleared');
    
    await FollowUp.deleteMany({});
    console.log('   - Follow-ups cleared');
    
    await FocusSession.deleteMany({});
    console.log('   - Focus sessions cleared');
    
    await FocusPattern.deleteMany({});
    console.log('   - Focus patterns cleared');

    // Reset ALL user metrics that might affect the UI
    console.log('\n2. Resetting user metrics...');
    const updateData = {
      // Focus-related metrics
      todaysFocusTime: 0,
      weeklyFocusTime: 0,
      totalFocusTime: 0,
      focusStreak: 0,
      lastFocusDate: null,
      
      // Session counts
      totalSessions: 0,
      completedSessions: 0,
      
      // Energy and productivity
      currentEnergyLevel: 5,
      averageEnergyLevel: 5,
      productivityScore: 0,
      
      // Task metrics
      tasksCompleted: 0,
      tasksCreated: 0,
      
      // Nested metrics if they exist
      'metrics.todaysFocusTime': 0,
      'metrics.weeklyFocusTime': 0,
      'metrics.totalSessions': 0,
      'metrics.streak': 0,
      
      'focusMetrics.todaysFocusTime': 0,
      'focusMetrics.weeklyFocusTime': 0,
      'focusMetrics.sessionsCompleted': 0,
      'focusMetrics.currentStreak': 0,
      'focusMetrics.totalFocusTime': 0,
      
      'stats.focusTime': 0,
      'stats.sessions': 0,
      'stats.tasksCompleted': 0
    };

    await User.updateOne(
      { _id: targetUser._id },
      { $set: updateData }
    );
    console.log('   - User metrics reset');

    // Add sample emails for the user
    console.log('\n3. Adding sample emails...');
    const emailsToInsert = sampleEmails.map((email, index) => ({
      ...email,
      user: targetUser._id,
      messageId: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}@example.com`,
      threadId: `thread-${Date.now()}-${index}`,
      isRead: email.isRead !== undefined ? email.isRead : true,
      isStarred: false,
      folder: 'inbox',
      receivedAt: email.receivedAt || new Date()
    }));

    const insertedEmails = await Email.insertMany(emailsToInsert);
    console.log(`   - Added ${insertedEmails.length} sample emails`);

    // Verify the reset
    console.log('\n4. Verification:');
    const emailCount = await Email.countDocuments({ user: targetUser._id });
    const taskCount = await Task.countDocuments({ user: targetUser._id });
    const sessionCount = await FocusSession.countDocuments({ user: targetUser._id });
    
    console.log(`   - Emails: ${emailCount}`);
    console.log(`   - Tasks: ${taskCount}`);
    console.log(`   - Focus Sessions: ${sessionCount}`);
    
    const updatedUser = await User.findById(targetUser._id);
    console.log(`   - Today's focus time: ${updatedUser.todaysFocusTime || 0}`);
    console.log(`   - Total sessions: ${updatedUser.totalSessions || 0}`);

    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    console.log('\n✅ Complete data reset successful!');
    console.log('Note: You may need to refresh the app or clear browser cache/localStorage for UI to update.');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
completeDataReset();