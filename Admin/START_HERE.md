# 🚀 START HERE - Vercel Integration Guide

## ⚠️ QUICK START (5 Steps - 30 Minutes)

### Step 1: Update API Service ⚠️ DO THIS FIRST

```bash
cd /Users/selcuk/Desktop/HSE_AgenticAI/admin/Admin/src/services
mv hsg245Api.js hsg245Api-backup.js
mv hsg245Api-vercel.js hsg245Api.js
```

**What this does:** Switches from direct backend to Vercel proxy

---

### Step 2: Test Locally ✅

**Terminal 1 (Backend - Already Running):**
```bash
# ✅ Already running on port 8000
```

**Terminal 2 (Frontend):**
```bash
cd /Users/selcuk/Desktop/HSE_AgenticAI/admin/Admin
npm run dev
```

**Browser:**
- Open: http://localhost:5173
- Test form submission
- Check console (F12)

**Expected:** Form works, AI analysis runs, PDF downloads

---

### Step 3: Deploy Backend to Railway ⚠️

**Sign Up:**
- Go to: https://railway.app
- Click "Start a New Project"
- Login with GitHub

**Deploy:**
1. "Deploy from GitHub repo"
2. Select: `HSE_RCAnalysis_AgenticAI`
3. Click on the service

**⚠️ Add Environment Variables:**
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
PORT=8000
```

**⚠️ Set Start Command:**
- Settings → Deploy
- Start Command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`

**Get URL:**
- Settings → Domains
- Copy: `https://YOUR-APP-NAME.up.railway.app`

**Test:**
```bash
curl https://YOUR-APP-NAME.up.railway.app/api/v1/health
```

**Expected:**
```json
{"status":"healthy","agents":{"overview":"active",...}}
```

---

### Step 4: Update Vercel Environment ⚠️

**Go to Vercel:**
- https://vercel.com/dashboard
- Select your project (inferaworld-admin)

**Add Variable:**
- Settings → Environment Variables → Add New
- **Name:** `NEXT_PUBLIC_BACKEND_API_URL`
- **Value:** `https://YOUR-APP-NAME.up.railway.app`
- **Environments:** ✅ Production ✅ Preview ✅ Development
- Click "Save"

**Redeploy:**
- Deployments tab
- Latest deployment → "..." → "Redeploy"

---

### Step 5: Test Production ✅

**Health Check:**
```bash
curl https://YOUR-VERCEL-SITE.vercel.app/api/hsg245
```

**Expected:**
```json
{
  "status": "healthy",
  "backend": {...},
  "backend_url": "https://YOUR-APP-NAME.up.railway.app"
}
```

**Browser Test:**
- Open your Vercel site
- Go to HSG245 form
- Fill and submit
- Check console for success

---

## 📁 Key Files

| File | Purpose | Action |
|------|---------|--------|
| `/api/hsg245.js` | ⚠️ Main proxy | Auto-deployed to Vercel |
| `/src/services/hsg245Api.js` | ⚠️ API client | Rename from -vercel version |
| `/SUMMARY.md` | Complete overview | Read this |
| `/QUICK_START_VERCEL.md` | Detailed guide | Reference |

---

## 🎯 Architecture

```
User → Vercel Frontend → /api/hsg245 → Railway Backend → OpenAI
```

---

## ✅ Checklist

- [ ] Step 1: API service renamed
- [ ] Step 2: Local test works
- [ ] Step 3: Backend on Railway
- [ ] Step 4: Vercel env var set
- [ ] Step 5: Production works

---

## 🐛 Troubleshooting

### "Module not found: hsg245Api"
→ Did you rename the file in Step 1?

### "Cannot reach backend" (local)
→ Is backend running on port 8000?
```bash
curl http://localhost:8000/api/v1/health
```

### "Cannot reach backend" (production)
→ Check Railway is deployed and running
→ Check Vercel environment variable is set correctly

### "404 on /api/hsg245"
→ Redeploy to Vercel (auto-picks up new API file)

---

## 💰 Costs

- Vercel: FREE
- Railway: FREE (500h) or $5/month
- OpenAI: ~$0.50/day

**Total: ~$5-10/month**

---

## 🎉 Done!

After completing these 5 steps, your system will be:
- ✅ Deployed to production
- ✅ Fully functional
- ✅ Scalable
- ✅ Secure

Need more details? Check `/SUMMARY.md`

Good luck! 🚀
