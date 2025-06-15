## Demo Data Population - Field Mapping Fixed

### Fixed Issues:

1. **Task Status Values**
   - `in_progress` → `in-progress` (with hyphen)
   - `overdue` → `pending` (overdue is a computed state, not a stored status)

2. **Task Model Fields**
   - Removed: `tags`, `assignedTo`, `confidence`, `source`, `notes` (not in model)
   - Changed: `email` → `emailSource`
   - Changed: `tags` → `labels`
   - Added: `aiGenerated` flag

3. **Email Model Fields**
   - Changed: `from`/`to` → `sender`/`recipients` objects
   - Removed: `body`, `bodyHtml`, `extractedTasks`, `metadata` fields
   - Added: `snippet` field
   - Fixed: Attachment sizes from strings to numbers

### Valid Enum Values:

**Task Status:**
- pending
- in-progress
- completed
- archived

**Task Priority:**
- low
- medium
- high
- urgent

### Demo Data Created:
- 1 User (newuser@example.com / demo123)
- 5 Emails with attachments
- 13 Tasks linked to emails
- Documents from attachments
- Follow-ups for important emails

### To Run:
```batch
cd backend
node populate-demo-data.js
```