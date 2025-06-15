# FizzTask Landing Page Deployment Guide

## Project Structure
```
/public
  /images          # Place your dashboard screenshots here
  index.html       # Landing page (formerly fizztask-landing-page.html)
landing-server.js  # Express server for Railway
vercel.json        # Vercel configuration
```

## Option 1: Deploy to Vercel (Recommended for Landing Page)

### Steps:
1. **Add images to public/images folder**
   - Save your dashboard screenshot as `dashboard-screenshot.png`
   - Place it in `/public/images/`
   - Update the image path in index.html to: `images/dashboard-screenshot.png`

2. **Commit and push to GitHub**
   ```bash
   git add public/ vercel.json
   git commit -m "Add landing page with images"
   git push origin main
   ```

3. **Deploy to Vercel**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Select the repository: `mohan1411/taskmaster-mvp`
   - Configure:
     - Framework Preset: Other
     - Root Directory: `./`
     - Build Command: (leave empty)
     - Output Directory: `public`
   - Click Deploy

4. **Set up custom domain (optional)**
   - In Vercel dashboard, go to Settings > Domains
   - Add your domain (e.g., fizztask.com or landing.fizztask.com)

## Option 2: Deploy to Railway

### Steps:
1. **Update package.json** to include landing page script:
   ```json
   "scripts": {
     "start": "node backend/server.js",
     "start:landing": "node landing-server.js"
   }
   ```

2. **Create Railway service**
   - Go to https://railway.app
   - Create new service from GitHub repo
   - Configure:
     - Start Command: `npm run start:landing`
     - Port: 3000
   - Deploy

## Option 3: Deploy Both (Landing + App)

### For separated deployment:
- **Landing page on Vercel**: fizztask.com
- **App on Railway**: app.fizztask.com

### Environment Variables:
Add to Railway/Vercel:
- `APP_URL`: https://app.fizztask.com (or your app URL)

## Quick Deploy Script

Run this to prepare for deployment:

```bash
# 1. Add your dashboard screenshot
# Copy your screenshot to: public/images/dashboard-screenshot.png

# 2. Update the image path in index.html
# Change line 369 from the placeholder to:
# <img src="images/dashboard-screenshot.png" alt="FizzTask Dashboard" style="width: 100%; height: auto; display: block; border-radius: 10px;">

# 3. Commit and push
git add public/ vercel.json landing-server.js
git commit -m "Add landing page with dashboard screenshot"
git push origin main

# 4. Deploy to Vercel
# Go to vercel.com and import the repository
```

## Testing Locally

```bash
# Test the landing page locally
npx http-server public -p 8080

# Or with the Express server
node landing-server.js
```

## Important Notes:

1. **Image Optimization**: Compress your dashboard screenshot for faster loading
2. **SEO**: The landing page includes meta tags, but you may want to add:
   - Open Graph tags for social sharing
   - Google Analytics
   - Favicon

3. **Security**: The landing page is static and secure. No sensitive data is exposed.

4. **Updates**: To update the landing page, just modify `/public/index.html` and redeploy.

## Recommended Approach:

**Use Vercel for the landing page** because:
- It's optimized for static sites
- Free tier is generous
- Automatic HTTPS
- Global CDN
- Easy custom domain setup
- Automatic deployments from GitHub

**Keep Railway for your app** (backend + frontend) as it's better for full-stack applications.
