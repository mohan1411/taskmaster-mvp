# Git Operations Guide for TaskMaster MVP

## Current Git Structure

### Branches
- **main**: Production-ready branch (stable releases)
- **develop**: Active development branch (all new features and fixes)
- **bugfix/critical-security-fixes**: Security fixes branch
- **bugfix/input-validation**: Input validation fixes
- **improvement/database-indexes**: Database optimization branch

### Tags (Releases)
- **v1.1.4**: Latest release (2025-06-26) - Includes task extraction fix for multiple tasks

## Git Workflow

### 1. Development Workflow (Day-to-Day Development)

**Important**: All development work should be done on the `develop` branch!

```bash
# Switch to develop branch
git checkout develop
git pull origin develop

# Make changes
git add -A
git commit -m "Your commit message"
git push origin develop
```

### 2. Releasing to Production

When ready to release develop changes to production:

```bash
# Step 1: Ensure develop is up to date
git checkout develop
git pull origin develop

# Step 2: Merge develop into main
git checkout main
git pull origin main
git merge develop
git push origin main

# Step 3: Create release tag
git tag -a v1.1.5 -m "Release v1.1.5 - Description of changes"
git push origin v1.1.5

# Step 4: Deploy on Railway using the tag
```

### 3. Hotfix Workflow (Emergency Production Fixes)

For urgent production fixes:

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# Make fixes
git add -A
git commit -m "Hotfix: Description"

# Merge to main
git checkout main
git merge hotfix/critical-issue
git push origin main

# Create hotfix tag
git tag -a v1.1.5-hotfix1 -m "Hotfix: Description"
git push origin v1.1.5-hotfix1

# Merge back to develop
git checkout develop
git merge main
git push origin develop

# Delete hotfix branch
git branch -D hotfix/critical-issue
```

### 4. Production Deployment Strategy

When deploying to production (Railway), we need to exclude test-only changes:

1. **Database Schema Changes to Exclude**:
   - Email model's `body` field (test-only)
   - Any test data generation code

2. **Safe Production Files**:
   - All bug fixes
   - All feature implementations
   - All performance improvements
   - Email attachment functionality (restored)

### 5. Common Git Operations

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

### For Development Work
```bash
# Always start by updating develop
git checkout develop
git pull origin develop

# Make changes and commit
git add -A
git commit -m "Your commit message"
git push origin develop
```

### For Production Release
```bash
# 1. Update both branches
git checkout develop
git pull origin develop
git checkout main
git pull origin main

# 2. Merge develop to main
git merge develop
git push origin main

# 3. Create and push tag
git tag -a v1.1.5 -m "Release v1.1.5 - Your description"
git push origin v1.1.5

# 4. Deploy on Railway using tag v1.1.5
```

### Syncing Develop with Latest Production
```bash
# After a hotfix or direct main branch update
git checkout develop
git pull origin develop
git merge main
git push origin develop
```

## Notes for Future Sessions
- Development happens on `develop` branch
- Production releases go to `main` branch
- We use tags (not branches) for releases
- Current production version is v1.1.4
- All recent fixes are included in v1.1.4 tag
- Task extraction now properly finds multiple tasks in documents

## Current State (as of 2025-06-26)
- **develop branch**: Behind main (needs to be synced with latest fixes)
- **main branch**: Contains all latest fixes including task extraction
- **Latest tag**: v1.1.4 (on main branch)
- **Next steps**: Sync develop with main before starting new development