# 🚀 Deployment Guide

This guide will help you deploy your AI Document Analyser app for FREE using Vercel (Frontend) and Render (Backend).

## 📋 Prerequisites

- [x] GitHub account with your code pushed
- [x] Groq API Key (from console.groq.com)
- [ ] Vercel account (free - sign up with GitHub)
- [ ] Render account (free - sign up with GitHub)

## 🎯 Deployment Steps

### Step 1: Deploy Backend to Render

1. **Go to [Render.com](https://render.com)**
   - Click "Get Started for Free"
   - Sign in with your GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `sujithsa007-ai-doc-analyser`
   - Grant Render access to your repository

3. **Configure the Service**
   - **Name**: `ai-doc-analyser-backend`
   - **Region**: Oregon (US West) - or closest to you
   - **Branch**: `develop`
   - **Root Directory**: `ai-doc-analyser-backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable":
   
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `GROQ_API_KEY` | `your_groq_api_key_here` |
   | `CORS_ORIGINS` | `https://ai-doc-analyser.vercel.app` (update after frontend deploy) |

5. **Deploy**
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment
   - Your backend URL will be: `https://ai-doc-analyser-backend.onrender.com`
   - Test it: Visit `https://ai-doc-analyser-backend.onrender.com/health`

---

### Step 2: Deploy Frontend to Vercel

1. **Go to [Vercel.com](https://vercel.com)**
   - Click "Sign Up" (use your GitHub account)
   - Authorize Vercel to access your repositories

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Find and import: `sujithsa007-ai-doc-analyser`
   - Click "Import"

3. **Configure the Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `ai-doc-analyser-frontend` (click "Edit")
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   
   | Name | Value |
   |------|-------|
   | `VITE_API_URL` | `https://ai-doc-analyser-backend.onrender.com` |
   | `VITE_ENV` | `production` |

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build and deployment
   - Your app will be live at: `https://ai-doc-analyser.vercel.app`

---

### Step 3: Update CORS Settings

1. **Go back to Render Dashboard**
   - Find your backend service
   - Click "Environment" tab
   - Update `CORS_ORIGINS` to your actual Vercel URL
   - Example: `https://ai-doc-analyser-xyz123.vercel.app`
   - Click "Save Changes" (this will trigger a redeploy)

2. **Alternative: Update .env file**
   Or update your backend `.env` file and push to GitHub:
   ```bash
   CORS_ORIGINS=https://your-actual-vercel-url.vercel.app
   ```

---

## ✅ Verify Deployment

### Backend Health Check
```bash
curl https://ai-doc-analyser-backend.onrender.com/health
```
Expected response:
```json
{"status":"ok","message":"AI Document Analyser backend is operational"}
```

### Frontend Access
1. Open your Vercel URL in browser
2. Upload a test document
3. Ask a question
4. You should get AI response in 2-5 seconds!

---

## 🔄 Automatic Deployments

Both platforms are now configured for automatic deployments:

- **Push to `develop` branch** = Automatic deployment
- **Render**: Auto-deploys backend on push
- **Vercel**: Auto-deploys frontend on push

---

## 🌐 Custom Domain (Optional)

### Vercel Custom Domain
1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### Render Custom Domain
1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain
4. Configure DNS records

---

## 💡 Important Notes

### Render Free Tier Limitations
- ⚠️ **Sleeps after 15 min inactivity**
- ⏰ **~30 second wake-up time** on first request
- ✅ **750 hours/month** (enough for 24/7 if you have one service)
- 💾 **Disk not persistent** (don't store files)

### Keep Backend Awake (Optional)
Use a free service like [UptimeRobot](https://uptimerobot.com):
1. Sign up free
2. Add monitor with your backend URL
3. Ping every 5 minutes
4. Your backend stays awake!

---

## 🐛 Troubleshooting

### Backend not responding
- Check Render logs: Dashboard → Logs
- Verify environment variables are set
- Ensure GROQ_API_KEY is valid

### Frontend can't connect to backend
- Check CORS_ORIGINS matches your Vercel URL exactly
- Verify VITE_API_URL in Vercel environment variables
- Check browser console for errors

### Build failures
- Check build logs in respective platform
- Ensure all dependencies are in package.json
- Verify Node version compatibility

---

## 📊 Monitoring Your App

### Vercel Analytics (Free)
- Enable in project settings
- See page views, performance, etc.

### Render Logs
- View in real-time from dashboard
- Check for errors and API usage

---

## 🎉 You're Live!

Your app is now deployed and accessible worldwide for FREE! 🌍

**Share your links:**
- Frontend: `https://your-app.vercel.app`
- Backend API: `https://your-backend.onrender.com`

---

## 🔧 Need Help?

If you encounter any issues:
1. Check the logs in Render/Vercel dashboards
2. Verify environment variables
3. Test backend health endpoint
4. Check browser console for frontend errors

Happy deploying! 🚀
