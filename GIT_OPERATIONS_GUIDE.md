# Git Operations Guide for TaskMaster MVP

## Current Git Structure

### Branches
- **main**: Primary development branch (default)
- **develop**: Feature development branch (exists but not actively used)
- **bugfix/critical-security-fixes**: Security fixes branch
- **bugfix/input-validation**: Input validation fixes
- **improvement/database-indexes**: Database optimization branch

### Tags (Releases)
- **v1.1.4**: Latest release (2025-06-26) - Includes task extraction fix for multiple tasks

## Git Workflow

### 1. Regular Development
```bash
# Always work on main branch for now
git checkout main
git pull origin main

# Make changes
git add -A
git commit -m "Your commit message"
git push origin main
```

### 2. Creating a New Release

**Important**: We use TAGS for releases, NOT branches!

```bash
# Ensure you're on main with latest changes
git checkout main
git pull origin main

# Create annotated tag
git tag -a v1.1.5 -m "Release v1.1.5 - Description of changes"

# Push tag to remote
git push origin v1.1.5
```

### 3. Production Deployment Strategy

When deploying to production (Railway), we need to exclude test-only changes:

1. **Database Schema Changes to Exclude**:
   - Email model's `body` field (test-only)
   - Any test data generation code

2. **Safe Production Files**:
   - All bug fixes
   - All feature implementations
   - All performance improvements
   - Email attachment functionality (restored)

### 4. Common Git Operations

#### Check Current Status
```bash
git status
git branch -a  # List all branches
git tag -l     # List all tags
```

#### View Recent Commits
```bash
git log --oneline -10
```

#### Cherry-pick Specific Commits (if needed)
```bash
git cherry-pick <commit-hash>
```

#### Delete Branches
```bash
# Delete local branch
git branch -D branch-name

# Delete remote branch
git push origin --delete branch-name
```

#### Delete Tags
```bash
# Delete local tag
git tag -d tag-name

# Delete remote tag
git push origin --delete tag-name
```

## Important Context for Claude

### Recent Release History
- **v1.1.4** (2025-06-26): Fixed task extraction to find multiple tasks in documents
  - Replaced emergency inline parser with improvedSimpleParser
  - Added debug logging for parser mode tracking
  - Commit: 6a77547

### Key Fixes Included in v1.1.4
1. Focus Mode session completion navigation
2. Task completion checkboxes visibility
3. Completed tasks filtering in focus mode
4. Task stats showing correct completed count
5. Focus analytics showing correct metrics
6. Mobile responsiveness improvements
7. Email attachment detection and processing
8. Document extraction with Gmail integration
9. Multiple task extraction from documents

### Production Deployment Notes
- Railway deployment uses tags, not branches
- Always create tags from main branch
- Tag format: v[MAJOR].[MINOR].[PATCH]
- Current version: v1.1.4
- Next version should be: v1.1.5

### Environment Variables
- DOCUMENT_PARSER_MODE: Not set (defaults to 'simple-only')
- Parser modes available: 'simple-only', 'openai-first', 'openai-only'

## Commit Message Format
```
Short description of change

- Detailed change 1
- Detailed change 2

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Quick Reference Commands

### For Production Release
```bash
# 1. Ensure on main with latest
git checkout main
git pull origin main

# 2. Create and push tag
git tag -a v1.1.5 -m "Release v1.1.5 - Your description"
git push origin v1.1.5

# 3. Deploy on Railway using tag v1.1.5
```

### For Committing Changes
```bash
git add -A
git commit -m "Your commit message"
git push origin main
```

## Notes for Future Sessions
- We use tags (not branches) for releases
- Current production version is v1.1.4
- Main branch is the primary development branch
- All recent fixes are included in v1.1.4 tag
- Task extraction now properly finds multiple tasks in documents