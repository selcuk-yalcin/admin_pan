# ✅ DEPLOYMENT CHECKLIST - HSG245 Smart Report

## 📋 Pre-Deployment (Local Testing)

### File Setup
- [ ] `/api/hsg245.js` exists
- [ ] `/src/services/hsg245Api-vercel.js` exists
- [ ] API service renamed: `mv hsg245Api-vercel.js hsg245Api.js`
- [ ] `.env.local` has: `NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000`

### Local Testing
- [ ] Backend running on port 8000
- [ ] Frontend running: `npm run dev`
- [ ] Can access: http://localhost:5173
- [ ] Health check works: `curl http://localhost:5173/api/hsg245`
- [ ] Form submission works
- [ ] Browser console shows no errors
- [ ] AI analysis completes
- [ ] PDF downloads successfully

---

## 🚂 Railway Backend Deployment

### Account Setup
- [ ] Signed up at https://railway.app
- [ ] Connected GitHub account
- [ ] Created new project

### Backend Configuration
- [ ] Selected repo: `HSE_RCAnalysis_AgenticAI`
- [ ] Service deployed automatically
- [ ] Added environment variable: `OPENAI_API_KEY`
- [ ] Added environment variable: `PORT=8000`
- [ ] Set start command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
- [ ] Build completed successfully
- [ ] Deployment shows "Active"

### Railway Testing
- [ ] Got deployment URL: `https://__________.up.railway.app`
- [ ] Saved URL to password manager/notes
- [ ] Health check works: `curl https://your-app.up.railway.app/api/v1/health`
- [ ] Response shows all agents active
- [ ] Logs show no errors

---

## 🔷 Vercel Frontend Deployment

### Environment Configuration
- [ ] Logged into https://vercel.com/dashboard
- [ ] Found project: (name: _______________)
- [ ] Went to Settings → Environment Variables
- [ ] Added: `NEXT_PUBLIC_BACKEND_API_URL`
- [ ] Set value to Railway URL
- [ ] Applied to: ✅ Production ✅ Preview ✅ Development
- [ ] Saved successfully

### Redeployment
- [ ] Went to Deployments tab
- [ ] Latest deployment → "..." menu
- [ ] Clicked "Redeploy"
- [ ] Deployment started
- [ ] Build completed
- [ ] Deployment successful

### Vercel Testing
- [ ] Production URL: `https://__________.vercel.app`
- [ ] Health check works: `curl https://your-site.vercel.app/api/hsg245`
- [ ] Response shows backend is healthy
- [ ] Backend URL matches Railway URL
- [ ] Opened site in browser
- [ ] Can navigate to HSG245 form
- [ ] Form loads without errors

---

## 🧪 Production Testing

### Part 1: Overview (Incident Creation)
- [ ] Filled out "Reported by" field
- [ ] Set date/time
- [ ] Selected event category
- [ ] Entered description
- [ ] Clicked submit
- [ ] AI analysis completed
- [ ] Got incident ID
- [ ] Console shows success

### Part 2: Assessment
- [ ] Selected event type
- [ ] Set actual harm level
- [ ] RIDDOR reportable answered
- [ ] Clicked analyze
- [ ] AI severity analysis completed
- [ ] Investigation level assigned
- [ ] Console shows success

### Part 3: Investigation
- [ ] Answered all 7 questions
- [ ] Clicked analyze
- [ ] 5 Why analysis completed
- [ ] Immediate causes shown
- [ ] Underlying causes shown
- [ ] Root causes shown
- [ ] Console shows success

### Part 4: Action Plan
- [ ] Action plan generated automatically
- [ ] Immediate actions listed
- [ ] Short-term actions listed
- [ ] Long-term actions listed
- [ ] Each action has responsible person
- [ ] Each action has target date

### PDF Generation
- [ ] Clicked "Download PDF" button
- [ ] PDF generation started
- [ ] PDF downloaded to browser
- [ ] PDF opens successfully
- [ ] All 4 parts included in PDF
- [ ] PDF formatting correct
- [ ] File size reasonable

---

## 🔍 Verification

### Browser Console Checks
- [ ] No JavaScript errors
- [ ] API calls show 200 status
- [ ] Response times acceptable (<30s)
- [ ] All data displays correctly

### Network Tab Checks
- [ ] `/api/hsg245` endpoint exists
- [ ] POST requests successful
- [ ] Response payloads correct
- [ ] No CORS errors
- [ ] No 404 errors

### Railway Logs
- [ ] No Python errors
- [ ] OpenAI API calls successful
- [ ] All agents initialized
- [ ] Request/response logged
- [ ] No timeout errors

### Vercel Logs
- [ ] Function logs accessible
- [ ] No serverless errors
- [ ] Execution times acceptable
- [ ] Memory usage normal

---

## 📊 Performance Checks

### Response Times
- [ ] Health check: < 2 seconds
- [ ] Part 1 (Create): < 10 seconds
- [ ] Part 2 (Assessment): < 10 seconds
- [ ] Part 3 (Investigation): < 15 seconds
- [ ] Part 4 (Action Plan): < 10 seconds
- [ ] PDF Generation: < 5 seconds

### User Experience
- [ ] Forms load quickly
- [ ] No lag when typing
- [ ] Buttons respond immediately
- [ ] Loading indicators show
- [ ] Success messages display
- [ ] Error messages clear

---

## 🔐 Security Checks

### Environment Variables
- [ ] `.env.local` NOT in git
- [ ] `.gitignore` includes `.env.local`
- [ ] Backend URL not exposed in frontend code
- [ ] OpenAI API key only on Railway
- [ ] No hardcoded secrets

### API Security
- [ ] Backend URL private (via Vercel proxy)
- [ ] CORS properly configured
- [ ] No sensitive data in logs
- [ ] Error messages don't leak info

---

## 📱 Browser Compatibility

### Desktop Browsers
- [ ] Chrome: Works
- [ ] Firefox: Works
- [ ] Safari: Works
- [ ] Edge: Works

### Mobile Browsers
- [ ] iOS Safari: Works
- [ ] Android Chrome: Works
- [ ] Responsive design: Good

---

## 💾 Data Integrity

### Test Incident
- [ ] Created test incident
- [ ] All data saved correctly
- [ ] Can retrieve incident
- [ ] PDF matches form data
- [ ] No data loss

### Multiple Incidents
- [ ] Created 3+ incidents
- [ ] Each has unique ID
- [ ] Can retrieve any incident
- [ ] No data mixing
- [ ] List shows all incidents

---

## 📈 Monitoring Setup

### Railway Monitoring
- [ ] Checked metrics dashboard
- [ ] CPU usage normal
- [ ] Memory usage normal
- [ ] Request rate acceptable
- [ ] Error rate low

### Vercel Monitoring
- [ ] Checked analytics
- [ ] Function execution count
- [ ] Error rate low
- [ ] Build times acceptable

---

## 📝 Documentation

### Code Documentation
- [ ] All functions commented
- [ ] README updated
- [ ] API endpoints documented
- [ ] Environment vars documented

### User Documentation
- [ ] User guide created (if needed)
- [ ] Screenshots added (if needed)
- [ ] FAQ prepared (if needed)

---

## 🎯 Final Checks

### Production Readiness
- [ ] All features working
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Monitoring in place

### Rollback Plan
- [ ] Previous version URL noted
- [ ] Can rollback in Vercel if needed
- [ ] Railway backup plan ready
- [ ] Database backup (if applicable)

---

## 🎉 Launch

### Go Live
- [ ] All checkboxes above complete
- [ ] Team notified
- [ ] Users informed (if applicable)
- [ ] Support ready

### Post-Launch
- [ ] Monitor for 24 hours
- [ ] Check error logs
- [ ] Respond to issues
- [ ] Gather feedback

---

## 💰 Cost Tracking

### Current Month
- [ ] Railway usage: _____ hours
- [ ] Vercel usage: _____ function calls
- [ ] OpenAI usage: $_____
- [ ] Total: $_____

### Alerts Set
- [ ] Railway approaching limit
- [ ] OpenAI costs high
- [ ] Budget notifications on

---

## 📞 Support Contacts

| Service | Issue | Contact |
|---------|-------|---------|
| Railway | Backend down | https://railway.app/help |
| Vercel | Frontend issue | https://vercel.com/support |
| OpenAI | AI errors | https://help.openai.com |

---

**Checklist completed on:** ___________________

**Completed by:** ___________________

**Production URL:** ___________________

**Railway URL:** ___________________

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

✅ **DEPLOYMENT COMPLETE!**

Congratulations! Your HSG245 Smart Report system is now live in production! 🎉
