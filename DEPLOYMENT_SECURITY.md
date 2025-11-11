# 🔐 Deployment Security Guide

## ⚠️ CRITICAL: Why JWT Authentication is Essential for Production

### The Risk Without Authentication
Without JWT authentication on your production server, **anyone on the internet** can:
- ✅ Upload documents to your server (costing you money)
- ✅ Use your GROQ API key (consuming your quota)
- ✅ Analyze documents using your AI resources
- ✅ Potentially overload your server with requests
- ✅ Access any uploaded documents

**This is like leaving your house door wide open!**

---

## 🚀 Required Environment Variables for Production

### On Render.com (Backend)

You **MUST** set these environment variables in your Render dashboard:

```bash
# CRITICAL - Generate a strong secret key
JWT_SECRET=<generate-a-strong-random-string-min-32-chars>

# Token expiry times (recommended)
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Your GROQ API key
GROQ_API_KEY=<your-groq-api-key>

# CORS - allow your frontend domain
CORS_ORIGINS=https://ai-doc-analyser.vercel.app

# Node environment
NODE_ENV=production
```

### How to Generate JWT_SECRET

**Option 1: Using Node.js (Recommended)**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Option 2: Using OpenSSL**
```bash
openssl rand -base64 64
```

**Option 3: Online Generator** (less secure)
- Visit: https://generate-secret.vercel.app/64

⚠️ **NEVER commit JWT_SECRET to Git or share it publicly!**

---

## 📋 Deployment Checklist

### Before Deploying to Render:

- [ ] **Generate a strong JWT_SECRET** (minimum 32 characters)
- [ ] **Add JWT_SECRET to Render environment variables** (NOT in code!)
- [ ] **Set JWT_ACCESS_EXPIRY** (default: 15m)
- [ ] **Set JWT_REFRESH_EXPIRY** (default: 7d)
- [ ] **Configure CORS_ORIGINS** with your frontend URL
- [ ] **Change default admin password** from "Machten@007"
- [ ] **Review rate limiting settings** (currently 100 req/15min)
- [ ] **Test authentication locally** before deploying
- [ ] **Document admin credentials** securely (password manager)

### After Deployment:

- [ ] **Test health endpoint**: `curl https://your-app.onrender.com/health`
- [ ] **Verify authentication**: Try accessing `/ask` without token (should fail)
- [ ] **Login as admin**: POST to `/auth/login`
- [ ] **Change admin password**: POST to `/auth/change-password`
- [ ] **Generate API key**: POST to `/auth/rotate-api-key`
- [ ] **Update frontend**: Configure backend URL in frontend
- [ ] **Test full flow**: Login → Upload → Analyze

---

## 🛡️ Security Best Practices for Production

### 1. JWT Secret Management
```bash
# ✅ GOOD - Environment variable
JWT_SECRET=process.env.JWT_SECRET

# ❌ BAD - Hardcoded
JWT_SECRET="my-secret-key"
```

### 2. Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Special characters recommended

### 3. Rate Limiting
Current settings (adjust if needed):
```javascript
// In app.js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 4. HTTPS Only
- Render automatically provides HTTPS
- Never use HTTP in production
- JWT tokens sent over HTTP can be intercepted

### 5. Token Expiry
```javascript
JWT_ACCESS_EXPIRY=15m   // Short-lived for security
JWT_REFRESH_EXPIRY=7d   // Long-lived for convenience
```

---

## 🔧 Setting Environment Variables on Render

### Step 1: Go to Your Service
1. Log in to Render.com
2. Select your backend service: `ai-doc-analyser-backend`
3. Click **"Environment"** tab

### Step 2: Add Environment Variables
Click **"Add Environment Variable"** and add:

| Key | Value | Notes |
|-----|-------|-------|
| `JWT_SECRET` | `<your-generated-secret>` | 🔒 Keep secret! |
| `JWT_ACCESS_EXPIRY` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh token lifetime |
| `GROQ_API_KEY` | `<your-groq-key>` | Already set |
| `CORS_ORIGINS` | `https://ai-doc-analyser.vercel.app` | Your frontend |
| `NODE_ENV` | `production` | Already set |

### Step 3: Deploy
- Click **"Save Changes"**
- Render will automatically redeploy with new variables

---

## 🧪 Testing Authentication After Deployment

### 1. Health Check (No Auth Required)
```bash
curl https://your-app.onrender.com/health
```
**Expected**: `{"status":"healthy","timestamp":"..."}`

### 2. Try Protected Endpoint Without Auth (Should Fail)
```bash
curl -X POST https://your-app.onrender.com/ask \
  -H "Content-Type: application/json" \
  -d '{"documentId":"test","question":"test"}'
```
**Expected**: `401 Unauthorized` - "No token provided" or "Invalid token"

### 3. Login as Admin
```bash
curl -X POST https://your-app.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aidoc.local",
    "password": "Machten@007"
  }'
```
**Expected**: Returns `accessToken` and `refreshToken`

### 4. Use Protected Endpoint With Token
```bash
curl -X POST https://your-app.onrender.com/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-access-token>" \
  -d '{
    "documentId": "test",
    "question": "What is this document about?"
  }'
```
**Expected**: Returns AI analysis (if document exists)

---

## 🔑 Managing Admin Credentials in Production

### Change Default Password IMMEDIATELY After Deployment

**Using cURL:**
```bash
curl -X POST https://your-app.onrender.com/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-access-token>" \
  -d '{
    "oldPassword": "Machten@007",
    "newPassword": "YourNewSecurePassword123!"
  }'
```

**Using Frontend (After Integration):**
1. Login with default credentials
2. Navigate to profile/settings
3. Change password
4. Store new password in password manager

### Password Storage Recommendations
- ✅ Use password manager (1Password, LastPass, Bitwarden)
- ✅ Store in secure notes with encrypted backup
- ✅ Share with team via secure password sharing tool
- ❌ Never store in plain text files
- ❌ Never commit passwords to Git
- ❌ Never share via email/Slack

---

## 🌐 Frontend Configuration

### Update Frontend Environment Variables

**On Vercel (Frontend):**

1. Go to your Vercel project settings
2. Add environment variable:
   ```bash
   VITE_API_URL=https://your-app.onrender.com
   ```

3. Update `src/services/apiService.js`:
   ```javascript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
   ```

---

## 📊 Monitoring & Logs

### Check Authentication Logs on Render

1. Go to Render dashboard
2. Select your service
3. Click "Logs" tab
4. Look for:
   ```
   ✅ Default admin user created: admin@aidoc.local
   🛡️  Security Features: JWT authentication enabled
   ```

### Common Authentication Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `401: No token provided` | Request missing Authorization header | Add `Authorization: Bearer <token>` |
| `401: Invalid token` | JWT_SECRET mismatch or expired token | Verify JWT_SECRET, refresh token |
| `403: Forbidden` | Valid token but insufficient permissions | Check user role |
| `500: jwt malformed` | JWT_SECRET not set | Set JWT_SECRET in environment |

---

## 🚨 Security Incident Response

### If JWT_SECRET is Compromised:

1. **Immediately generate new JWT_SECRET**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Update Render environment variable**
   - Go to Render dashboard → Environment
   - Update JWT_SECRET
   - Save (triggers automatic redeployment)

3. **All users will be logged out**
   - Old tokens become invalid instantly
   - Users must login again with credentials

4. **Force password reset for all users** (if breach suspected)
   - Notify users
   - Implement password reset flow

---

## 📖 Additional Resources

- [AUTHENTICATION.md](./AUTHENTICATION.md) - Complete authentication guide
- [PASSWORD_CHANGE_GUIDE.md](./PASSWORD_CHANGE_GUIDE.md) - Password management
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## ✅ Quick Reference

### Local Development
```bash
JWT_SECRET=your-local-secret-for-development
CORS_ORIGINS=http://localhost:5173
```

### Production (Render)
```bash
JWT_SECRET=<strong-random-64-char-string>
CORS_ORIGINS=https://ai-doc-analyser.vercel.app
NODE_ENV=production
```

### Default Admin (CHANGE IMMEDIATELY)
```
Email: admin@aidoc.local
Password: Machten@007
```

---

**Remember: Security is not optional in production. JWT authentication protects your resources, your users, and your costs. Always deploy with authentication enabled!**
