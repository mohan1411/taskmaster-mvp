# Git Workflow: Claude + WSL Development

This document outlines the git workflow when working with Claude (AI assistant) while developing in WSL.

## Overview

- **Claude's Working Directory**: `/mnt/d/Projects/AI/BusinessIdeas/SmallBusiness/TaskMaster/MVP-Development` (Windows mount)
- **Your Development Directory**: `~/projects/TaskMaster/MVP-Development` (WSL filesystem)
- **Remote Repository**: `https://github.com/mohan1411/taskmaster-mvp`

## Key Principles

1. **Claude can only access the Windows mount location** due to security restrictions
2. **All development happens in WSL** for better performance
3. **All git operations are performed from WSL** for consistency
4. **Git commits are portable** between Windows and WSL locations

## Workflow Steps

### 1. When Claude Makes Code Changes

Claude works in the Windows mount location and commits changes:

```bash
# Claude's actions (automatic):
# 1. Makes code changes in /mnt/d/Projects/.../file.js
# 2. Commits the changes:
git add .
git commit -m "Fix: Description of changes"
```

### 2. You Sync Changes to WSL

After Claude commits changes, you sync them to your WSL development environment:

```bash
# Step 1: Push Claude's commits to remote (from WSL)
cd ~/projects/TaskMaster/MVP-Development
git push origin develop

# Step 2: The changes are now in your WSL environment
# Your dev server will auto-reload with the changes
```

**Note**: No need to pull because pushing from WSL automatically updates your local branch with Claude's commits.

### 3. Regular Development Workflow

All your git operations happen in WSL:

```bash
# Always work from WSL location
cd ~/projects/TaskMaster/MVP-Development

# Check status
git status

# Pull latest changes
git pull origin develop

# Create new feature branch
git checkout -b feature/new-feature

# Make your own changes
# ... edit files ...
git add .
git commit -m "Add new feature"

# Push changes
git push origin feature/new-feature
```

### 4. Merging to Main Branch

When ready to deploy to production:

```bash
# From WSL location
cd ~/projects/TaskMaster/MVP-Development

# Ensure develop is up to date
git checkout develop
git pull origin develop

# Merge to main
git checkout main
git pull origin main
git merge develop
git push origin main
```

## Common Scenarios

### Scenario 1: Claude Made Changes

```bash
# Claude says: "I've committed changes to fix the stat cards"
# You run:
cd ~/projects/TaskMaster/MVP-Development
git push origin develop
# Changes are now live in your dev environment
```

### Scenario 2: Resolving Conflicts

If you have local changes in WSL when Claude makes changes:

```bash
# Option 1: Stash your changes
git stash
git push origin develop
git stash pop

# Option 2: Commit your changes first
git add .
git commit -m "Your local changes"
git push origin develop
```

### Scenario 3: Viewing Claude's Changes

```bash
# See what Claude changed
git log --oneline -5
git show HEAD  # See the latest commit details
git diff HEAD~1  # See what changed in the last commit
```

## Best Practices

### DO:
- ✅ Run all git commands from WSL location
- ✅ Keep your WSL repo as the primary development environment
- ✅ Push Claude's commits promptly to keep environments in sync
- ✅ Use descriptive commit messages
- ✅ Pull before starting new work

### DON'T:
- ❌ Run git commands from Windows mount location
- ❌ Edit files in both locations simultaneously
- ❌ Forget to push Claude's commits before pulling
- ❌ Work directly in the Windows mount location

## Quick Reference

| Task | Command | Location |
|------|---------|----------|
| Push Claude's changes | `git push origin develop` | WSL |
| Start new feature | `git checkout -b feature/name` | WSL |
| Check changes | `git status` | WSL |
| View history | `git log --oneline` | WSL |
| Merge to main | `git checkout main && git merge develop` | WSL |
| Resolve conflicts | `git stash` or `git merge` | WSL |

## Troubleshooting

### "Your local changes would be overwritten"
```bash
# If you don't need local changes
git checkout -- path/to/file

# If you want to keep local changes
git stash
git push origin develop
git stash pop
```

### "Authentication failed"
```bash
# Make sure your Personal Access Token is saved
git config credential.helper store
# Then push again with your username and PAT
```

### "Cannot push to protected branch"
```bash
# Create a feature branch instead
git checkout -b feature/your-changes
git push origin feature/your-changes
# Then create a Pull Request on GitHub
```

## Environment Setup Verification

To verify your setup is correct:

```bash
# From WSL
cd ~/projects/TaskMaster/MVP-Development

# Check remotes
git remote -v
# Should show: origin https://github.com/mohan1411/taskmaster-mvp

# Check current branch
git branch
# Should show: * develop (or your current branch)

# Check git config
git config user.name
git config user.email
# Should show your GitHub username and email
```

## Summary

1. **Claude** makes and commits changes in Windows location
2. **You** push those commits from WSL location
3. **All** other git operations happen in WSL
4. **Never** need to use git from Windows location
5. **Always** develop and run servers from WSL location

This workflow ensures security, performance, and consistency while allowing Claude to assist with code changes.