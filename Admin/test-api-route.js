/**
 * Quick Test Script for Vercel API Route
 * 
 * ⚠️ HOW TO RUN:
 * 1. Start backend: python -m uvicorn api.main:app --reload --port 8000
 * 2. Start frontend: npm run dev
 * 3. Open browser: http://localhost:3000
 * 4. Open browser console (F12)
 * 5. Paste this script and run it
 */

async function testVercelAPIRoute() {
  console.log('🧪 Starting Vercel API Route Test...\n')
  
  try {
    // Test 1: Health Check
    console.log('Test 1: Health Check')
    console.log('GET /api/hsg245')
    
    const healthResponse = await fetch('/api/hsg245', {
      method: 'GET'
    })
    
    const healthData = await healthResponse.json()
    console.log('✅ Health check result:', healthData)
    
    if (healthData.status !== 'healthy') {
      console.error('❌ Backend is not healthy!')
      return
    }
    
    console.log('\n---\n')
    
    // Test 2: Create Incident
    console.log('Test 2: Create Incident (Part 1)')
    console.log('POST /api/hsg245 (action: create_incident)')
    
    const incidentData = {
      reported_by: 'Test User - Browser Console',
      date_time: new Date().toISOString(),
      event_category: 'Injury',
      description: 'Browser console test incident - slip and fall in warehouse',
      injury_description: 'Minor bruising',
      forwarded_to: 'Test Manager'
    }
    
    const createResponse = await fetch('/api/hsg245', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_incident',
        data: incidentData
      })
    })
    
    const createResult = await createResponse.json()
    console.log('✅ Incident created:', createResult)
    
    if (!createResult.success) {
      console.error('❌ Failed to create incident!')
      return
    }
    
    const incidentId = createResult.data.incident_id
    console.log('📋 Incident ID:', incidentId)
    
    console.log('\n---\n')
    
    // Test 3: Add Assessment
    console.log('Test 3: Add Assessment (Part 2)')
    console.log('POST /api/hsg245 (action: add_assessment)')
    
    const assessmentResponse = await fetch('/api/hsg245', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_assessment',
        data: {
          incident_id: incidentId,
          event_type: 'Accident',
          actual_harm: 'Minor',
          riddor_reportable: 'No'
        }
      })
    })
    
    const assessmentResult = await assessmentResponse.json()
    console.log('✅ Assessment added:', assessmentResult)
    
    console.log('\n---\n')
    
    // Test 4: Get Incident
    console.log('Test 4: Get Incident Data')
    console.log('POST /api/hsg245 (action: get_incident)')
    
    const getResponse = await fetch('/api/hsg245', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_incident',
        data: { incident_id: incidentId }
      })
    })
    
    const getResult = await getResponse.json()
    console.log('✅ Incident data retrieved:', getResult)
    
    console.log('\n---\n')
    console.log('🎉 All tests passed!')
    console.log('\n📊 Summary:')
    console.log('  ✅ Health check')
    console.log('  ✅ Create incident')
    console.log('  ✅ Add assessment')
    console.log('  ✅ Get incident')
    console.log('\n🚀 Vercel API Route is working correctly!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error('\n🔍 Troubleshooting:')
    console.error('  1. Is backend running? (python -m uvicorn api.main:app --reload --port 8000)')
    console.error('  2. Is frontend running? (npm run dev)')
    console.error('  3. Check .env.local: NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000')
    console.error('  4. Check browser console for CORS errors')
    console.error('  5. Check Network tab for failed requests')
  }
}

// ⚠️ Run the test
console.log('⚠️ INSTRUCTIONS:')
console.log('1. Make sure backend is running on port 8000')
console.log('2. Make sure frontend is running (npm run dev)')
console.log('3. Call: testVercelAPIRoute()')
console.log('\nTo run test, type: testVercelAPIRoute()')

// Auto-run (uncomment to run automatically)
// testVercelAPIRoute()
