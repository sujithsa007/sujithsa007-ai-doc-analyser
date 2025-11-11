# 🚀 Deploy to Production - Render.com (5 Minutes!)

**Platform:** Render.com (backend) + Vercel (frontend)  
**Time:** ~15 minutes  
**Cost:** $0 (Free tier)

---

## 🎯 Quick Start - Follow These Steps

### ⚡ Step 1: Generate JWT Secret (30 seconds)

**Run this command NOW:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**📋 Copy the output** - you'll paste it into Render in Step 3!

---

## 🔧 Backend Deployment - Render.com

### Step 2: Login to Render (1 minute)

1. Go to: **https://render.com**
2. Click **"Get Started"** → Sign in with **GitHub**
3. Authorize Render to access your repositories

### Step 3: Create New Web Service (2 minutes)

1. Click **"New +"** → **"Web Service"**
2. Connect your repository: `sujithsa007/sujithsa007-ai-doc-analyser`
3. Click **"Connect"**

### Step 4: Configure Service (3 minutes)

**Basic Settings:**
```
Name: ai-doc-analyser-backend
Region: Oregon (US West)
Branch: main
Root Directory: ai-doc-analyser-backend
Runtime: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

**Environment Variables:**

Click **"Advanced"** → **"Add Environment Variable"** for each:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `GROQ_API_KEY` | `<your-groq-api-key-here>` | Your Groq API key |
| `JWT_SECRET` | **Paste your generated secret here** | From Step 1! |
| `JWT_ACCESS_EXPIRY` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh token lifetime |
| `CORS_ORIGINS` | `http://localhost:5173` | Update after Vercel deploy |

⚠️ **CRITICAL:** Do NOT set `PORT` - Render sets this automatically!

### Step 5: Deploy! (2 minutes)

1. Click **"Create Web Service"**
2. Render will start building (~2-3 minutes)
3. Wait for **"Live"** status with green checkmark ✅

### Step 6: Get Your Backend URL (30 seconds)

1. Copy the URL from the top of the page (e.g., `https://ai-doc-analyser-backend.onrender.com`)
2. **Save this URL** - you need it for frontend!

### Step 7: Test Backend (30 seconds)

```bash
# Test health endpoint
curl https://your-app.onrender.com/health

# Test login
curl -X POST https://your-app.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aidoc.local","password":"Machten@007"}'
```

✅ **If you see an `accessToken`, backend is working!**

---

## 🎨 Frontend Deployment - Vercel

### Step 8: Update Backend URL (1 minute)

**Create/Edit:** `ai-doc-analyser-frontend/.env.production`

```bash
VITE_API_URL=https://your-app.onrender.com
VITE_ENV=production
VITE_API_TIMEOUT=120000
VITE_MAX_PDF_SIZE=50
```

**Commit:**
```bash
git add ai-doc-analyser-frontend/.env.production
git commit -m "Update production backend URL for Render"
git push origin main
```

### Step 9: Deploy to Vercel (3 minutes)

1. Go to: **https://vercel.com**
2. Click **"Add New Project"**
3. Import: `sujithsa007/sujithsa007-ai-doc-analyser`
4. Configure:
   ```
   Framework: Vite
   Root Directory: ai-doc-analyser-frontend
   Build Command: npm run build
   Output Directory: dist
   ```
5. Click **"Deploy"** (wait ~2 minutes)
6. **Copy your Vercel URL** (e.g., `https://your-app.vercel.app`)

### Step 10: Update CORS on Render (1 minute)

1. Go back to **Render.com** → Your backend service
2. Click **"Environment"** in left sidebar
3. Find `CORS_ORIGINS` variable
4. Update to: `https://your-app.vercel.app`
5. Click **"Save Changes"** (service will auto-redeploy)

---

## 🔐 CRITICAL: Change Default Password

**⚠️ DO THIS IMMEDIATELY!**

### Step 11: Change Admin Password (2 minutes)

**Get access token:**
```bash
curl -X POST https://your-app.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aidoc.local",
    "password": "Machten@007"
  }'
```

**Copy the `accessToken` from response.**

**Change password:**
```bash
curl -X POST https://your-app.onrender.com/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "oldPassword": "Machten@007",
    "newPassword": "YourNewSecurePassword123!"
  }'
```

**Password Requirements:**
- Min 8 characters
- 1+ uppercase letter
- 1+ lowercase letter
- 1+ number

💾 **Save your new password in a password manager!**

---

## ✅ Final Verification Checklist

### Test Everything:

- [ ] ✅ Backend health: `curl https://your-app.onrender.com/health`
- [ ] ✅ Login returns access token
- [ ] ✅ Frontend loads at Vercel URL
- [ ] ✅ Can login with new password
- [ ] ✅ Can upload documents
- [ ] ✅ Can ask questions and get AI responses
- [ ] ✅ PDF preview works
- [ ] ✅ Changed default admin password
- [ ] ✅ Stored credentials securely

---

## 🎉 Success! Your App is Live!

**🌐 Your URLs:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.onrender.com`

**🔐 Security:**
- ✅ JWT authentication enabled
- ✅ Bcrypt password hashing (12 rounds)
- ✅ Helmet security headers
- ✅ Rate limiting (100 req/15 min)
- ✅ CORS protection

**💰 Cost:**
- Render.com: Free tier (750 hours/month)
- Vercel: Free tier (unlimited)
- Groq API: Free tier (30 req/min)

---

## 📊 Monitoring Your Deployment

### Render Dashboard:
- **Logs:** Click "Logs" tab to see real-time output
- **Metrics:** View CPU/Memory usage
- **Events:** Deployment history and status

### Vercel Dashboard:
- **Deployments:** See build logs and status
- **Analytics:** Track page views (if enabled)
- **Domains:** Manage custom domains

---

## 🆘 Troubleshooting

### Backend Won't Start

**Check Render Logs:**
1. Go to Render Dashboard → Your Service
2. Click **"Logs"** tab
3. Look for errors

**Common Issues:**
```bash
# Error: JWT_SECRET not set
Solution: Add JWT_SECRET in Environment variables

# Error: Cannot find module
Solution: Clear cache and redeploy

# Error: Port already in use
Solution: Don't set PORT manually (Render does this)
```

### CORS Errors

**Symptom:** Frontend can't connect to backend

**Solution:**
1. Verify `CORS_ORIGINS` matches your Vercel URL exactly
2. Check for trailing slashes (don't include them)
3. Redeploy backend after changing CORS

### Frontend Shows Localhost

**Symptom:** Frontend tries to connect to localhost

**Solution:**
1. Check `.env.production` has correct Render URL
2. Redeploy Vercel after updating `.env.production`
3. Hard refresh browser (Ctrl+Shift+R)

---

## 📖 Additional Resources

**Documentation:**
- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [DEPLOYMENT_SECURITY.md](DEPLOYMENT_SECURITY.md) - Security best practices
- [AUTHENTICATION.md](AUTHENTICATION.md) - Authentication guide
- [Render Docs](https://render.com/docs) - Official Render documentation
- [Vercel Docs](https://vercel.com/docs) - Official Vercel documentation

**Support:**
- GitHub Issues: https://github.com/sujithsa007/sujithsa007-ai-doc-analyser/issues
- Render Support: https://render.com/docs/support
- Vercel Support: https://vercel.com/support

---

## 🔄 Continuous Deployment

**Automatic Deployments Enabled:**

✅ **Push to `main` branch** → Auto-deploys to production  
✅ **Render:** Watches `ai-doc-analyser-backend/**`  
✅ **Vercel:** Watches `ai-doc-analyser-frontend/**`

**Deployment Times:**
- Backend (Render): ~2-3 minutes
- Frontend (Vercel): ~1-2 minutes

---

## 🎯 Next Steps

After deployment:

1. **Test thoroughly** - Upload various document types
2. **Add more users** - POST to `/auth/register`
3. **Monitor usage** - Check Render/Vercel dashboards
4. **Set up custom domain** (optional) - Configure in Vercel
5. **Enable analytics** (optional) - Vercel Analytics
6. **Add monitoring** (optional) - Sentry, LogRocket, etc.

---

**Deployment Date:** November 11, 2025  
**Platform:** Render.com + Vercel  
**Security:** ✅ Production-ready with JWT authentication  
**Status:** 🟢 Live and operational
