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

## Project Structure

### Key Directories
- `/backend`: Node.js/Express API server
- `/frontend`: React application
- `/backend/services`: Core business logic
- `/backend/controllers`: API endpoints
- `/frontend/src/components`: React components
- `/frontend/src/pages`: Page components

### Important Files
- `/backend/.env.example`: Environment variables template
- `/backend/package.json`: Backend dependencies
- `/frontend/package.json`: Frontend dependencies
- `/backend/services/attachmentProcessor.js`: Document processing logic
- `/backend/services/improvedSimpleParser.js`: Task extraction parser
- `CLAUDE.md`: AI context for Claude
- `GIT_OPERATIONS_GUIDE.md`: This file

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

# Step 4: Railway automatically deploys from main branch
# Monitor deployment at Railway dashboard
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
- **Railway deploys from `main` branch automatically**
- Push to main = Automatic deployment to production
- Tags are for version tracking and rollback reference
- Tag format: v[MAJOR].[MINOR].[PATCH]
- Current version: v1.1.4
- Next version should be: v1.1.5

### Environment Variables

**Production (Railway)**:
- `NODE_ENV`: production
- `MONGODB_URI`: Production MongoDB connection string
- `JWT_SECRET`: Production secret (different from dev)
- `GOOGLE_CLIENT_ID`: OAuth client ID
- `GOOGLE_CLIENT_SECRET`: OAuth client secret
- `FRONTEND_URL`: https://taskmaster-mvp.up.railway.app
- `DOCUMENT_PARSER_MODE`: Not set (defaults to 'simple-only')
- Parser modes available: 'simple-only', 'openai-first', 'openai-only'

**Development (Local)**:
- Copy `.env.example` to `.env`
- Use local MongoDB or MongoDB Atlas dev cluster
- Different JWT_SECRET for security

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

# 4. Railway automatically deploys from main branch
# Monitor deployment at Railway dashboard
```

### Syncing Develop with Latest Production
```bash
# After a hotfix or direct main branch update
git checkout develop
git pull origin develop
git merge main
git push origin develop
```

## Pre-Deployment Checklist

Before merging to main (production):

1. **Check for Test-Only Code**
   ```bash
   cd backend
   npm run check:test-code
   ```
   See `TEST_CODE_PATTERNS.md` for details

2. **Test Locally**
   ```bash
   # Backend tests
   cd backend
   npm test
   
   # Frontend build
   cd ../frontend
   npm run build
   ```

3. **Check for Package Updates**
   ```bash
   # If package.json was modified
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. **Environment Variables**
   - Ensure all new env variables are added to Railway
   - Check `.env.example` is updated

5. **Database Changes**
   - Document any schema changes
   - Prepare migration scripts if needed
   - Backup production database before deployment

## Rollback Procedures

If production has issues after deployment:

```bash
# Quick rollback to previous version
git checkout main
git reset --hard v1.1.4  # Previous stable tag
git push --force origin main

# Railway will automatically redeploy

# After fixing the issue
git checkout develop
git pull origin main  # Get the rollback state
# Fix the issue...
```

## Feature Branch Workflow

For new features:

```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/new-feature-name

# Work on feature
git add -A
git commit -m "Add new feature"

# Merge back to develop
git checkout develop
git merge feature/new-feature-name
git push origin develop

# Delete feature branch
git branch -D feature/new-feature-name
```

## Railway-Specific Information

- **Deployment**: Automatic from `main` branch
- **Build Command**: Automatically detected
- **Environment Variables**: Set in Railway dashboard
- **Logs**: Check Railway dashboard for deployment and runtime logs
- **Rollback**: Use git reset and force push to main

## Important Commands Reference

### Before Deployment
```bash
# Check what will be deployed
git diff develop..main

# See commit differences
git log develop..main --oneline
```

### After Package.json Changes
```bash
# Backend
cd backend
npm install
npm audit fix  # Fix vulnerabilities

# Frontend
cd frontend
npm install
npm audit fix
```

### Database Backup (MongoDB)
```bash
# Before major releases
mongodump --uri="mongodb://..." --out=backup-$(date +%Y%m%d)
```

## Notes for Future Sessions
- Development happens on `develop` branch
- Production releases go to `main` branch
- We use tags (not branches) for releases
- Current production version is v1.1.4
- All recent fixes are included in v1.1.4 tag
- Task extraction now properly finds multiple tasks in documents

## Troubleshooting Common Issues

### Railway Deployment Failed
1. Check Railway logs for error messages
2. Common issues:
   - Missing environment variables
   - Package not found (run npm install locally first)
   - Build errors (test with `npm run build` locally)

### Merge Conflicts
```bash
# If develop has conflicts with main
git checkout develop
git pull origin develop
git merge main
# Resolve conflicts manually
git add .
git commit -m "Resolve merge conflicts"
git push origin develop
```

### Package Version Conflicts
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues
- Check MONGODB_URI in Railway env vars
- Ensure IP whitelist includes Railway IPs
- Check connection string format

## Current State (as of 2025-06-26)
- **develop branch**: Synced with main (ready for new development)
- **main branch**: Production branch with all latest fixes
- **Latest tag**: v1.1.4 (on main branch)
- **Railway**: Deploying from main branch automatically