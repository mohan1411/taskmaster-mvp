# 🚨 EMERGENCY: FizzTask.com Production Down

## Quick Diagnosis Steps:

### 1. Check Railway Backend
- Go to: https://railway.app/dashboard
- Look for:
  - Service crash/restart loops
  - Out of memory errors
  - Environment variable issues
  - MongoDB connection failures

### 2. Check Frontend Hosting (Vercel/Netlify)
- Check deployment status
- Look for build failures
- Verify environment variables

### 3. Check MongoDB Atlas
- Go to: https://cloud.mongodb.com
- Verify:
  - Cluster is running
  - IP whitelist includes Railway
  - Connection limits not exceeded

### 4. Test Endpoints
```bash
# Test backend API
curl -I https://[your-backend-url]/api/auth/status

# Test frontend
curl -I https://fizztask.com

# Check DNS
nslookup fizztask.com
```

## Common Issues & Solutions:

### A. Railway Backend Crashed
**Symptoms**: API not responding, 502/503 errors
**Fix**:
1. Restart service in Railway dashboard
2. Check logs for specific errors
3. Common issues:
   - `MONGODB_URI` connection string invalid
   - Missing environment variables
   - Port binding issues

### B. Environment Variable Issues
**Check these in Railway**:
```
NODE_ENV=production
PORT=8000
MONGODB_URI=<your-atlas-connection-string>
JWT_SECRET=<your-secret>
FRONTEND_URL=https://fizztask.com
ALLOWED_ORIGINS=https://fizztask.com,https://www.fizztask.com
```

### C. MongoDB Connection Issues
**Fix**:
1. Go to MongoDB Atlas
2. Network Access → Add current Railway IP
3. Or temporarily allow all IPs: 0.0.0.0/0
4. Check connection string format

### D. CORS Issues
**Symptoms**: Frontend can't connect to backend
**Fix**:
1. Verify `ALLOWED_ORIGINS` in Railway includes your frontend URL
2. Check `FRONTEND_URL` matches exactly
3. Restart Railway service after changes

## Emergency Recovery:

### Option 1: Quick Restart
```bash
# In Railway dashboard:
1. Click on your service
2. Settings → Restart
3. Watch logs for errors
```

### Option 2: Rollback Deployment
```bash
# In Railway:
1. Deployments tab
2. Find last working deployment
3. Click "Redeploy"
```

### Option 3: Local Emergency Deploy
```bash
# If you need to push fixes:
git add .
git commit -m "Emergency fix for production"
git push origin main

# Railway will auto-deploy
```

## Contact Support:
- Railway: support@railway.app
- MongoDB Atlas: Through dashboard chat
- Vercel: Through dashboard support

## Prevention:
1. Set up monitoring (UptimeRobot)
2. Configure alerts in Railway
3. Regular backups of MongoDB
4. Keep local .env files updated
