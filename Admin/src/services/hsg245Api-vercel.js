/**
 * HSG245 Investigation API Service
 * Updated to work with Vercel API Routes
 * 
 * ⚠️ ARCHITECTURE:
 * Frontend (Browser) → Vercel API Route (/api/hsg245) → FastAPI Backend (Railway/Render)
 * 
 * This avoids CORS issues and keeps the backend URL private
 */

// ⚠️ IMPORTANT: Use relative path to Vercel API route (not direct backend URL)
// The route.ts file handles proxying to the actual backend
const API_BASE_URL = '/api/hsg245'

/**
 * Handle API errors consistently
 */
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      error: 'Unknown error',
      details: `HTTP ${response.status}: ${response.statusText}` 
    }))
    throw new Error(error.error || error.details || `Request failed with status ${response.status}`)
  }
  return await response.json()
}

/**
 * ============================================================================
 * HEALTH CHECK - System Status
 * ============================================================================
 * Checks if backend is reachable through Vercel API route
 */
export async function checkHealth() {
  try {
    console.log('🏥 Checking backend health...')
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    if (data.status === 'healthy') {
      console.log('✅ Backend connection successful:', data)
    } else {
      console.warn('⚠️ Backend unhealthy:', data)
    }
    
    return data
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message)
    return { 
      status: 'offline', 
      error: error.message,
      backend: null
    }
  }
}

/**
 * ============================================================================
 * PART 1: CREATE INCIDENT - Overview
 * ============================================================================
 * Creates a new incident and performs AI analysis
 * 
 * @param {Object} data - Incident data
 * @param {string} data.reported_by - Person reporting the incident
 * @param {string} data.date_time - Date and time of incident (ISO format)
 * @param {string} data.event_category - Category (Injury, Near-miss, etc.)
 * @param {string} data.description - Detailed description
 * @param {string} data.injury_description - (Optional) Injury details
 * @param {string} data.forwarded_to - (Optional) Who it was forwarded to
 * @returns {Promise} - Incident ID and Part 1 analysis
 */
export async function createIncident(data) {
  try {
    console.log('📝 Creating incident:', data)
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'create_incident',
        data: {
          reported_by: data.reported_by,
          date_time: data.date_time,
          event_category: data.event_category,
          description: data.description,
          injury_description: data.injury_description || '',
          forwarded_to: data.forwarded_to || ''
        }
      })
    })
    
    const result = await handleResponse(response)
    console.log('✅ Incident created:', result.data.incident_id)
    
    return result
  } catch (error) {
    console.error('❌ Create incident failed:', error.message)
    throw error
  }
}

/**
 * ============================================================================
 * PART 2: ADD ASSESSMENT - Severity Analysis
 * ============================================================================
 * Adds assessment data and AI analyzes severity level
 * 
 * @param {string} incidentId - The incident ID from Part 1
 * @param {Object} data - Assessment data
 * @param {string} data.event_type - Accident/Near-miss/Dangerous occurrence
 * @param {string} data.actual_harm - Minor/Serious/Fatal
 * @param {string} data.riddor_reportable - Yes/No
 * @returns {Promise} - Part 2 analysis with investigation level
 */
export async function addAssessment(incidentId, data) {
  try {
    console.log('📊 Adding assessment for:', incidentId, data)
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'add_assessment',
        data: {
          incident_id: incidentId,
          event_type: data.event_type,
          actual_harm: data.actual_harm,
          riddor_reportable: data.riddor_reportable
        }
      })
    })
    
    const result = await handleResponse(response)
    console.log('✅ Assessment completed:', result.data.investigation_level)
    
    return result
  } catch (error) {
    console.error('❌ Add assessment failed:', error.message)
    throw error
  }
}

/**
 * ============================================================================
 * PART 3: INVESTIGATE INCIDENT - Root Cause Analysis
 * ============================================================================
 * Performs detailed investigation and AI 5 Why analysis
 * 
 * @param {string} incidentId - The incident ID
 * @param {Object} data - Investigation details (7 questions)
 * @returns {Promise} - Root cause analysis (immediate, underlying, root causes)
 */
export async function investigateIncident(incidentId, data) {
  try {
    console.log('🔍 Investigating incident:', incidentId)
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'investigate',
        data: {
          incident_id: incidentId,
          location: data.location,
          who_involved: data.who_involved,
          how_happened: data.how_happened,
          activities: data.activities,
          working_conditions: data.working_conditions,
          safety_procedures: data.safety_procedures,
          injuries: data.injuries
        }
      })
    })
    
    const result = await handleResponse(response)
    console.log('✅ Investigation completed:', result.data.root_causes.length, 'root causes found')
    
    return result
  } catch (error) {
    console.error('❌ Investigation failed:', error.message)
    throw error
  }
}

/**
 * ============================================================================
 * PART 4: GENERATE ACTION PLAN - Risk Control Measures
 * ============================================================================
 * AI generates action plan based on root causes
 * 
 * @param {string} incidentId - The incident ID
 * @returns {Promise} - Action plan with immediate/short/long-term actions
 */
export async function generateActionPlan(incidentId) {
  try {
    console.log('💡 Generating action plan for:', incidentId)
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'generate_action_plan',
        data: {
          incident_id: incidentId
        }
      })
    })
    
    const result = await handleResponse(response)
    console.log('✅ Action plan generated:', result.data.control_measures.length, 'actions')
    
    return result
  } catch (error) {
    console.error('❌ Generate action plan failed:', error.message)
    throw error
  }
}

/**
 * ============================================================================
 * GET INCIDENT - Retrieve Complete Data
 * ============================================================================
 * Gets all data for a specific incident (all 4 parts)
 * 
 * @param {string} incidentId - The incident ID
 * @returns {Promise} - Complete incident data
 */
export async function getIncident(incidentId) {
  try {
    console.log('📥 Getting incident data:', incidentId)
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'get_incident',
        data: {
          incident_id: incidentId
        }
      })
    })
    
    const result = await handleResponse(response)
    console.log('✅ Incident data retrieved')
    
    return result
  } catch (error) {
    console.error('❌ Get incident failed:', error.message)
    throw error
  }
}

/**
 * ============================================================================
 * GENERATE PDF REPORT - Export Investigation
 * ============================================================================
 * Generates and downloads a complete HSG245 PDF report
 * 
 * @param {string} incidentId - The incident ID
 * @returns {Promise} - PDF blob (auto-downloads)
 */
export async function generatePDFReport(incidentId) {
  try {
    console.log('📄 Generating PDF report for:', incidentId)
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'generate_pdf',
        data: {
          incident_id: incidentId
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`PDF generation failed: ${response.status}`)
    }
    
    // Get PDF blob
    const blob = await response.blob()
    
    // Auto-download
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `HSG245_Report_${incidentId}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    console.log('✅ PDF downloaded successfully')
    
    return { success: true, message: 'PDF downloaded' }
  } catch (error) {
    console.error('❌ PDF generation failed:', error.message)
    throw error
  }
}

/**
 * ============================================================================
 * LIST INCIDENTS - Get All Incidents
 * ============================================================================
 * Lists all incidents in the system
 * 
 * @returns {Promise} - Array of incidents
 */
export async function listIncidents() {
  try {
    console.log('📋 Listing all incidents...')
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'list_incidents',
        data: {}
      })
    })
    
    const result = await handleResponse(response)
    console.log('✅ Retrieved', result.data.length, 'incidents')
    
    return result
  } catch (error) {
    console.error('❌ List incidents failed:', error.message)
    throw error
  }
}

/**
 * ============================================================================
 * COMPLETE WORKFLOW - Run All Steps
 * ============================================================================
 * Convenience function to run the entire investigation workflow
 * 
 * @param {Object} part1Data - Overview data
 * @param {Object} part2Data - Assessment data
 * @param {Object} part3Data - Investigation data
 * @returns {Promise} - Complete results including PDF
 */
export async function runCompleteWorkflow(part1Data, part2Data, part3Data) {
  try {
    console.log('🚀 Starting complete workflow...')
    
    // Part 1: Create incident
    const part1Result = await createIncident(part1Data)
    const incidentId = part1Result.data.incident_id
    
    console.log('✅ Step 1/4 complete')
    
    // Part 2: Add assessment
    const part2Result = await addAssessment(incidentId, part2Data)
    console.log('✅ Step 2/4 complete')
    
    // Part 3: Investigation
    const part3Result = await investigateIncident(incidentId, part3Data)
    console.log('✅ Step 3/4 complete')
    
    // Part 4: Action plan
    const part4Result = await generateActionPlan(incidentId)
    console.log('✅ Step 4/4 complete')
    
    // Generate PDF
    await generatePDFReport(incidentId)
    
    console.log('🎉 Complete workflow finished!')
    
    return {
      incident_id: incidentId,
      part1: part1Result.data,
      part2: part2Result.data,
      part3: part3Result.data,
      part4: part4Result.data
    }
  } catch (error) {
    console.error('❌ Workflow failed:', error.message)
    throw error
  }
}

// ⚠️ Export all functions
export default {
  checkHealth,
  createIncident,
  addAssessment,
  investigateIncident,
  generateActionPlan,
  getIncident,
  generatePDFReport,
  listIncidents,
  runCompleteWorkflow
}
