# 🧪 Testing Guide - AI Integration

**Last Updated:** 2 January 2026  
**Purpose:** Complete testing procedures for AI-powered Root Cause Analysis

---

## 🚀 **Quick Test (Automated)**

### **Run Automated Test Suite:**

```bash
cd AI_INTEGRATION_BACKUP
chmod +x test.sh
./test.sh
```

**Expected Output:**
```
✅ API Health Check: PASS
✅ AI Analysis: PASS
✅ Frontend Pages: PASS
✅ Vercel Deployment: PASS
```

---

## 🔍 **Manual Testing Steps**

### **Test 1: API Health Check**

**Purpose:** Verify serverless function is deployed and running

**Command:**
```bash
curl https://cpanel.inferaworld.com/api/analyze
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "Root Cause Analysis API",
  "version": "1.0.0",
  "timestamp": "2026-01-02T..."
}
```

**Success Criteria:**
- ✅ HTTP Status: 200
- ✅ JSON response with "healthy" status
- ✅ Timestamp is recent

---

### **Test 2: AI Analysis Request**

**Purpose:** Test full AI analysis with OpenAI integration

**Command:**
```bash
curl -X POST https://cpanel.inferaworld.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "incident_description": "Worker slipped on wet floor in warehouse during morning shift",
    "location": "Warehouse A, Loading Bay 3",
    "date_time": "2026-01-02 09:30:00",
    "witnesses": "John Smith, Safety Supervisor"
  }'
```

**Expected Response Structure:**
```json
{
  "status": "success",
  "incident_id": "INC-...",
  "timestamp": "2026-01-02T...",
  "part1_overview": {
    "incident_type": "Slip/trip/fall",
    "date_time": "2026-01-02 09:30:00",
    "location": "Warehouse A, Loading Bay 3",
    "brief_details": { ... }
  },
  "part2_assessment": {
    "type_of_event": "Accident",
    "actual_potential_harm": "Minor",
    "riddor_reportable": "N",
    "priority": "Low"
  },
  "part3_investigation": {
    "immediate_causes": ["...", "..."],
    "underlying_causes": ["...", "..."],
    "root_causes": ["...", "..."]
  },
  "part4_recommendations": {
    "immediate_actions": ["...", "..."],
    "short_term_actions": ["...", "..."],
    "long_term_actions": ["...", "..."]
  }
}
```

**Success Criteria:**
- ✅ HTTP Status: 200
- ✅ All 4 parts present
- ✅ Arrays contain meaningful data
- ✅ Response time < 30 seconds

---

### **Test 3: Frontend HSG245 Wizard Form**

**URL:** https://cpanel.inferaworld.com/rootcause-form

#### **Step-by-Step Test:**

1. **Open Page:**
   - Navigate to URL
   - Page loads without errors
   - "AI Powered" badge visible

2. **Tab 1 - Overview:**
   - ✅ All fields visible
   - ✅ Dropdowns work
   - ✅ Date/time pickers functional

3. **Tab 2 - Assessment:**
   - ✅ Event type dropdown
   - ✅ Severity levels
   - ✅ RIDDOR options
   - ✅ Investigation level selector

4. **Tab 3 - Info Gathering:**
   - ✅ Location field
   - ✅ Injured person field
   - ✅ **Description field** (main AI input)
   - ✅ Additional fields
   - ✅ "Generate AI Analysis" button visible
   - ✅ Button disabled when description empty

5. **AI Analysis Trigger:**
   - Fill description: "Worker slipped on wet floor in warehouse during morning shift"
   - Fill location: "Warehouse A"
   - Click "Generate AI Analysis"
   - ✅ Button shows "Analyzing with AI..."
   - ✅ Spinner animation appears
   - ✅ Button is disabled during analysis

6. **Tab 4 - Results:**
   - ✅ Auto-navigates to Part 4
   - ✅ Success alert appears
   - ✅ Part 1 Overview displays
   - ✅ Part 2 Assessment displays
   - ✅ Part 3 Investigation shows:
     - Immediate Causes (with bullets)
     - Underlying Causes (with bullets)
     - Root Causes (with bullets)
   - ✅ Form fields auto-populated
   - ✅ "Re-Analyze" button available

7. **Browser Console:**
   - ✅ No red errors
   - ✅ Console logs show:
     ```
     🔍 Starting AI Analysis...
     ✅ AI Analysis Result: {...}
     ```

---

### **Test 4: Frontend Simple Form**

**URL:** https://cpanel.inferaworld.com/root-cause-analysis

#### **Test Steps:**

1. **Open Page:**
   - Navigate to URL
   - Simple form layout loads

2. **Fill Form:**
   - Incident Description
   - Location
   - Date/Time
   - Witnesses

3. **Trigger Analysis:**
   - Click "Analyze" button
   - Loading state appears
   - Results display after ~10-15 seconds

4. **Verify Results:**
   - ✅ All 4 parts displayed
   - ✅ Structured format
   - ✅ No errors

---

## ⚠️ **Common Issues & Solutions**

### **Issue 1: Blank Page**

**Symptoms:**
- Page loads but content is empty
- White screen

**Solutions:**
1. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
2. Check browser console for errors
3. Verify Vercel deployment completed
4. Check network tab for failed requests

---

### **Issue 2: API Returns 500 Error**

**Symptoms:**
```
{"status":"error","message":"..."}
```

**Solutions:**
1. Check Vercel logs
2. Verify OPENAI_API_KEY in Vercel settings
3. Check OpenAI API quota
4. Verify environment variable in all environments

---

### **Issue 3: "Load Failed" Error**

**Symptoms:**
- Alert shows "Failed to generate analysis"
- Network error in console

**Solutions:**
1. Check internet connection
2. Verify API endpoint URL
3. Check CORS headers in analyze.js
4. Test API directly with curl

---

### **Issue 4: Results Show [object Object]**

**Symptoms:**
- Part 1 or Part 2 shows `[object Object]` instead of data

**Solutions:**
1. This was fixed in latest version
2. Ensure using updated Rootcauseform.jsx
3. Check field names match API response
4. Verify JSON parsing in handleAIAnalysis

---

## 📊 **Test Checklist**

### **Before Deployment:**
- [ ] All files backed up
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Build completes without errors

### **After Deployment:**
- [ ] API health check passes
- [ ] AI analysis returns valid JSON
- [ ] Frontend pages accessible
- [ ] Forms render correctly
- [ ] AI button triggers analysis
- [ ] Results display properly
- [ ] No console errors
- [ ] Browser cache cleared

### **User Acceptance:**
- [ ] End-to-end form flow works
- [ ] AI results are accurate
- [ ] UI is user-friendly
- [ ] Loading states are clear
- [ ] Error messages are helpful

---

## 🔧 **Debugging Commands**

### **Check Vercel Deployment:**
```bash
# Check if page is deployed
curl -I https://cpanel.inferaworld.com/rootcause-form

# Expected: HTTP/2 200
```

### **Test API Endpoint:**
```bash
# Health check
curl https://cpanel.inferaworld.com/api/analyze

# Full analysis
curl -X POST https://cpanel.inferaworld.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"incident_description":"test",...}'
```

### **Check Response Time:**
```bash
time curl -X POST https://cpanel.inferaworld.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"incident_description":"Worker slipped on wet floor"}'
```

### **Verbose Output:**
```bash
curl -v https://cpanel.inferaworld.com/api/analyze
```

---

## 📈 **Performance Benchmarks**

### **Expected Response Times:**
- API Health Check: < 1 second
- AI Analysis: 10-20 seconds
- Page Load: < 3 seconds
- Form Interaction: Instant

### **Error Rates:**
- API Success Rate: > 95%
- Frontend Error Rate: < 1%

---

## 🎯 **Success Metrics**

### **API:**
- ✅ Uptime: 99%+
- ✅ Response time: < 30s
- ✅ Error rate: < 5%

### **Frontend:**
- ✅ Page load: < 3s
- ✅ No JavaScript errors
- ✅ Mobile responsive

### **AI Quality:**
- ✅ Relevant root causes
- ✅ Actionable recommendations
- ✅ Proper HSG245 format

---

## 📞 **Support**

**Issues Found?**
1. Check this guide first
2. Review CHANGES.md
3. Check INVENTORY.md for file details
4. Review backup files for reference

**Still Stuck?**
- Check Vercel deployment logs
- Review browser console errors
- Test API directly with curl
- Compare with backup version

---

**Last Test Run:** 2 January 2026, 04:42 UTC  
**Test Status:** ✅ All tests passing  
**Next Test:** After any code changes
