# 🚀 Configure Vercel for React Frontend

## Steps to Complete in Vercel Dashboard:

### 1. Update Project Settings
Go to your Vercel project dashboard and update:

1. **General Settings**:
   - Framework Preset: `Create React App`
   - Root Directory: `./` (leave as default)
   - Include source files outside of Root Directory: `unchecked`

2. **Build & Output Settings**:
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/build`
   - Install Command: `npm install`

### 2. Add Environment Variables
In the Environment Variables section, add:

```
REACT_APP_API_URL = https://[your-railway-backend].railway.app
```

Replace `[your-railway-backend]` with your actual Railway URL.

### 3. Redeploy
After making these changes:
1. Go to Deployments tab
2. Click on the three dots next to the latest deployment
3. Select "Redeploy"

## What This Does:

- **Vercel** will now:
  - Build the React app from the `/frontend` folder
  - Serve it at fizztask.com
  - Use the Railway backend for all API calls

- **Railway** will:
  - Only serve the backend API
  - Handle all requests to `/api/*`

## Verify It's Working:

1. After deployment, visit https://fizztask.com
2. You should see the React app login page (not the template)
3. Check browser console - no `%PUBLIC_URL%` errors
4. Try logging in - it should connect to your Railway backend

## If You Need the Landing Page:

Since Vercel is now serving the app, you can:
1. Create a new Vercel project for the landing page
2. Point it to the same repo but configure it to serve from `/public`
3. Use a subdomain like `landing.fizztask.com`

## Troubleshooting:

If the build fails:
- Check Vercel build logs for specific errors
- Common issues:
  - Missing dependencies
  - Environment variables not set
  - Build command syntax

If you see CORS errors:
- Make sure your Railway backend has `ALLOWED_ORIGINS` set to include `https://fizztask.com`
