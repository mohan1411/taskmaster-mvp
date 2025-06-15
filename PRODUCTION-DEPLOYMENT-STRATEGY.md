# 🚀 FizzTask Production Deployment Strategy

## Current Situation
- **Production**: Running stable version (before landing page addition)
- **Development**: Has new features ready to deploy
- **Issue**: Railway crashes when deploying with landing folder

## Root Cause
Railway tries to build the entire repository including the `landing` folder, which causes conflicts. The `.railwayignore` file might not be working as expected.

## Safe Deployment Strategy

### Pre-Deployment Checklist
- [ ] Backup current production database
- [ ] Document all new environment variables needed
- [ ] Test all features in development environment
- [ ] Ensure all required files are committed to git
- [ ] Have rollback plan ready

### Option 1: Separate Branches (Recommended)
Create a production branch without the landing folder:

```bash
# Create production branch
git checkout -b production
git rm -r landing/
git commit -m "Remove landing folder for production deployment"
git push origin production

# In Railway: Deploy from 'production' branch instead of 'main'
```

### Option 2: Fix Railway Build Configuration
Update railway.toml to properly exclude landing:

```toml
[build]
builder = "NIXPACKS"
buildCommand = "rm -rf landing && npm install && cd backend && npm install && cd ../frontend && npm install && npm run build && cd .. && mkdir -p backend/public && cp -r frontend/build/* backend/public/"

[deploy]
startCommand = "cd backend && node server.js"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### Option 3: Deploy Script
Create a deployment script that removes landing folder during build:

```bash
#!/bin/bash
# deploy-prod.sh
echo "Preparing production deployment..."
rm -rf landing/
npm install
cd backend && npm install
cd ../frontend && npm install && npm run build
cd ..
mkdir -p backend/public
cp -r frontend/build/* backend/public/
cd backend
node server.js
```

## Deployment Steps (When Ready)

### 1. Test Deployment Locally
```bash
# Simulate Railway build
npm run railway-build
cd backend
node server.js
```

### 2. Update Environment Variables
Ensure Railway has all new variables:
- Any new API keys
- Feature flags
- Configuration changes

### 3. Database Migrations
If there are schema changes:
```bash
# Run migrations before deploying
node backend/migrations/run-migrations.js
```

### 4. Deploy with Monitoring
1. Deploy during low-traffic hours
2. Monitor logs in Railway dashboard
3. Test all critical paths immediately
4. Be ready to rollback if needed

## Features to Deploy (Track Here)
- [ ] Feature 1: ________________
- [ ] Feature 2: ________________
- [ ] Feature 3: ________________
- [ ] Bug fixes: ________________

## Rollback Plan
If deployment fails:
1. In Railway: Go to Deployments → Previous Working Deployment → Redeploy
2. Verify all services are running
3. Investigate logs to understand failure
4. Fix issues in development first

## Testing After Deployment
- [ ] User login/logout
- [ ] Email sync
- [ ] Task creation from emails
- [ ] All new features
- [ ] API endpoints
- [ ] Frontend routing

## Long-term Solution
Consider using:
1. **Monorepo tools** like Turborepo or Nx
2. **Separate repositories** for landing and app
3. **GitHub Actions** for custom deployment pipelines
4. **Docker** for consistent deployments

## Important Notes
- Always deploy to staging/development first
- Keep production branch separate from development
- Document all environment variable changes
- Test rollback procedure regularly
- Monitor error rates after deployment

## When You're Ready to Deploy
1. Review this checklist
2. Choose deployment option (separate branch recommended)
3. Deploy during low-traffic period
4. Monitor closely for 30 minutes post-deployment
