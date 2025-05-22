# TaskMaster Dashboard Overdue Count Fix

## Issue and Solution

### Issue:
The dashboard was showing 0 overdue tasks while the Tasks page displayed 5 overdue tasks.

### Root Cause:
The dashboard was using the `tasks/analytics` endpoint which was returning an incorrect overdue count, while the Tasks page was calculating overdue tasks directly from task data by comparing due dates with the current date.

### Solution:
Instead of relying on the analytics endpoint, the dashboard now:

1. Fetches all tasks directly using `/api/tasks?status=pending,in-progress&limit=1000`
2. Calculates the overdue count manually using the same logic as the Tasks page:
   ```javascript
   const countOverdueTasks = (tasks) => {
     return tasks.filter(task => {
       if (!task.dueDate || task.status === 'completed' || task.status === 'archived') return false;
       const now = new Date();
       const dueDate = new Date(task.dueDate);
       return dueDate < now;
     }).length;
   };
   ```
3. Uses this calculated value to display the overdue count in the dashboard

## Implementation Details

1. Added a new `fetchAllTasks` function that:
   - Makes a direct API call to get all pending/in-progress tasks
   - Uses the same overdue calculation logic as the Tasks page
   - Returns both the tasks and the calculated overdue count

2. Modified the dashboard data fetching to:
   - First fetch all tasks and calculate the overdue count
   - Use the same tasks data to calculate other metrics (due today, recent tasks)
   - Continue fetching other data (email counts, follow-ups)

3. Improved UI and layout:
   - Fixed container width and positioning
   - Added better responsive styling
   - Enhanced alert message for overdue tasks

## Expected Results

1. The dashboard now shows the correct overdue task count, matching what's displayed on the Tasks page.
2. All calculations are consistent between pages, as they use the same logic.
3. The UI layout issues are fixed, with all content properly centered and visible.

## Verification

After deploying this fix, the dashboard should:
1. Show the correct number of overdue tasks (currently 5)
2. Display an alert message if there are overdue tasks
3. Navigating to tasks via the overdue card correctly filters to show overdue tasks
