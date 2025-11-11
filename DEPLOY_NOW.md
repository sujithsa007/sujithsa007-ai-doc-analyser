# 🚀 Quick Deployment Guide - Deploy NOW!

**Last Updated:** November 11, 2025

---

## 📋 Pre-Deployment Checklist (5 minutes)

### ✅ Step 1: Generate JWT Secret

Run this command **RIGHT NOW**:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Copy the output** - you'll need it in Step 3!

Example output:
```
a7f8d3e2c1b9a0e4f5d6c7b8a9d0e1f2c3b4a5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6
```

### ✅ Step 2: Commit Your Code

```bash
# Make sure all changes are committed
git add .
git commit -m "Add JWT authentication for production deployment"
git push origin main
```

---

## 🔧 Backend Deployment (Railway) - 10 minutes

### Step 1: Login to Railway

1. Go to: https://railway.app
2. Click "Login" → Sign in with GitHub

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose: `sujithsa007/sujithsa007-ai-doc-analyser`
4. Railway will start deploying automatically

### Step 3: Configure Service

**A. Set Root Directory:**
1. Click on the deployed service (purple box)
2. Go to **Settings** tab
3. Scroll to **"Root Directory"**
4. Enter: `ai-doc-analyser-backend` (⚠️ NO leading slash!)
5. Set **"Watch Paths"**: `ai-doc-analyser-backend/**`

**B. Add Environment Variables:**
1. Go to **Variables** tab
2. Click **"+ New Variable"** for each:

```bash
# Required Variables
GROQ_API_KEY=<your-groq-api-key-here>
NODE_ENV=production

# JWT Authentication (USE THE SECRET YOU GENERATED IN STEP 1!)
JWT_SECRET=<paste-your-generated-secret-here>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS (you'll update this after getting Vercel URL)
CORS_ORIGINS=http://localhost:5173
```

3. Click **"Deploy"** button (top right)

### Step 4: Get Your Backend URL

1. Wait for deployment to complete (~2-3 minutes)
2. Go to **Settings** → **Networking**
3. Click **"Generate Domain"** if not already generated
4. Copy your URL (e.g., `https://ai-doc-analyser-backend-production.up.railway.app`)

### Step 5: Test Backend

```bash
# Test health endpoint
curl https://your-railway-url.railway.app/health

# Test login (default admin)
curl -X POST https://your-railway-url.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aidoc.local","password":"Machten@007"}'
```

✅ **If you get an access token, backend is working!**

---

## 🎨 Frontend Deployment (Vercel) - 5 minutes

### Step 1: Update Frontend Environment

Edit `ai-doc-analyser-frontend/.env.production`:

```bash
VITE_API_URL=https://your-railway-url.railway.app
VITE_ENV=production
VITE_API_TIMEOUT=120000
VITE_MAX_PDF_SIZE=50
```

Commit the change:
```bash
git add ai-doc-analyser-frontend/.env.production
git commit -m "Update production backend URL"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to: https://vercel.com
2. Click "Add New Project"
3. Import `sujithsa007/sujithsa007-ai-doc-analyser`

### Step 3: Configure Vercel

**Project Settings:**
- Framework Preset: **Vite**
- Root Directory: `ai-doc-analyser-frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Environment Variables** (optional - already in `.env.production`):
```bash
VITE_API_URL=https://your-railway-url.railway.app
VITE_ENV=production
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait ~2 minutes
3. Copy your Vercel URL (e.g., `https://your-app.vercel.app`)

### Step 5: Update CORS in Backend

Go back to Railway:
1. Click your backend service
2. Go to **Variables** tab
3. Find `CORS_ORIGINS`
4. Update to: `https://your-vercel-url.vercel.app`
5. Service will auto-redeploy

---

## 🔐 CRITICAL: Change Default Password

**⚠️ DO THIS IMMEDIATELY AFTER DEPLOYMENT!**

### Step 1: Login

```bash
curl -X POST https://your-railway-url.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aidoc.local",
    "password": "Machten@007"
  }'
```

**Copy the `accessToken` from the response.**

### Step 2: Change Password

```bash
curl -X POST https://your-railway-url.railway.app/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "oldPassword": "Machten@007",
    "newPassword": "YourNewSecurePassword123!"
  }'
```

### Step 3: Store New Password

Store your new password in a password manager (1Password, LastPass, etc.)

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

---

## ✅ Verification Checklist

### Backend Verification

- [ ] Health endpoint works: `https://your-railway-url.railway.app/health`
- [ ] Login returns access token
- [ ] Protected endpoints reject requests without token
- [ ] Railway logs show "Default admin user created"
- [ ] Changed default admin password

### Frontend Verification

- [ ] Application loads at Vercel URL
- [ ] Can login with new admin credentials
- [ ] Can upload documents
- [ ] Can ask questions and get AI responses
- [ ] PDF preview works

### Security Verification

- [ ] JWT_SECRET is set (64+ characters)
- [ ] Default password changed
- [ ] CORS_ORIGINS matches Vercel URL
- [ ] All secrets stored securely (not in Git)

---

## 🎉 You're Done!

Your AI Document Analyser is now live in production!

**Your URLs:**
- 🌐 Frontend: `https://your-vercel-url.vercel.app`
- 🔧 Backend: `https://your-railway-url.railway.app`

**Next Steps:**
1. Test the full application flow
2. Share the URL with users
3. Monitor Railway and Vercel logs
4. Consider setting up monitoring/alerts

---

## 📞 Need Help?

**Common Issues:**

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check Railway logs, verify JWT_SECRET is set |
| CORS errors | Update CORS_ORIGINS with exact Vercel URL |
| Login fails | Verify JWT_SECRET matches on backend |
| Cannot connect | Check backend URL in frontend `.env.production` |

**Documentation:**
- [DEPLOYMENT.md](DEPLOYMENT.md) - Full deployment guide
- [DEPLOYMENT_SECURITY.md](DEPLOYMENT_SECURITY.md) - Security best practices
- [AUTHENTICATION.md](AUTHENTICATION.md) - Authentication guide

---

**Deployment Time:** ~20 minutes total  
**Cost:** Free tier (both Railway and Vercel)  
**Security:** ✅ Production-ready with JWT authentication
