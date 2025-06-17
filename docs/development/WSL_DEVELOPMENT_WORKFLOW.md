# WSL Development Workflow for TaskMaster

This document outlines the development workflow after migrating the project to WSL filesystem for better performance and compatibility.

## Project Locations

- **WSL Path**: `~/projects/TaskMaster/MVP-Development`
- **Windows Access Path**: `\\wsl.localhost\Ubuntu\home\mohan\projects\TaskMaster\MVP-Development`
- **Old Location (archived)**: `/mnt/d/Projects/AI/BusinessIdeas/SmallBusiness/TaskMaster/MVP-Development`

## Initial Setup (Already Completed)

```bash
# Project was cloned to WSL filesystem
cd ~/projects/TaskMaster
git clone https://github.com/mohan1411/taskmaster-mvp.git MVP-Development
cd MVP-Development
git checkout develop
```

## Daily Development Workflow

### 1. Starting the Development Environment

#### Frontend Development
```bash
# Open terminal in WSL
cd ~/projects/TaskMaster/MVP-Development/frontend
npm install  # Only needed first time or when dependencies change
npm start    # Starts on http://localhost:3000
```

#### Backend Development
```bash
# Open another terminal in WSL
cd ~/projects/TaskMaster/MVP-Development/backend
npm install  # Only needed first time or when dependencies change
npm start    # Starts on http://localhost:3001
```

### 2. Code Editing Options

#### Option A: VS Code with Remote-WSL (Recommended)
1. Install "Remote - WSL" extension in VS Code
2. From WSL terminal:
   ```bash
   cd ~/projects/TaskMaster/MVP-Development
   code .
   ```
3. VS Code opens with full WSL integration

#### Option B: VS Code from Windows
1. Open VS Code
2. File → Open Folder
3. Navigate to: `\\wsl.localhost\Ubuntu\home\mohan\projects\TaskMaster\MVP-Development`

#### Option C: Any Windows Editor
- Access files directly at: `\\wsl.localhost\Ubuntu\home\mohan\projects\TaskMaster\MVP-Development`
- Can create a desktop shortcut for quick access

### 3. Git Operations

All git operations should be performed in WSL terminal:

```bash
# Check status
git status

# Create new feature branch
git checkout -b feature/new-feature

# Stage changes
git add .

# Commit changes
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature

# Switch branches
git checkout develop
git pull origin develop

# Merge changes
git merge feature/new-feature
```

### 4. Common Tasks

#### Installing New Dependencies
```bash
# Frontend
cd ~/projects/TaskMaster/MVP-Development/frontend
npm install package-name

# Backend
cd ~/projects/TaskMaster/MVP-Development/backend
npm install package-name
```

#### Running Tests
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test
```

#### Building for Production
```bash
# Frontend build
cd frontend
npm run build

# Backend (if applicable)
cd backend
npm run build
```

### 5. Troubleshooting

#### Permission Issues
- All npm commands should be run from WSL terminal, not Windows CMD/PowerShell
- If you encounter permission errors, ensure you're in WSL terminal

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000  # or :3001 for backend

# Kill process
kill -9 <PID>
```

#### Git Authentication
- Personal Access Token is saved in credential manager
- If prompted again, create new token at: https://github.com/settings/tokens

### 6. Best Practices

1. **Always use WSL terminal** for:
   - npm commands
   - git operations
   - Running servers
   
2. **Use Windows tools** for:
   - File editing (if preferred)
   - Accessing files via Explorer
   - Running Windows-specific tools

3. **Performance Tips**:
   - Keep project files in WSL filesystem (`~/projects/`)
   - Avoid accessing files from `/mnt/` paths
   - Use WSL2 for best performance

### 7. Backup and Sync

```bash
# Regular backup (if needed)
rsync -av --exclude='node_modules' --exclude='.git' \
  ~/projects/TaskMaster/MVP-Development/ \
  /mnt/d/Backups/TaskMaster/

# Push all changes to remote
git push --all origin
```

## Quick Reference

| Task | Command | Location |
|------|---------|----------|
| Start Frontend | `npm start` | `~/projects/TaskMaster/MVP-Development/frontend` |
| Start Backend | `npm start` | `~/projects/TaskMaster/MVP-Development/backend` |
| Open in VS Code | `code .` | `~/projects/TaskMaster/MVP-Development` |
| View in Explorer | - | `\\wsl.localhost\Ubuntu\home\mohan\projects\TaskMaster\MVP-Development` |
| Git Status | `git status` | Any project subdirectory |

## Environment Variables

Frontend (.env):
- Located at: `~/projects/TaskMaster/MVP-Development/frontend/.env`
- Contains: `REACT_APP_API_URL=http://localhost:3001`

Backend (.env):
- Located at: `~/projects/TaskMaster/MVP-Development/backend/.env`
- Contains database URLs, JWT secrets, API keys

## Benefits of WSL Development

1. **Performance**: 10-100x faster file operations
2. **Compatibility**: Native Linux tools and scripts
3. **No Permission Issues**: Full control over files
4. **Better npm/node performance**: Faster installs and builds
5. **Integrated Terminal**: Full bash environment

---

**Note**: The old Windows location (`/mnt/d/Projects/...`) can be deleted to save disk space once you've confirmed everything is working correctly from the WSL location.