# Follow-up System Quick Reference

## Key Files

### Backend
- **Controller**: `backend/controllers/followupController.js`
- **Model**: `backend/models/followupModel.js`
- **Routes**: `backend/routes/followupRoutes.js`
- **Email Integration**: `backend/controllers/emailController.js`

### Frontend
- **Main Page**: `frontend/src/pages/FollowUpsPage.js`
- **Service**: `frontend/src/services/followupService.js`
- **Email Detail**: `frontend/src/components/emails/EmailDetail.js`

## Essential API Calls

### Get Follow-ups
```javascript
// With filters
GET /api/followups?status=pending,in-progress&priority=high&page=1

// Response
{
  followups: [...],
  page: 1,
  pages: 5,
  total: 100
}
```

### Create Follow-up
```javascript
POST /api/followups
{
  subject: "Reply to client proposal",
  contactEmail: "client@example.com",
  priority: "high",
  dueDate: "2024-01-15",
  keyPoints: ["Review pricing", "Confirm timeline"]
}
```

### Update Follow-up Status
```javascript
PUT /api/followups/:id
{
  status: "completed",
  completionNotes: "Sent detailed response with updated pricing"
}
```

### Detect Follow-up for Email
```javascript
POST /api/emails/:id/detect-followup

// Response
{
  needsFollowUp: true,
  reason: "Client asking for proposal review",
  suggestedDate: "2024-01-15",
  keyPoints: ["Review proposal", "Send feedback"],
  followup: { ...created follow-up object }
}
```

## Frontend Service Methods

```javascript
import followupService from '../services/followupService';

// Get follow-ups with filters
const response = await followupService.getFollowUps({
  status: 'pending,in-progress',
  priority: 'high',
  page: 1
});

// Create new follow-up
const followup = await followupService.createFollowUp({
  subject: 'Follow up on meeting',
  dueDate: new Date()
});

// Update follow-up
await followupService.updateFollowUp(id, {
  status: 'completed'
});

// Detect follow-up needs
const analysis = await followupService.detectFollowUp(emailId);
```

## State Management

```javascript
// Main states in FollowUpsPage
const [followups, setFollowups] = useState([]);
const [analytics, setAnalytics] = useState(null);
const [filters, setFilters] = useState({
  status: ['pending', 'in-progress'],
  priority: '',
  dueDateFilter: { before: null, after: null }
});
```

## Common UI Components

### Analytics Cards
```jsx
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={3}>
    <Card>
      <CardContent>
        <Typography>Total Follow-ups</Typography>
        <Typography variant="h4">{analytics?.totalFollowUps}</Typography>
      </CardContent>
    </Card>
  </Grid>
</Grid>
```

### Follow-up Actions
```jsx
<Button onClick={() => handleStatusChange(id, 'in-progress')}>Start</Button>
<Button onClick={() => handleOpenCompletionDialog(id)}>Complete</Button>
<Button onClick={() => handleStatusChange(id, 'ignored')}>Ignore</Button>
```

### Filter Controls
```jsx
<Tabs value={tabValue} onChange={handleTabChange}>
  <Tab label="All Active" />
  <Tab label="Pending" />
  <Tab label="Completed" />
</Tabs>
```

## Configuration

### Environment Variables
```env
OPENAI_API_KEY=your_openai_api_key
```

### User Settings Structure
```javascript
{
  followUps: {
    defaultReminderDays: 3,
    autoDetect: true
  }
}
```

## Error Handling Patterns

```javascript
// API Error Handling
try {
  const response = await followupService.getFollowUps(filters);
  setFollowups(response.followups);
} catch (err) {
  console.error('Error fetching follow-ups:', err);
  setError('Failed to load follow-ups');
  showSnackbar('Failed to load follow-ups', 'error');
}

// AI Detection Error Handling
if (!config.openaiApiKey) {
  return { 
    success: false, 
    error: 'OpenAI API key is not configured' 
  };
}
```

## Database Queries

### Get Analytics
```javascript
// Status counts
const statusCounts = await Followup.aggregate([
  { $match: { user: req.user._id } },
  { $group: { _id: '$status', count: { $sum: 1 } } }
]);

// Overdue count
const overdueCount = await Followup.countDocuments({
  user: req.user._id,
  status: { $in: ['pending', 'in-progress'] },
  dueDate: { $lt: today }
});
```

### Common Filters
```javascript
const query = {
  user: req.user._id,
  status: { $in: ['pending', 'in-progress'] },
  priority: 'high',
  dueDate: { $lte: endDate, $gte: startDate }
};
```

## Testing Checklist

### Automatic Detection
- [ ] Email sync triggers follow-up detection
- [ ] AI correctly identifies follow-up needs
- [ ] Follow-ups are created with correct data
- [ ] Settings control auto-detection

### Manual Creation
- [ ] Create dialog works properly
- [ ] All fields validate correctly
- [ ] Key points can be added/removed
- [ ] Due date picker functions

### Status Management
- [ ] Status changes update correctly
- [ ] Completion dialog captures notes
- [ ] Analytics update after changes
- [ ] Email status reflects follow-up status

### Filtering & Search
- [ ] Tab filters work correctly
- [ ] Priority filter applies
- [ ] Date range filters function
- [ ] Pagination works properly

## Common Issues & Solutions

### Follow-ups Not Auto-Creating
1. Check OpenAI API key configuration
2. Verify `autoDetect` setting is true
3. Ensure email sync is working
4. Check console for API errors

### Analytics Not Updating
1. Verify API endpoint is called
2. Check MongoDB aggregation queries
3. Ensure proper error handling
4. Refresh the page/component

### Date Picker Errors
1. Use correct MUI DatePicker import
2. Implement `renderInput` prop (v5)
3. Handle null dates properly
4. Use LocalizationProvider wrapper

## Performance Tips

1. **Use Pagination**: Always paginate large result sets
2. **Debounce Filters**: Delay API calls when typing
3. **Cache Analytics**: Don't reload on every tab change
4. **Batch Updates**: Group multiple status changes
5. **Lazy Load**: Load email content only when needed

## Security Considerations

1. **User Isolation**: Always filter by `req.user._id`
2. **Input Validation**: Sanitize all user inputs
3. **API Key Protection**: Never expose OpenAI key
4. **Rate Limiting**: Implement for AI endpoints
5. **Error Messages**: Don't expose sensitive info
