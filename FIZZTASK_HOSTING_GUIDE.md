# FizzTask Hosting Setup Guide - From Domain to Live Site

## 🎯 Current Status
- ✅ Domain purchased: fizztask.com
- ✅ Application ready: FizzTask codebase updated
- 🔲 **Next Step**: Choose hosting and deploy

## 🏗️ Hosting Options (Recommended Order)

### **Option 1: Vercel + Railway (Easiest - Recommended for MVP)**
**Best for**: Quick deployment, automatic scaling, great for React apps
**Cost**: ~$20-30/month
**Setup Time**: 30 minutes

#### **Frontend (Vercel)**
1. **Connect Domain to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add fizztask.com domain in Project Settings
   - Vercel will handle SSL automatically

2. **Backend (Railway)**
   - Go to [railway.app](https://railway.app)
   - Deploy backend from GitHub
   - Get your Railway backend URL
   - Update frontend environment variables

#### **Setup Steps:**
```bash
# 1. Update frontend/.env.local
REACT_APP_API_URL=https://your-backend.railway.app

# 2. Deploy frontend to Vercel
# 3. Deploy backend to Railway
# 4. Update domain settings
```

---

### **Option 2: Netlify + Heroku (Popular Choice)**
**Best for**: Static sites with API backend
**Cost**: ~$15-25/month
**Setup Time**: 45 minutes

#### **Frontend (Netlify)**
- Connect GitHub repo to Netlify
- Add fizztask.com domain
- Automatic builds and SSL

#### **Backend (Heroku)**
- Deploy Node.js backend to Heroku
- Add MongoDB Atlas add-on
- Configure environment variables

---

### **Option 3: DigitalOcean Droplet (Full Control)**
**Best for**: Custom server setup, full control
**Cost**: $12-20/month
**Setup Time**: 2-3 hours

#### **Server Setup**
1. Create Ubuntu droplet
2. Install Node.js, Nginx, PM2
3. Configure domain and SSL
4. Deploy application

---

### **Option 4: AWS (Enterprise Grade)**
**Best for**: Large scale, enterprise requirements
**Cost**: Variable, can be expensive
**Setup Time**: 3-4 hours

## 🚀 **RECOMMENDED: Quick Start with Vercel + Railway**

Let me create step-by-step instructions for the easiest deployment:

### **Step 1: Prepare Your Code**

1. **Push to GitHub** (if not already done):
```bash
git add .
git commit -m "FizzTask domain migration complete"
git push origin main
```

2. **Create Environment Files**:
   - Copy `backend/.env.production` to `backend/.env`
   - Copy `frontend/.env.production` to `frontend/.env.local`
   - Fill in your actual values

### **Step 2: Deploy Backend to Railway**

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect it's a Node.js app
5. Add these environment variables in Railway dashboard:
   ```
   NODE_ENV=production
   PORT=8000
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_strong_jwt_secret
   OPENAI_API_KEY=your_openai_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_USER=your_gmail_address
   EMAIL_PASSWORD=your_gmail_app_password
   EMAIL_FROM=noreply@fizztask.com
   FRONTEND_URL=https://fizztask.com
   ALLOWED_ORIGINS=https://fizztask.com,https://www.fizztask.com
   ```
6. Set **Root Directory** to `backend`
7. Set **Start Command** to `node server.js`
8. Deploy and note your Railway URL (e.g., `https://fizztask-backend-production.railway.app`)

### **Step 3: Deploy Frontend to Vercel**

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "New Project" → Import from GitHub
3. Select your repository
4. Set **Root Directory** to `frontend`
5. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-railway-backend-url.railway.app
   ```
6. Deploy (Vercel will auto-build React app)

### **Step 4: Connect Your Domain**

1. **In Vercel Dashboard**:
   - Go to Project Settings → Domains
   - Add `fizztask.com` and `www.fizztask.com`
   
2. **In Your Domain Registrar** (where you bought fizztask.com):
   - Add these DNS records:
   ```
   Type: A     Name: @     Value: 76.76.19.61
   Type: A     Name: www   Value: 76.76.19.61
   Type: CNAME Name: www   Value: fizztask.com
   ```
   (Vercel will provide the exact IPs in their dashboard)

3. **SSL Certificate**: Automatically handled by Vercel

### **Step 5: Update Google OAuth**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID:
   - **Authorized JavaScript origins**:
     - `https://fizztask.com`
     - `https://www.fizztask.com`
   - **Authorized redirect URIs**:
     - `https://your-railway-backend-url.railway.app/api/auth/google/callback`

### **Step 6: Set Up Database**

1. **MongoDB Atlas**:
   - Create free cluster at [mongodb.com](https://www.mongodb.com/atlas)
   - Create database user
   - Whitelist Railway's IP (or use 0.0.0.0/0 for development)
   - Get connection string
   - Update `MONGODB_URI` in Railway

### **Step 7: Test Everything**

1. Visit `https://fizztask.com`
2. Test user registration
3. Test Google OAuth login
4. Test task creation
5. Test email notifications

## 📋 **Environment Variables Checklist**

### **Backend (Railway)**
```bash
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fizztask
JWT_SECRET=your_32_character_secret_key_here
REFRESH_TOKEN_SECRET=your_32_character_refresh_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OPENAI_API_KEY=sk-your_openai_api_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@fizztask.com
FRONTEND_URL=https://fizztask.com
APP_URL=https://fizztask.com
ALLOWED_ORIGINS=https://fizztask.com,https://www.fizztask.com
```

### **Frontend (Vercel)**
```bash
REACT_APP_API_URL=https://your-backend.railway.app
REACT_APP_APP_NAME=FizzTask
REACT_APP_DOMAIN=fizztask.com
REACT_APP_ENVIRONMENT=production
```

## 🎯 **Alternative: All-in-One Solutions**

### **Netlify (Frontend + Functions)**
- Deploy frontend to Netlify
- Use Netlify Functions for backend API
- More complex but single provider

### **Vercel (Full Stack)**
- Deploy both frontend and API routes to Vercel
- Use Vercel's serverless functions
- Requires code restructuring

## 💰 **Cost Breakdown (Monthly)**

### **Vercel + Railway (Recommended)**
- Vercel Pro: $20/month (includes custom domain)
- Railway: $5-10/month (based on usage)
- MongoDB Atlas: Free tier or $9/month
- **Total: ~$25-40/month**

### **Alternative Budget Option**
- Netlify: $19/month
- Heroku: $7/month
- MongoDB Atlas: Free
- **Total: ~$26/month**

## ⚡ **Quick Deploy Commands**

If you choose the Vercel + Railway option, here are the commands:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel --prod

# The backend will be deployed through Railway's web interface
```

## 🔧 **Pre-Deployment Checklist**

- [ ] GitHub repository is up to date
- [ ] Environment variables are prepared
- [ ] Domain DNS is ready to update
- [ ] Google OAuth settings are ready to update
- [ ] MongoDB Atlas cluster is created
- [ ] Gmail app password is generated

## 🚨 **Important Notes**

1. **DNS Propagation**: Can take 24-48 hours for domain to fully propagate
2. **SSL Certificates**: Automatically handled by Vercel/Netlify
3. **Environment Secrets**: Never commit `.env` files to git
4. **CORS**: Make sure your frontend and backend URLs match exactly
5. **OAuth**: Update callback URLs immediately after deployment

## 📞 **Need Help?**

If you run into issues:
1. Check the logs in Railway/Vercel dashboard
2. Verify environment variables are set correctly
3. Test API endpoints directly (use curl or Postman)
4. Check domain DNS settings

Would you like me to help you with any specific hosting provider setup, or do you have a preference for which option to use?
