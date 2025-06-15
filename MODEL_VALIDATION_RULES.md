# FizzTask Model Validation Rules

## User Model (`userModel.js`)

**Enum Fields:**
- `role`: ['user', 'admin'] ⚠️ Only these two values!

**Required Fields:**
- name
- email
- password (unless googleId exists)

**Other Fields:**
- avatar (string)
- isEmailVerified (boolean, default: false)
- googleId (optional)
- Various tokens for auth

## Task Model (`taskModel.js`)

**Enum Fields:**
- `status`: ['pending', 'in-progress', 'completed', 'archived']
  - ⚠️ Note: 'in-progress' with hyphen, not underscore!
  - ⚠️ 'overdue' is NOT a valid status - it's computed from dueDate
- `priority`: ['low', 'medium', 'high', 'urgent']

**Required Fields:**
- user (ObjectId)
- title

**Other Fields:**
- description
- dueDate
- emailSource (string - email ID if from email)
- category (default: 'uncategorized')
- aiGenerated (boolean, default: false)
- labels (array of strings)
- completedAt (date)

**NOT in model (don't use):**
- tags (use 'labels' instead)
- assignedTo
- confidence
- source
- notes
- estimatedTime
- progress

## Email Model (`emailModel.js`)

**Structure:**
- `sender`: { name, email }
- `recipients`: [{ name, email, type: 'to'|'cc'|'bcc' }]
- `attachments`: [{ filename, mimeType, size (Number!), attachmentId, path }]

**Required Fields:**
- user
- messageId (unique)
- threadId

**Other Fields:**
- subject
- snippet (short preview)
- hasAttachments (boolean)
- labels (array)
- receivedAt (date)
- isRead (boolean)
- taskExtracted (boolean)
- needsFollowUp (boolean)
- followUpDueDate

**NOT in model:**
- from/to (use sender/recipients)
- body/bodyHtml
- extractedTasks array
- metadata object

## Common Fixes Applied:

1. **Status Mapping:**
   - 'in_progress' → 'in-progress'
   - 'overdue' → 'pending'

2. **Role Mapping:**
   - 'Product Manager' → 'user'
   - Any non-admin role → 'user'

3. **Size Parsing:**
   - "2.4 MB" → 2516582 (bytes as number)

4. **Field Names:**
   - tags → labels
   - email → emailSource
   - from/to → sender/recipients

## Running Demo Population:

```batch
cd backend
node populate-demo-data.js
```

Creates:
- User: newuser@example.com / demo123
- 5 Emails
- 13 Tasks
- Documents
- Follow-ups