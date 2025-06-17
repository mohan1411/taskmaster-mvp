# FizzTask Deployment Guide for fizztask.com

This guide provides comprehensive instructions for deploying FizzTask to the fizztask.com domain.

## 📋 Prerequisites

- Domain: fizztask.com (purchased)
- Hosting provider (e.g., DigitalOcean, AWS, Netlify, Vercel)
- MongoDB Atlas account
- Google OAuth credentials for fizztask.com domain
- Email service (Gmail, SendGrid, etc.)
- SSL certificate (automatically handled by most providers)

## 🚀 Deployment Steps

### 1. Environment Configuration

#### Backend Production Environment (.env)
```env
# Production Environment Configuration
NODE_ENV=production
PORT=8000

# MongoDB Atlas Production Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fizztask?retryWrites=true&w=majority

# JWT Configuration (Use strong, unique keys)
JWT_SECRET=your_production_jwt_secret_key_minimum_32_characters
JWT_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_production_refresh_token_secret_key_minimum_32_characters
REFRESH_TOKEN_EXPIRY=7d

# Google OAuth Configuration for fizztask.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://fizztask.com/api/auth/google/callback

# Production URLs
FRONTEND_URL=https://fizztask.com
APP_URL=https://fizztask.com

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@fizztask.com

# CORS Configuration
ALLOWED_ORIGINS=https://fizztask.com,https://www.fizztask.com

# Debug Configuration
DEBUG=false
```

#### Frontend Production Environment (.env.local)
```env
# Production Environment Configuration
REACT_APP_API_URL=https://fizztask.com
REACT_APP_APP_NAME=FizzTask
REACT_APP_APP_VERSION=1.0.0
REACT_APP_DOMAIN=fizztask.com
REACT_APP_ENVIRONMENT=production

# OAuth Configuration
REACT_APP_OAUTH_REDIRECT_URI=https://fizztask.com/auth/callback

# Email Configuration
REACT_APP_CONTACT_EMAIL=support@fizztask.com

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_NOTIFICATIONS=true

# Optional: Google Analytics
REACT_APP_GA_TRACKING_ID=your_google_analytics_id
```

### 2. Database Setup

#### MongoDB Atlas Configuration
1. Create a production cluster on MongoDB Atlas
2. Create a database user with read/write permissions
3. Whitelist your server IP addresses
4. Update the MONGODB_URI in your production environment

### 3. Google OAuth Setup

#### Update Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Update your OAuth 2.0 Client ID:
   - **Authorized JavaScript origins**: 
     - `https://fizztask.com`
     - `https://www.fizztask.com`
   - **Authorized redirect URIs**:
     - `https://fizztask.com/api/auth/google/callback`
     - `https://fizztask.com/auth/callback`

### 4. DNS Configuration

#### Domain Settings
Set up the following DNS records for fizztask.com:
```
A     @           [Your server IP]
A     www         [Your server IP]
CNAME api         fizztask.com
```

### 5. SSL Certificate

Most hosting providers automatically provide SSL certificates. Ensure HTTPS is enabled for:
- `https://fizztask.com`
- `https://www.fizztask.com`

### 6. Deployment Options

#### Option A: Single Server Deployment (Recommended for MVP)
Deploy both frontend and backend to the same server:

```bash
# Build frontend
cd frontend
npm run build

# Copy build files to backend public directory
cp -r build/* ../backend/public/

# Deploy backend with static file serving
cd ../backend
npm start
```

#### Option B: Separate Deployment
- Frontend: Deploy to Netlify, Vercel, or similar
- Backend: Deploy to DigitalOcean, AWS, or similar

### 7. Server Configuration

#### Nginx Configuration (if using)
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name fizztask.com www.fizztask.com;
    
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Redirect HTTP to HTTPS
    if ($scheme != "https") {
        return 301 https://$server_name$request_uri;
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files
    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }
}
```

### 8. Build and Deploy Scripts

#### Update package.json scripts:
```json
{
  "scripts": {
    "build": "cd frontend && npm run build",
    "deploy": "npm run build && pm2 restart fizztask",
    "start:prod": "NODE_ENV=production node backend/server.js"
  }
}
```

### 9. Process Management

#### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start backend/server.js --name "fizztask"

# Save PM2 configuration
pm2 save

# Enable PM2 startup
pm2 startup
```

### 10. Monitoring and Logging

#### Basic Monitoring Setup
```bash
# View logs
pm2 logs fizztask

# Monitor performance
pm2 monit

# Restart application
pm2 restart fizztask
```

### 11. Security Checklist

- [ ] HTTPS enabled for all domains
- [ ] Strong JWT secrets (32+ characters)
- [ ] MongoDB Atlas with IP whitelisting
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Regular security updates

### 12. Email Configuration

#### Gmail App Password Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security > App passwords
   - Generate password for "Mail"
3. Use this password in EMAIL_PASSWORD environment variable

### 13. Testing Production Deployment

#### Pre-deployment Testing
```bash
# Test backend API
curl https://fizztask.com/api/auth/status

# Test frontend
curl https://fizztask.com

# Test OAuth flow
# Visit: https://fizztask.com/login
```

### 14. Post-Deployment Steps

1. **Create Admin User**:
   ```bash
   cd backend
   node create-admin-fixed.js
   ```

2. **Test Core Features**:
   - User registration/login
   - Task creation
   - Email integration
   - Follow-up reminders

3. **Monitor Performance**:
   - Check server logs
   - Monitor API response times
   - Verify database connections

### 15. Backup Strategy

#### Database Backup
```bash
# MongoDB Atlas automatic backups are enabled by default
# Additional manual backup:
mongodump --uri="your_production_mongodb_uri" --out=backup_$(date +%Y%m%d)
```

#### Application Backup
```bash
# Backup application files
tar -czf fizztask_backup_$(date +%Y%m%d).tar.gz /path/to/fizztask/
```

### 16. Domain Email Setup

#### Set up email forwarding:
- `support@fizztask.com` → your main email
- `noreply@fizztask.com` → configured in email settings

### 17. Analytics and Monitoring

#### Google Analytics Setup
1. Create Google Analytics property for fizztask.com
2. Add tracking ID to REACT_APP_GA_TRACKING_ID
3. Verify tracking is working

### 18. Troubleshooting

#### Common Issues:
1. **CORS Errors**: Check ALLOWED_ORIGINS configuration
2. **OAuth Issues**: Verify Google Console settings
3. **Database Connection**: Check MongoDB Atlas IP whitelist
4. **SSL Issues**: Verify certificate installation

#### Debugging Commands:
```bash
# Check application status
pm2 status

# View error logs
pm2 logs fizztask --err

# Test API endpoints
curl -v https://fizztask.com/api/auth/status
```

### 19. Performance Optimization

#### Production Optimizations:
- Enable gzip compression
- Implement caching headers
- Optimize images and assets
- Use CDN for static assets (optional)

### 20. Maintenance

#### Regular Maintenance Tasks:
- Monitor server resources
- Update dependencies
- Backup database regularly
- Monitor application logs
- Update SSL certificates (if manual)

## 🎉 Deployment Complete!

After following these steps, FizzTask should be successfully deployed to fizztask.com with:
- Secure HTTPS connections
- Working OAuth integration
- Database connectivity
- Email functionality
- Proper monitoring and logging

## 📞 Support

For deployment issues, check:
1. Server logs: `pm2 logs fizztask`
2. Database connectivity
3. Environment variable configuration
4. Domain DNS settings

---

**FizzTask Production Deployment Guide v1.0**  
Last updated: May 28, 2025
