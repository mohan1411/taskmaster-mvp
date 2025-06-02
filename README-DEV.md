# TaskMaster MVP - Development Environment

This is a fresh development environment cloned from the production repository at https://github.com/mohan1411/taskmaster-mvp

## Environment Setup

All development environment variables have been retained from the previous development setup:

### Backend (.env)
- MongoDB Atlas connection configured
- Development port: 5000
- JWT secrets configured
- Gmail OAuth configured
- OpenAI API configured

### Frontend (.env)
- API URL pointing to localhost:5000

## Quick Start

1. **Setup Dependencies:**
   ```bash
   # Run the setup script
   setup-dev.bat
   ```

2. **Start Development Servers:**
   ```bash
   # Start both frontend and backend
   start-dev.bat
   ```

3. **Manual Start (Alternative):**
   ```bash
   # Backend
   cd backend
   npm start
   
   # Frontend (in new terminal)
   cd frontend
   npm start
   ```

## URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Production:** https://fizztask.com

## Production Repository

- **GitHub:** https://github.com/mohan1411/taskmaster-mvp
- **Production Domain:** fizztask.com

## Notes

- This environment is set up for development with localhost URLs
- All production environment variables are preserved but set to development values
- No changes have been made to the codebase - this is a fresh clone from GitHub