# Backend Deployment Guide - Vercel

## Prerequisites
- Vercel account
- Vercel CLI installed: `npm i -g vercel`
- Groq API key

## Quick Deploy

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Navigate to backend directory:**
   ```bash
   cd ai-doc-analyser-backend
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Choose your account
   - Link to existing project? **N**
   - Project name? **ai-doc-analyser-backend**
   - Directory? **./**
   - Override settings? **N**

4. **Add environment variables:**
   ```bash
   vercel env add GROQ_API_KEY
   ```
   Paste your Groq API key when prompted.

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Select the `ai-doc-analyser-backend` directory as root
4. Add environment variable:
   - Key: `GROQ_API_KEY`
   - Value: Your Groq API key
5. Click **Deploy**

## Environment Variables

Set these in Vercel Dashboard or CLI:

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Your Groq API key for LLaMA model access |
| `NODE_ENV` | No | Set to `production` (auto-set by Vercel) |
| `JWT_SECRET` | Yes | Secret key for JWT authentication |

## Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ]
}
```

### .vercelignore
- Excludes test files, documentation, and unnecessary files
- Keeps deployment size minimal

## Vercel vs Railway

| Feature | Vercel | Railway |
|---------|--------|---------|
| **Deployment** | Serverless Functions | Container-based |
| **Cold Start** | ~1-2s | Minimal (always running) |
| **Scaling** | Automatic | Automatic |
| **Free Tier** | 100GB bandwidth/month | $5 credit/month |
| **Build Time** | Fast | Fast |
| **Custom Domains** | Yes (free) | Yes (requires paid plan) |
| **Environment** | Serverless | Full server control |
| **Best For** | API endpoints, static sites | Long-running processes |

## Important Notes

### Vercel Serverless Limitations:
1. **Function Timeout**: Max 30 seconds (configurable in vercel.json)
2. **Memory**: Max 1024MB on free tier
3. **Cold Starts**: First request may be slower
4. **File System**: Read-only, use `/tmp` for writes (limited)
5. **WebSockets**: Not supported on serverless

### Suitable for this project because:
- ✅ API endpoints are stateless
- ✅ Requests complete within 30 seconds
- ✅ No long-running background jobs
- ✅ No WebSocket requirements
- ✅ Groq API handles AI processing (external)

## Post-Deployment

1. **Test the deployment:**
   ```bash
   curl https://your-backend.vercel.app/health
   ```

2. **Update frontend API URL:**
   - Edit `ai-doc-analyser-frontend/.env`:
     ```
     VITE_API_BASE_URL=https://your-backend.vercel.app
     ```

3. **Redeploy frontend** with new backend URL

## Monitoring

- View logs: `vercel logs <deployment-url>`
- Dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)
- Analytics: Available in Vercel dashboard

## Troubleshooting

### Issue: Cold Start Latency
**Solution**: Accept 1-2s cold start or upgrade to Pro plan for faster cold starts

### Issue: Timeout Errors
**Solution**: Increase maxDuration in vercel.json (max 300s on Pro)

### Issue: Missing Environment Variables
**Solution**: Run `vercel env ls` to check, `vercel env add` to add

### Issue: Build Failures
**Solution**: Check build logs in dashboard, ensure all dependencies in package.json

## Rollback

If needed, rollback to previous deployment:
```bash
vercel rollback
```

Or select specific deployment in dashboard and click "Promote to Production"

## Local Testing with Vercel

Test Vercel environment locally:
```bash
vercel dev
```

This simulates Vercel's serverless environment on your machine.

## Migration from Railway

1. Deploy to Vercel (follow steps above)
2. Test thoroughly
3. Update frontend to point to Vercel URL
4. Keep Railway running for 24-48 hours during migration
5. Monitor for issues
6. Delete Railway deployment once stable

## Cost Comparison

### Vercel Free Tier:
- 100 GB bandwidth
- 100 GB-hours serverless function execution
- Unlimited deployments
- **Good for**: Dev projects, small APIs

### Vercel Pro ($20/month):
- 1 TB bandwidth
- 1000 GB-hours execution
- Faster cold starts
- Custom domain support
- **Good for**: Production apps

### Railway ($5+ usage-based):
- Pay for what you use
- $5 free credit/month
- Always-on containers
- **Good for**: Apps needing persistent servers

## Recommendation

**For this AI Document Analyser:**
- Use **Vercel** for serverless API endpoints
- Accept cold start trade-off for cost savings
- Monitor usage and upgrade if needed
- Consider Railway if you need:
  - WebSocket support
  - Background job processing
  - Persistent file storage
  - Always-on containers
