# 🚀 Free Deployment Guide (No Credit Card Required)

Deploy your AI Document Analyser app **100% FREE** without any credit card using Railway + Vercel.

## 🎯 Quick Deploy (5 Minutes Total)

### **Step 1: Deploy Backend to Railway** (3 minutes)

Railway gives you **$5 credit per month** (renews monthly) - NO CREDIT CARD NEEDED!

1. **Go to [Railway.app](https://railway.app)**
   - Click **"Start a New Project"**
   - Click **"Login with GitHub"** → Authorize Railway

2. **Deploy from GitHub**
   - Click **"Deploy from GitHub repo"**
   - Select: **`sujithsa007-ai-doc-analyser`**
   - Railway will detect your repository

3. **Configure Backend Service**
   - Railway will show a deployment dialog
   - Click **"Add variables"**
   - Add these environment variables:
     ```
     GROQ_API_KEY=your_groq_api_key_here
     NODE_ENV=production
     PORT=5000
     ```

4. **Set Root Directory**
   - Click on your service
   - Go to **Settings** → **Service**
   - Set **Root Directory**: `ai-doc-analyser-backend`
   - Click **"Save"**

5. **Deploy!**
   - Railway will automatically deploy
   - Wait 2-3 minutes
   - Click on **"Settings"** → **"Networking"**
   - Click **"Generate Domain"**
   - You'll get: `https://ai-doc-analyser-backend-production.up.railway.app`

6. **Test Your Backend**
   - Open: `https://your-backend-url.up.railway.app/health`
   - You should see: `{"status":"ok","message":"AI Document Analyser backend is operational"}`

---

### **Step 2: Deploy Frontend to Vercel** (2 minutes)

Vercel is **100% free** - NO CREDIT CARD REQUIRED!

1. **Go to [Vercel.com](https://vercel.com)**
   - Click **"Sign Up"** 
   - Choose **"Continue with GitHub"**
   - Authorize Vercel

2. **Import Your Project**
   - Click **"Add New..."** → **"Project"**
   - Find: **`sujithsa007-ai-doc-analyser`**
   - Click **"Import"**

3. **Configure Build Settings**
   ```
   Framework Preset: Vite
   Root Directory: ai-doc-analyser-frontend (Click "Edit" to change)
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Add Environment Variable**
   - Click **"Environment Variables"**
   - Add:
     ```
     Name: VITE_API_URL
     Value: https://your-railway-backend-url.up.railway.app
     ```
   - Example: `https://ai-doc-analyser-backend-production.up.railway.app`

5. **Deploy!**
   - Click **"Deploy"**
   - Wait 2-3 minutes
   - Your app will be live at: `https://your-project.vercel.app`

---

## ✅ **You're Done!**

Your app is now **LIVE and FREE** at:
- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://your-backend.up.railway.app`

---

## 🔧 **Update CORS (Important!)**

After deployment, update your backend CORS settings:

1. **Go to Railway Dashboard**
2. **Click on your backend service**
3. **Click "Variables"**
4. **Add new variable**:
   ```
   CORS_ORIGINS=https://your-vercel-app.vercel.app
   ```
5. **Click "Deploy"** (redeploys automatically)

---

## 💡 **Alternative: Use Vercel for Both (100% Free)**

If you want everything on one platform:

### **Deploy Both on Vercel:**

1. **Backend as Vercel Serverless Function**
   - I can convert your Express app to Vercel serverless
   - 100% free, no credit card
   - Would you like me to do this?

---

## 🎁 **Other Free Alternatives (No Credit Card)**

### **1. Cyclic.sh** (No Credit Card)
- Unlimited apps
- Auto-deploy from GitHub
- 10,000 requests/month free
- Go to: [cyclic.sh](https://cyclic.sh)

### **2. Fly.io** (No Credit Card for trial)
- $5 credit/month
- 3 shared VMs free
- Go to: [fly.io](https://fly.io)

### **3. Netlify** (Frontend + Functions)
- 100% free
- Can host both frontend and backend
- Go to: [netlify.com](https://netlify.com)

---

## 📊 **Free Tier Comparison**

| Platform | Free Tier | Credit Card | Best For |
|----------|-----------|-------------|----------|
| **Railway** | $5/month credit | ❌ Not required | Backend ⭐ |
| **Vercel** | Generous limits | ❌ Not required | Frontend ⭐ |
| **Cyclic** | Unlimited apps | ❌ Not required | Both |
| **Fly.io** | $5/month credit | ⚠️ Sometimes | Backend |
| **Render** | 750 hrs/month | ⚠️ **Required** | ❌ Skip |

---

## 🚀 **Quick Start Commands (If you prefer CLI)**

### **Install Railway CLI:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
cd ai-doc-analyser-backend
railway link

# Add environment variables
railway variables set GROQ_API_KEY=your_groq_api_key_here

# Deploy
railway up
```

### **Install Vercel CLI:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy frontend
cd ai-doc-analyser-frontend
vercel

# Set environment variable
vercel env add VITE_API_URL
# Paste your Railway backend URL when prompted

# Deploy to production
vercel --prod
```

---

## 🐛 **Troubleshooting**

### Railway Issues:
- **Service won't start**: Check logs in Railway dashboard
- **Port issues**: Railway auto-assigns PORT, your app uses process.env.PORT ✅
- **Environment variables**: Make sure GROQ_API_KEY is set

### Vercel Issues:
- **Build fails**: Check build logs, ensure Root Directory is set correctly
- **API calls fail**: Verify VITE_API_URL is set correctly
- **CORS errors**: Update CORS_ORIGINS in Railway backend

---

## 🎉 **Success Checklist**

- ✅ Backend deployed on Railway
- ✅ Frontend deployed on Vercel  
- ✅ Backend health check works
- ✅ Environment variables set
- ✅ CORS configured
- ✅ App is accessible worldwide
- ✅ **$0/month cost!**

---

## 💬 **Need Help?**

Both platforms have great documentation:
- Railway: [docs.railway.app](https://docs.railway.app)
- Vercel: [vercel.com/docs](https://vercel.com/docs)

Happy deploying! 🚀
