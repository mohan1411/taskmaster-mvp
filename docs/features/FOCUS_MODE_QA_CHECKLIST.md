# Focus Mode Test Plan

## Overview
This document outlines the comprehensive test plan for the Focus Mode feature in FizzTask.

## Test Environment Setup
1. Ensure you have at least 3-5 tasks created with different priorities and due dates
2. Clear browser cache and local storage before testing
3. Test in both light and dark modes

## Feature Testing Checklist

### 1. Focus Mode Page Load
- [ ] Navigate to Focus Mode from sidebar
- [ ] Verify page loads without errors
- [ ] Check stat cards display correctly (Today, Day Streak, Sessions, Energy Level)
- [ ] Verify "Ready to Focus?" section appears

### 2. Session Duration Selection
- [ ] Test Quick Focus (25 min) button
- [ ] Test Regular Session (45 min) button
- [ ] Test Deep Work (90 min) button
- [ ] Test Custom session with slider (15-180 min range)
- [ ] Verify selected duration highlights correctly

### 3. Smart Task Selection
- [ ] Toggle between "Smart Selection" and "Manual Selection"
- [ ] **Smart Selection Mode:**
  - [ ] Verify AI recommendations appear
  - [ ] Check task scoring display (percentage)
  - [ ] Verify reasoning text appears for each task
  - [ ] Test auto-select functionality
  - [ ] Check "Best Match" label on top recommendation
  - [ ] Verify session capacity bar updates
- [ ] **Manual Selection Mode:**
  - [ ] Verify suggested tasks appear based on priority
  - [ ] Test selecting/deselecting tasks
  - [ ] Check cognitive load percentage updates

### 4. Energy Level Tracker
- [ ] Verify energy slider works (1-10 scale)
- [ ] Check energy level recommendations update
- [ ] Verify color changes (red/yellow/green) based on level
- [ ] Test "Quick Energy Boosters" chips
- [ ] Check if recommendations change based on time of day

### 5. Distraction Blocking
- [ ] Verify distraction blocker settings appear
- [ ] Test toggling notification blocking
- [ ] Test site blocking toggle
- [ ] Check emergency contacts input
- [ ] Verify custom blocked sites can be added

### 6. Starting a Focus Session
- [ ] Select tasks and click "Start Focus Session"
- [ ] Verify session starts without errors
- [ ] Check timer countdown works
- [ ] Test pause/resume functionality
- [ ] Verify task list appears in active session
- [ ] Test "End Session" button

### 7. During Focus Session
- [ ] **Timer Functionality:**
  - [ ] Verify countdown is accurate
  - [ ] Test pause/resume maintains correct time
  - [ ] Check time format displays correctly
- [ ] **Task Management:**
  - [ ] Test marking tasks as complete during session
  - [ ] Verify completed tasks show checkmark
  - [ ] Test "Skip Task" functionality
- [ ] **Distraction Tracking:**
  - [ ] Switch browser tabs and return
  - [ ] Check if distractions are logged
  - [ ] Verify distraction shield appears

### 8. Session Completion
- [ ] Let timer run to zero or click "End Session"
- [ ] Verify completion screen appears
- [ ] Check session summary stats:
  - [ ] Total focus time
  - [ ] Tasks completed count
  - [ ] Distractions count
  - [ ] Productivity score
- [ ] Test "Start New Session" button
- [ ] Test "View Analytics" button
- [ ] Test "Close" button

### 9. Focus Analytics Page
- [ ] Navigate to analytics via icon or completion screen
- [ ] **Overview Section:**
  - [ ] Verify total focus hours display
  - [ ] Check weekly/monthly stats
  - [ ] Verify streak calculation
- [ ] **Charts:**
  - [ ] Test Session History chart
  - [ ] Verify chart type toggle (Area/Bar/Line)
  - [ ] Check date filtering works
  - [ ] Test session type distribution pie chart
- [ ] **Insights:**
  - [ ] Verify AI insights appear
  - [ ] Check peak performance time detection
  - [ ] Test expanding/collapsing insights
- [ ] **Session History:**
  - [ ] Verify recent sessions list
  - [ ] Check session details display
  - [ ] Test pagination if many sessions

### 10. Edge Cases & Error Handling
- [ ] Start session with no tasks selected
- [ ] Try to start session while one is active
- [ ] Test with very long task names
- [ ] Test with 20+ tasks
- [ ] Refresh page during active session
- [ ] Test on slow internet connection
- [ ] Close browser during session and reopen

### 11. Integration Tests
- [ ] Create task from email, then use in focus session
- [ ] Complete task in focus session, verify update in Tasks page
- [ ] Check if focus stats appear in Dashboard
- [ ] Verify completed tasks update in Follow-ups

### 12. Performance Tests
- [ ] Page load time < 2 seconds
- [ ] No lag when selecting multiple tasks
- [ ] Smooth timer countdown (no jumps)
- [ ] Chart rendering < 1 second

### 13. Accessibility Tests
- [ ] Keyboard navigation through all controls
- [ ] Screen reader compatibility
- [ ] Color contrast in dark/light modes
- [ ] Focus indicators visible

### 14. Mobile Responsiveness
- [ ] Test on mobile viewport (360px)
- [ ] Test on tablet viewport (768px)
- [ ] Verify touch controls work
- [ ] Check layout doesn't break

## Bug Report Template
```
**Bug Description:**
[Clear description of the issue]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Environment:**
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- Screen Size: [Desktop/Tablet/Mobile]

**Screenshots:**
[Attach if applicable]
```

## Test Results Summary
- [ ] All core features working
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] Ready for production

## Notes
- Document any issues found during testing
- Note any suggestions for improvements
- Record any performance concerns