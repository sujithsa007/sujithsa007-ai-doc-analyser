# Railway Deployment Fix Guide

## Current Status: ❌ 502 Bad Gateway

Your Railway backend is not responding. Follow these steps to fix it.

---

## ✅ Step 1: Set Environment Variables in Railway

**CRITICAL:** Railway doesn't have your `.env` file. You MUST add these manually.

### How to Add Environment Variables:

1. Go to **Railway Dashboard**: https://railway.app/dashboard
2. Select your project: `ai-doc-analyser-backend-production`
3. Click on the **Variables** tab
4. Click **+ New Variable** and add each of these:

```
GROQ_API_KEY=<your-groq-api-key-from-local-.env-file>
NODE_ENV=production
HOST=0.0.0.0
```

**Note:** Copy the GROQ_API_KEY value from your local `ai-doc-analyser-backend/.env` file

**⚠️ DO NOT SET `PORT`** - Railway sets this automatically!

5. Click **Deploy** to apply changes

---

## ✅ Step 2: Check Railway Deployment Logs

After setting variables, Railway will redeploy automatically.

### View Logs:

1. In Railway Dashboard → Your Project
2. Click on **Deployments** tab
3. Click on the latest deployment
4. Look for these SUCCESS messages in logs:

```
🚀 ===== AI DOCUMENT ANALYSER BACKEND STARTED =====
✅ Server running on port XXXX
🤖 AI Model: Groq LLaMA-3.3-70B
✅ API Key configured: ✅ Yes
```

### Common Error Messages:

- **"GROQ_API_KEY is not configured"** → Environment variable not set
- **"ECONNREFUSED"** → Server not binding to 0.0.0.0
- **"Port XXXX already in use"** → Restart deployment

---

## ✅ Step 3: Verify Railway Configuration Files

Make sure your `railway.json` is correct:

**Current railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd ai-doc-analyser-backend && npm install"
  },
  "deploy": {
    "startCommand": "cd ai-doc-analyser-backend && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

✅ This is correct!

---

## ✅ Step 4: Test the Deployment

Once Railway shows "Deployed" status, run this test:

```bash
node test-railway-connection.js
```

You should see:
```
✅ Health Check: PASSED
✅ Formats Endpoint: PASSED
✅ CORS: ENABLED
```

Or test manually in browser:
```
https://ai-doc-analyser-backend-production.up.railway.app/health
```

---

## ✅ Step 5: Update Frontend (if needed)

Your frontend is already correctly configured:

**Frontend .env.production:**
```
VITE_API_URL=https://ai-doc-analyser-backend-production.up.railway.app
```

Once backend is working, redeploy your Vercel frontend (optional):
```bash
cd ai-doc-analyser-frontend
vercel --prod
```

---

## 🔍 Troubleshooting

### If Still Getting 502:

1. **Check Railway Logs** - Look for crash errors
2. **Verify Environment Variables** - All 3 must be set
3. **Check Railway Service** - Make sure it's not "Sleeping" (upgrade plan if needed)
4. **Restart Deployment** - Click "Redeploy" in Railway dashboard

### If Backend Starts But Frontend Can't Connect:

1. Check CORS is enabled in `app.js` ✅ (already done)
2. Verify frontend `.env.production` URL matches Railway URL
3. Clear browser cache and try again

---

## 📋 Quick Checklist

- [ ] Set GROQ_API_KEY in Railway Variables
- [ ] Set NODE_ENV=production in Railway Variables  
- [ ] Set HOST=0.0.0.0 in Railway Variables
- [ ] Wait for Railway to redeploy
- [ ] Check deployment logs for success message
- [ ] Test /health endpoint
- [ ] Test from Vercel frontend

---

## 🆘 Need Help?

If you're still stuck after following all steps:

1. Share Railway deployment logs
2. Confirm all environment variables are set
3. Check if Railway service is on free tier (may have limitations)

---

## ✅ Expected Result

Once fixed, you should see:

**Backend:** https://ai-doc-analyser-backend-production.up.railway.app/health
```json
{
  "status": "healthy",
  "model": "groq/llama-3.3-70b-versatile",
  "timestamp": "2025-10-29T...",
  "uptime": 123
}
```

**Frontend:** Should successfully upload and analyze documents!

