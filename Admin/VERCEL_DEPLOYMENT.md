# 🚀 Vercel Deployment Guide for HSG245 Smart Report

This guide explains how to connect your Vercel frontend to the FastAPI backend.

---

## 📋 Architecture Overview

```
User Browser
    ↓
Vercel Frontend (React/Next.js)
    ↓
Vercel API Route (/app/api/hsg245/route.ts)
    ↓
FastAPI Backend (Railway/Render/VPS)
    ↓
AI Agents (OpenAI GPT-4)
```

**Benefits:**
- ✅ No CORS issues
- ✅ Backend URL stays private
- ✅ Easy to switch backends
- ✅ Better error handling

---

## ⚠️ STEP 1: Prepare Backend for Deployment

### Option A: Deploy to Railway.app (RECOMMENDED - Free 500 hours)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose: `HSE_RCAnalysis_AgenticAI`

3. **⚠️ Configure Environment Variables**
   - In Railway dashboard, go to your project
   - Click "Variables" tab
   - Add these:
     ```
     OPENAI_API_KEY=sk-proj-xxxxx
     PORT=8000
     ```

4. **⚠️ Set Start Command**
   - Go to "Settings" → "Deploy"
   - Start Command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
   - Or create `Procfile`:
     ```
     web: uvicorn api.main:app --host 0.0.0.0 --port $PORT
     ```

5. **Deploy**
   - Railway auto-deploys
   - You'll get a URL like: `https://hse-agentic-ai.up.railway.app`
   - **⚠️ COPY THIS URL - YOU'LL NEED IT!**

6. **Test Backend**
   ```bash
   curl https://your-app.up.railway.app/api/v1/health
   ```

### Option B: Deploy to Render.com (Free tier available)

1. **Create Render Account**
   - Go to https://render.com
   - Sign in with GitHub

2. **Create Web Service**
   - Dashboard → "New" → "Web Service"
   - Connect your GitHub repo

3. **⚠️ Configure Service**
   - Name: `hse-investigation-api`
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`

4. **⚠️ Add Environment Variables**
   ```
   OPENAI_API_KEY=sk-proj-xxxxx
   PYTHON_VERSION=3.10.0
   ```

5. **Deploy**
   - You'll get URL like: `https://hse-api.onrender.com`
   - **⚠️ COPY THIS URL!**

---

## ⚠️ STEP 2: Update Frontend Environment Variables

### Local Development

1. **Create `.env.local` file**
   ```bash
   cd /Users/selcuk/Desktop/HSE_AgenticAI/admin/Admin
   cp .env.example .env.local
   ```

2. **⚠️ Edit `.env.local`**
   ```bash
   # For local testing with local backend
   NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
   
   # ⚠️ For production testing (use your Railway/Render URL)
   # NEXT_PUBLIC_BACKEND_API_URL=https://your-app.up.railway.app
   ```

### Vercel Production

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: `inferaworld-admin` (or your frontend project)

2. **⚠️ Add Environment Variable**
   - Go to: Settings → Environment Variables
   - Click "Add New"
   - **Name:** `NEXT_PUBLIC_BACKEND_API_URL`
   - **Value:** `https://your-backend-url.up.railway.app` (YOUR ACTUAL BACKEND URL)
   - **Environments:** ✅ Production ✅ Preview ✅ Development
   - Click "Save"

3. **Redeploy**
   - Go to "Deployments" tab
   - Click "..." on latest deployment → "Redeploy"
   - ✅ This applies the new environment variable

---

## ⚠️ STEP 3: Update API Service Import

In your React components, update the import:

**Old (direct backend):**
```javascript
import { createIncident } from '../services/hsg245Api'
```

**⚠️ New (via Vercel route):**
```javascript
import { createIncident } from '../services/hsg245Api-vercel'
```

**Or rename file:**
```bash
cd /Users/selcuk/Desktop/HSE_AgenticAI/admin/Admin/src/services
mv hsg245Api.js hsg245Api-old.js
mv hsg245Api-vercel.js hsg245Api.js
```

---

## ⚠️ STEP 4: Test Locally

1. **Start Backend (Local)**
   ```bash
   cd /Users/selcuk/Desktop/HSE_AgenticAI
   python -m uvicorn api.main:app --reload --port 8000
   ```

2. **Start Frontend**
   ```bash
   cd /Users/selcuk/Desktop/HSE_AgenticAI/admin/Admin
   npm run dev
   ```

3. **Test Health Check**
   - Open browser: http://localhost:3000
   - Open browser console (F12)
   - Check API route: http://localhost:3000/api/hsg245
   - Should see: `{"status":"healthy","backend":{...}}`

4. **Test Form Submission**
   - Fill out HSG245 form
   - Submit Part 1
   - Check console for logs:
     ```
     📥 Received request: {action: 'create_incident', ...}
     📡 Calling backend: http://localhost:8000/api/v1/incidents/create
     ✅ Backend response received
     ```

---

## ⚠️ STEP 5: Deploy Frontend to Vercel

### First Time Setup

1. **Install Vercel CLI** (if not already)
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd /Users/selcuk/Desktop/HSE_AgenticAI/admin/Admin
   vercel --prod
   ```

4. **Follow prompts:**
   - Setup and deploy? **Y**
   - Which scope? (select your account)
   - Link to existing project? **Y** (if you have one) or **N**
   - Project name: `inferaworld-admin`
   - Directory: `./`
   - Override settings? **N**

### Updates (After First Deploy)

```bash
cd /Users/selcuk/Desktop/HSE_AgenticAI/admin/Admin
git add .
git commit -m "feat: Add Vercel API routes for HSG245"
git push origin main

# Vercel auto-deploys on push (if linked to GitHub)
# Or manually:
vercel --prod
```

---

## ⚠️ STEP 6: Verify Production Deployment

1. **Check Frontend URL**
   - Your Vercel URL: `https://inferaworld-admin.vercel.app`
   - Or custom domain: `https://cpanel.inferaworld.com`

2. **Test API Route**
   ```bash
   curl https://inferaworld-admin.vercel.app/api/hsg245
   ```
   
   Expected response:
   ```json
   {
     "status": "healthy",
     "backend": {
       "status": "healthy",
       "agents": { ... }
     },
     "backend_url": "https://your-backend.up.railway.app"
   }
   ```

3. **Test Full Workflow**
   - Open frontend in browser
   - Go to HSG245 Smart Report page
   - Fill out form and submit
   - Check browser console for logs
   - Verify PDF downloads

---

## 🔧 Troubleshooting

### Issue 1: "Cannot reach backend"

**Solution:**
```bash
# Check backend is running
curl https://your-backend-url.up.railway.app/api/v1/health

# Check environment variable in Vercel
# Vercel Dashboard → Settings → Environment Variables
# Verify NEXT_PUBLIC_BACKEND_API_URL is set correctly

# Redeploy frontend
vercel --prod
```

### Issue 2: CORS errors

**Solution:**
- ✅ You shouldn't get CORS errors if using API routes
- If you do, check that you're using `/api/hsg245` NOT direct backend URL
- Verify imports use `hsg245Api-vercel.js`

### Issue 3: 504 Gateway Timeout

**Solution:**
- Backend might be sleeping (Railway free tier)
- First request takes 20-30 seconds to wake up
- Subsequent requests are fast
- Upgrade to paid tier ($5/month) for always-on

### Issue 4: PDF download fails

**Solution:**
```javascript
// Check the PDF response in route.ts
// Ensure Content-Type is application/pdf
// Check browser console for blob errors
```

---

## 📊 Cost Breakdown

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| **Vercel** | Hobby | Free | Frontend hosting |
| **Railway** | Free | $0 | 500 hours/month, $5 after |
| **Render** | Free | $0 | Sleeps after 15min idle |
| **OpenAI** | Pay-as-you-go | ~$0.50/day | Based on usage |
| **Total** | | **~$5-15/month** | Production ready |

---

## ✅ Deployment Checklist

- [ ] Backend deployed to Railway/Render
- [ ] Backend health check working
- [ ] Environment variable `OPENAI_API_KEY` set on backend
- [ ] Backend URL copied
- [ ] Frontend environment variable `NEXT_PUBLIC_BACKEND_API_URL` set on Vercel
- [ ] API route file created: `/app/api/hsg245/route.ts`
- [ ] API service updated: `hsg245Api-vercel.js`
- [ ] Local testing complete
- [ ] Frontend deployed to Vercel
- [ ] Production health check works
- [ ] Test incident creation works
- [ ] Test PDF generation works
- [ ] Git committed and pushed

---

## 🎯 Quick Commands Reference

```bash
# Local Development
cd /Users/selcuk/Desktop/HSE_AgenticAI
python -m uvicorn api.main:app --reload --port 8000  # Backend
cd admin/Admin && npm run dev                         # Frontend

# Test API Route Locally
curl http://localhost:3000/api/hsg245

# Deploy Backend (Railway)
# Use Railway dashboard - auto-deploys from GitHub

# Deploy Frontend (Vercel)
cd /Users/selcuk/Desktop/HSE_AgenticAI/admin/Admin
vercel --prod

# Test Production
curl https://inferaworld-admin.vercel.app/api/hsg245
```

---

## 📚 Additional Resources

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- FastAPI Deployment: https://fastapi.tiangolo.com/deployment/

---

**⚠️ IMPORTANT REMINDERS:**

1. Never commit `.env.local` to git (already in `.gitignore`)
2. Always use environment variables for sensitive data
3. Keep backend URL private (use Vercel API routes)
4. Test locally before deploying to production
5. Monitor Railway/Render usage to avoid overages

---

Need help? Check the logs:
- **Backend logs:** Railway/Render dashboard
- **Frontend logs:** Vercel dashboard → Deployments → Function Logs
- **Browser console:** F12 → Console tab

Good luck! 🚀
