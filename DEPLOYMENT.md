# AI Document Analyser - Deployment Guide

Complete deployment guide for deploying the AI Document Analyser full-stack application.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Backend Deployment (Railway)](#backend-deployment-railway)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Environment Variables](#environment-variables)
- [Testing Deployment](#testing-deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**Architecture:**
- **Backend:** Node.js/Express API deployed on Railway
- **Frontend:** React/Vite SPA deployed on Vercel
- **AI Service:** Groq LLaMA-3.3-70B for document analysis

**Live URLs:**
- Backend: `https://ai-doc-analyser-backend-production.up.railway.app`
- Frontend: `https://sujithsa007-ai-doc-analyser-ai-doc.vercel.app`

---

## ✅ Prerequisites

### Required Accounts:
1. **GitHub Account** - Repository hosting
2. **Railway Account** - Backend deployment (free tier available)
3. **Vercel Account** - Frontend deployment (free tier available)
4. **Groq Account** - AI API access (free tier: 30 requests/min)

### Required Tools:
- Node.js >= 20.19.0
- npm >= 10.0.0
- Git

### API Keys:
- **Groq API Key:** Get from [https://console.groq.com](https://console.groq.com)

---

## 🚀 Backend Deployment (Railway)

### Step 1: Prepare Backend Code

1. **Ensure Required Files Exist:**
   ```
   ai-doc-analyser-backend/
   ├── package.json
   ├── index.js
   ├── app.js
   ├── nixpacks.json
   ├── railway.toml
   └── services/
       └── documentProcessor.js
   ```

2. **Verify Configuration Files:**

   **`ai-doc-analyser-backend/nixpacks.json`:**
   ```json
   {
     "phases": {
       "setup": {
         "nixPkgs": ["nodejs_20"]
       },
       "install": {
         "cmds": ["npm install --omit=dev"]
       },
       "build": {
         "cmds": []
       }
     },
     "start": {
       "cmd": "npm start"
     }
   }
   ```

   **`ai-doc-analyser-backend/railway.toml`:**
   ```toml
   [build]
   builder = "NIXPACKS"

   [deploy]
   startCommand = "npm start"
   restartPolicyType = "ON_FAILURE"
   restartPolicyMaxRetries = 10
   healthcheckPath = "/health"
   healthcheckTimeout = 100

   [env]
   NODE_ENV = "production"
   ```

### Step 2: Deploy to Railway

1. **Login to Railway:**
   - Go to [https://railway.app](https://railway.app)
   - Sign in with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository: `sujithsa007/sujithsa007-ai-doc-analyser`

3. **Configure Service Settings:**
   - Click on the deployed service
   - Go to **Settings** tab
   - Set **Root Directory:** `ai-doc-analyser-backend` (⚠️ **NO LEADING SLASH!**)
   - Set **Watch Paths:** `ai-doc-analyser-backend/**`

4. **Add Environment Variables:**
   - Go to **Variables** tab
   - Add the following variables:

   ```bash
   GROQ_API_KEY=<your-groq-api-key-here>
   NODE_ENV=production
   
   # 🔐 JWT Authentication (REQUIRED!)
   JWT_SECRET=<generate-strong-random-64-char-string>
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d
   
   # CORS Configuration
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```

   **🔑 Generate JWT_SECRET:**
   ```bash
   # Run this locally to generate a strong secret:
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   Copy the output and use it as your `JWT_SECRET` value.

   ⚠️ **CRITICAL SECURITY:**
   - `JWT_SECRET` must be at least 32 characters (64+ recommended)
   - Never commit `JWT_SECRET` to Git or share publicly
   - Update `CORS_ORIGINS` with your actual Vercel frontend URL
   - Without JWT_SECRET, authentication will NOT work

   ⚠️ **IMPORTANT:**
   - **DO NOT** manually set `PORT` - Railway sets this automatically
   - **DO NOT** manually set `HOST` - Code defaults to `0.0.0.0`

5. **Deploy:**
   - Railway will automatically deploy
   - Wait for deployment to complete (~2-3 minutes)

6. **Get Backend URL:**
   - Go to **Settings** → **Networking**
   - Copy the public URL (e.g., `https://ai-doc-analyser-backend-production.up.railway.app`)

### Step 3: Verify Backend Deployment

Test the health endpoint (public, no auth required):
```bash
curl https://ai-doc-analyser-backend-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "AI Document Analyser backend is operational",
  "timestamp": "2025-11-11T12:00:00.000Z",
  "uptime": 123.456,
  "supportedFormats": 34
}
```

### Step 4: Login and Change Default Password

⚠️ **CRITICAL SECURITY STEP** - Do this immediately after deployment!

**Default Admin Credentials:**
- Email: `admin@aidoc.local`
- Password: `Machten@007`

**Login to get access token:**
```bash
curl -X POST https://ai-doc-analyser-backend-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aidoc.local",
    "password": "Machten@007"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "admin@aidoc.local",
    "username": "admin",
    "role": "admin"
  }
}
```

**Change password immediately:**
```bash
curl -X POST https://ai-doc-analyser-backend-production.up.railway.app/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-access-token>" \
  -d '{
    "oldPassword": "Machten@007",
    "newPassword": "YourNewSecurePassword123!"
  }'
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Special characters recommended

💡 **Store your new password securely** (password manager recommended)

---

## 🎨 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend Code

1. **Update Environment Variables:**

   Create/Update `ai-doc-analyser-frontend/.env.production`:
   ```bash
   # Production environment for Vercel deployment
   # Backend API URL - Update with your Railway URL
   VITE_API_URL=https://ai-doc-analyser-backend-production.up.railway.app

   # Production settings
   VITE_ENV=production
   VITE_API_TIMEOUT=120000
   VITE_MAX_PDF_SIZE=50
   ```

2. **Commit Changes:**
   ```bash
   git add ai-doc-analyser-frontend/.env.production
   git commit -m "Update production environment variables"
   git push origin main
   ```

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Login to Vercel:**
   - Go to [https://vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import Project:**
   - Click "Add New Project"
   - Import your GitHub repository: `sujithsa007/sujithsa007-ai-doc-analyser`

3. **Configure Project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `ai-doc-analyser-frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Environment Variables:**
   - Add the following (optional, as `.env.production` is already committed):
   ```
   VITE_API_URL=https://ai-doc-analyser-backend-production.up.railway.app
   VITE_ENV=production
   ```

5. **Deploy:**
   - Click "Deploy"
   - Wait for deployment (~2-3 minutes)

6. **Get Frontend URL:**
   - Copy the deployment URL (e.g., `https://your-app.vercel.app`)

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd ai-doc-analyser-frontend

# Deploy to production
vercel --prod
```

### Step 3: Verify Frontend Deployment

1. Open your Vercel URL in a browser
2. You should see the AI Document Analyser interface
3. Try uploading a document and asking questions

---

## 🔐 Environment Variables

### Backend (Railway)

| Variable | Value | Required | Description |
|----------|-------|----------|-------------|
| `GROQ_API_KEY` | Your Groq API key | ✅ Yes | AI service authentication |
| `NODE_ENV` | `production` | ✅ Yes | Node environment |
| `JWT_SECRET` | 64-char random string | ✅ **YES** | JWT token signing (CRITICAL!) |
| `JWT_ACCESS_EXPIRY` | `15m` | ✅ Yes | Access token lifetime |
| `JWT_REFRESH_EXPIRY` | `7d` | ✅ Yes | Refresh token lifetime |
| `CORS_ORIGINS` | Your Vercel frontend URL | ✅ Yes | CORS allowed origins |
| `PORT` | Auto-set by Railway | ❌ No | Server port (auto) |
| `HOST` | Auto-defaults to `0.0.0.0` | ❌ No | Server host |

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend (Vercel)

| Variable | Value | Required | Description |
|----------|-------|----------|-------------|
| `VITE_API_URL` | Railway backend URL | ✅ Yes | Backend API endpoint |
| `VITE_ENV` | `production` | ⚠️ Optional | Environment name |
| `VITE_API_TIMEOUT` | `120000` | ⚠️ Optional | API timeout (ms) |
| `VITE_MAX_PDF_SIZE` | `50` | ⚠️ Optional | Max file size (MB) |

---

## ✅ Testing Deployment

### Backend Tests

```bash
# Health check (public, no auth)
curl https://ai-doc-analyser-backend-production.up.railway.app/health

# Get supported formats (public, no auth)
curl https://ai-doc-analyser-backend-production.up.railway.app/formats

# Test authentication
curl -X POST https://ai-doc-analyser-backend-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aidoc.local","password":"Machten@007"}'

# Test protected endpoint (should fail without token)
curl -X POST https://ai-doc-analyser-backend-production.up.railway.app/upload \
  -H "Content-Type: multipart/form-data"
# Expected: 401 Unauthorized

# Test with valid token
curl -X POST https://ai-doc-analyser-backend-production.up.railway.app/upload \
  -H "Authorization: Bearer <your-access-token>" \
  -F "file=@test.pdf"
# Expected: 200 OK with document data

# Test CORS
curl -H "Origin: https://your-frontend.vercel.app" \
     https://ai-doc-analyser-backend-production.up.railway.app/health
```

### Frontend Tests

1. **Open frontend URL in browser**
2. **Upload a test document** (PDF, Word, or Image)
3. **Ask a question** about the document
4. **Verify AI response** appears correctly

### Run Test Suite Locally

```bash
# Backend tests
cd ai-doc-analyser-backend
npm run test:run

# Frontend tests
cd ai-doc-analyser-frontend
npm run test:run
```

**Expected Results:**
- Backend: 18 tests passing ✅
- Frontend: 67 tests passing ✅
- Total: 85 tests passing ✅

---

## 🐛 Troubleshooting

### Backend Issues

#### Issue: 502 Bad Gateway

**Symptoms:** Backend returns 502 error when accessed

**Solutions:**
1. ✅ Check Railway deployment logs for errors
2. ✅ Verify `GROQ_API_KEY` is set in Railway Variables
3. ✅ Ensure Root Directory is `ai-doc-analyser-backend` (no leading `/`)
4. ✅ Check that `PORT` is NOT manually set (Railway sets it)
5. ✅ Verify Health Check Path is `/health` in Railway settings

**Debug Commands:**
```bash
# Check Railway logs
railway logs --project <your-project-id>

# Test health endpoint
curl https://your-backend.railway.app/health
```

#### Issue: npm ci fails during build

**Symptoms:** Build fails with "No workspaces found"

**Solutions:**
1. ✅ Remove `workspaces` from root `package.json`
2. ✅ Ensure `nixpacks.json` uses `npm install` not `npm ci`
3. ✅ Verify Root Directory is correctly set

#### Issue: GROQ_API_KEY not found

**Symptoms:** Error logs show "GROQ_API_KEY is not configured"

**Solutions:**
1. ✅ Add `GROQ_API_KEY` in Railway Variables tab
2. ✅ Redeploy the service after adding the variable

### Frontend Issues

#### Issue: Cannot connect to backend

**Symptoms:** Frontend shows network errors or "Cannot connect to server"

**Solutions:**
1. ✅ Verify `VITE_API_URL` in `.env.production` matches Railway URL
2. ✅ Check that Railway backend is deployed and running
3. ✅ Test backend health endpoint directly
4. ✅ Verify CORS is enabled in backend (already configured)

**Check `.env.production`:**
```bash
cd ai-doc-analyser-frontend
cat .env.production
```

Should show:
```
VITE_API_URL=https://ai-doc-analyser-backend-production.up.railway.app
```

#### Issue: Environment variables not loading

**Symptoms:** Frontend uses localhost instead of Railway URL

**Solutions:**
1. ✅ Ensure `.env.production` is committed to repository
2. ✅ Redeploy Vercel after updating environment variables
3. ✅ Clear browser cache and hard refresh (Ctrl+Shift+R)

#### Issue: Build fails on Vercel

**Symptoms:** Vercel deployment fails during build

**Solutions:**
1. ✅ Verify Root Directory is set to `ai-doc-analyser-frontend`
2. ✅ Check that `package.json` has correct build script
3. ✅ Ensure all dependencies are in `package.json`
4. ✅ Check Vercel build logs for specific errors

---

## 🔄 Continuous Deployment

### Automatic Deployments

Both Railway and Vercel are configured for automatic deployments:

**Railway (Backend):**
- Automatically deploys on push to `main` branch
- Watches `ai-doc-analyser-backend/**` directory
- Build time: ~2-3 minutes

**Vercel (Frontend):**
- Automatically deploys on push to `main` branch
- Watches `ai-doc-analyser-frontend/**` directory
- Build time: ~1-2 minutes

### Manual Deployments

**Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

**Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
cd ai-doc-analyser-frontend
vercel --prod
```

---

## 📊 Monitoring & Logs

### Railway Logs

1. Go to Railway Dashboard
2. Select your backend service
3. Click **Deployments** tab
4. Click on latest deployment to view logs

**Look for:**
```
🚀 ===== AI DOCUMENT ANALYSER BACKEND STARTED =====
✅ Server running on port XXXX
🔑 API Key configured: ✅ Yes
```

### Vercel Logs

1. Go to Vercel Dashboard
2. Select your project
3. Click **Deployments** tab
4. Click on deployment to view build logs

---

## 🎯 Production Checklist

### Before Deploying:

- [ ] All tests passing locally (85/85)
- [ ] Backend `.env` has valid `GROQ_API_KEY`
- [ ] **Generated strong `JWT_SECRET` (64+ characters)**
- [ ] **Added JWT environment variables to Railway**
- [ ] **Updated `CORS_ORIGINS` with Vercel frontend URL**
- [ ] Frontend `.env.production` has correct Railway URL
- [ ] All changes committed and pushed to GitHub
- [ ] No secrets in committed files (use environment variables)
- [ ] **Read DEPLOYMENT_SECURITY.md for security best practices**

### After Backend Deployment:

- [ ] Health endpoint returns 200 OK
- [ ] Formats endpoint returns 34 supported types
- [ ] CORS headers present in responses
- [ ] Railway logs show successful startup
- [ ] **Railway logs show "JWT authentication enabled"**
- [ ] **Railway logs show "Default admin user created"**
- [ ] **Login endpoint returns access token**
- [ ] **Protected endpoints reject requests without token**
- [ ] **Changed default admin password immediately**
- [ ] **Stored new admin credentials securely**

### After Frontend Deployment:

- [ ] Application loads without errors
- [ ] Can upload documents successfully
- [ ] Can ask questions and receive AI responses
- [ ] Preview feature works correctly
- [ ] Export functionality works

---

## 📝 Support & Resources

### Official Documentation:
- **Railway:** https://docs.railway.app
- **Vercel:** https://vercel.com/docs
- **Groq:** https://console.groq.com/docs

### Project Resources:
- **GitHub Repository:** https://github.com/sujithsa007/sujithsa007-ai-doc-analyser
- **Backend README:** [ai-doc-analyser-backend/README.md](ai-doc-analyser-backend/README.md)
- **Frontend README:** [ai-doc-analyser-frontend/README.md](ai-doc-analyser-frontend/README.md)
- **🔐 Authentication Guide:** [AUTHENTICATION.md](AUTHENTICATION.md)
- **🔐 Deployment Security:** [DEPLOYMENT_SECURITY.md](DEPLOYMENT_SECURITY.md)
- **🔑 Password Management:** [PASSWORD_CHANGE_GUIDE.md](PASSWORD_CHANGE_GUIDE.md)

### Common Commands:

```bash
# Run tests
npm run test:run

# Check deployment status
railway status  # Railway
vercel ls       # Vercel

# View logs
railway logs    # Railway
vercel logs     # Vercel

# Redeploy
railway up      # Railway
vercel --prod   # Vercel
```

---

## 🎉 Success!

Your AI Document Analyser is now deployed and running in production!

**Live Application:**
- 🌐 Frontend: https://sujithsa007-ai-doc-analyser-ai-doc.vercel.app
- 🔧 Backend: https://ai-doc-analyser-backend-production.up.railway.app
- ✅ All 85 tests passing
- 🚀 Ready for production use

---

**Last Updated:** November 11, 2025  
**Deployment Status:** ✅ Active (with JWT Authentication)  
**Security:** ✅ JWT + Bcrypt + Helmet + Rate Limiting  
**Maintainer:** Sujith S A (@sujithsa007)
