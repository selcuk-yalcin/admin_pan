/**
 * Vercel Serverless Function for HSG245 Investigation
 * 
 * ⚠️ IMPORTANT: This runs on Vercel Edge/Serverless
 * Path: /api/hsg245.js → Accessible at: https://your-site.vercel.app/api/hsg245
 * 
 * Backend URL must be set in Vercel environment variables:
 * NEXT_PUBLIC_BACKEND_API_URL=https://your-backend.up.railway.app
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    // ⚠️ BACKEND URL: Railway production backend
    // You can also set this in Vercel Dashboard → Settings → Environment Variables
    // Variable name: NEXT_PUBLIC_BACKEND_API_URL
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://hsercanalysisagenticai-production.up.railway.app'

    console.log('📥 Request:', req.method, req.url)
    console.log('🔗 Backend URL:', BACKEND_URL)

    // Handle GET request (health check)
    if (req.method === 'GET') {
      console.log(`🏥 Health check: ${BACKEND_URL}/api/v1/health`)
      
      const response = await fetch(`${BACKEND_URL}/api/v1/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`)
      }

      const data = await response.json()
      
      return res.status(200).json({
        status: 'healthy',
        backend: data,
        backend_url: BACKEND_URL,
        timestamp: new Date().toISOString()
      })
    }

    // Handle POST requests
    if (req.method === 'POST') {
      const { action, data } = req.body

      if (!action) {
        return res.status(400).json({ error: 'Missing action parameter' })
      }

      console.log('📡 Action:', action)

      let endpoint = ''
      let method = 'POST'
      let payload = data

      // Route based on action
      switch (action) {
        case 'create_incident':
          endpoint = '/api/v1/incidents/create'
          payload = {
            reported_by: data.reported_by,
            date_time: data.date_time,
            event_category: data.event_category,
            description: data.description,
            injury_description: data.injury_description || '',
            forwarded_to: data.forwarded_to || ''
          }
          break

        case 'add_assessment':
          endpoint = `/api/v1/incidents/${data.incident_id}/assessment`
          payload = {
            incident_id: data.incident_id,
            event_type: data.event_type,
            actual_harm: data.actual_harm,
            riddor_reportable: data.riddor_reportable
          }
          break

        case 'investigate':
          endpoint = `/api/v1/incidents/${data.incident_id}/investigate`
          payload = {
            incident_id: data.incident_id,
            location: data.location,
            who_involved: data.who_involved,
            how_happened: data.how_happened,
            activities: data.activities,
            working_conditions: data.working_conditions,
            safety_procedures: data.safety_procedures,
            injuries: data.injuries
          }
          break

        case 'generate_action_plan':
          endpoint = `/api/v1/incidents/${data.incident_id}/actionplan`
          method = 'POST'
          payload = {}
          break

        case 'get_incident':
          endpoint = `/api/v1/incidents/${data.incident_id}`
          method = 'GET'
          break

        case 'generate_pdf':
          endpoint = `/api/v1/reports/generate`
          payload = { incident_id: data.incident_id }
          
          // PDF needs special handling
          const pdfResponse = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })

          if (!pdfResponse.ok) {
            const error = await pdfResponse.text()
            return res.status(pdfResponse.status).json({ 
              error: 'PDF generation failed', 
              details: error 
            })
          }

          const pdfBuffer = await pdfResponse.arrayBuffer()
          res.setHeader('Content-Type', 'application/pdf')
          res.setHeader('Content-Disposition', `attachment; filename="HSG245_Report_${data.incident_id}.pdf"`)
          return res.send(Buffer.from(pdfBuffer))

        case 'list_incidents':
          endpoint = `/api/v1/incidents`
          method = 'GET'
          break

        default:
          return res.status(400).json({ error: `Unknown action: ${action}` })
      }

      // Make request to backend
      console.log(`📡 Calling: ${BACKEND_URL}${endpoint}`)
      
      const fetchOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      if (method === 'POST') {
        fetchOptions.body = JSON.stringify(payload)
      }

      const response = await fetch(`${BACKEND_URL}${endpoint}`, fetchOptions)

      if (!response.ok) {
        const error = await response.text()
        console.error('❌ Backend error:', error)
        return res.status(response.status).json({
          error: 'Backend API error',
          details: error,
          status: response.status
        })
      }

      const result = await response.json()
      console.log('✅ Success')

      return res.status(200).json(result)
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('💥 Error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
