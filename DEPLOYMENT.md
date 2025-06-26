# FizzTask Production Deployment Guide

## Overview
This guide outlines the steps to deploy FizzTask to production.

## Prerequisites
- Node.js 18+ and npm installed
- MongoDB Atlas account and cluster set up
- Google OAuth2 credentials configured for production domain
- Production domain (e.g., fizztask.com) configured
- SSL certificate for HTTPS

## Deployment Steps

### 1. Prepare Production Environment

#### Backend Configuration
1. Copy `.env.production.example` to `.env.production`
2. Fill in all production values:
   - Generate secure JWT secrets using:
     ```bash
     node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     ```
   - Add MongoDB Atlas connection string
   - Add Google OAuth production credentials
   - Update all URLs to production domain

#### Frontend Configuration
1. Update API endpoints in frontend code to point to production API
2. Ensure all environment-specific configurations use production values

### 2. Build Frontend
```bash
cd frontend
npm install --production
npm run build
```

### 3. Deploy Backend
```bash
cd backend
npm install --production
```

### 4. Database Setup
1. Ensure MongoDB Atlas cluster is running
2. Create database indexes:
   ```bash
   npm run create-indexes
   ```

### 5. Server Configuration
Configure your web server (nginx/Apache) to:
- Serve frontend build files
- Proxy API requests to backend port
- Enable HTTPS with SSL certificate
- Set up proper CORS headers

Example nginx configuration:
```nginx
server {
    listen 443 ssl http2;
    server_name fizztask.com www.fizztask.com;
    
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    
    # Frontend
    location / {
        root /path/to/frontend/build;
        try_files $uri /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. Process Management
Use PM2 or similar to manage the Node.js process:
```bash
npm install -g pm2
pm2 start backend/server.js --name fizztask-api
pm2 save
pm2 startup
```

### 7. Post-Deployment Checklist
- [ ] Verify all environment variables are set correctly
- [ ] Test OAuth2 login flow
- [ ] Test email synchronization
- [ ] Verify focus mode functionality
- [ ] Check mobile responsiveness
- [ ] Monitor error logs
- [ ] Set up backup strategy for MongoDB
- [ ] Configure monitoring and alerting

## Security Considerations
- Never commit `.env.production` to version control
- Use strong, unique JWT secrets
- Enable HTTPS for all traffic
- Keep dependencies updated
- Implement rate limiting
- Set up proper CORS configuration
- Use MongoDB connection with SSL

## Rollback Plan
If issues arise:
1. Keep previous build artifacts
2. Database backups before deployment
3. Quick rollback procedure:
   ```bash
   pm2 stop fizztask-api
   # Restore previous build
   pm2 restart fizztask-api
   ```

## Monitoring
- Set up application monitoring (e.g., PM2 Plus, New Relic)
- Configure error tracking (e.g., Sentry)
- Monitor server resources
- Set up uptime monitoring

## Maintenance
- Regular security updates
- Database backups
- Log rotation
- Performance monitoring