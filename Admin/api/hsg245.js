/** Vercel serverless: cold-start + bootstrap retry penceresi. */
export const config = {
  maxDuration: 300,
}

const BACKEND_RETRY_STATUSES = new Set([502, 503, 504])
const BACKEND_RETRY_ACTIONS = new Set([
  'bootstrap_interactive',
  'create_incident_fast',
  'pipeline_start',
  'generate_html',
  'job_status',
])
const BACKEND_MAX_ATTEMPTS = 4
const BACKEND_RETRY_DELAY_MS = 3000
const HEALTH_MAX_ATTEMPTS = 3
const HEALTH_RETRY_DELAY_MS = 2000
const BACKEND_FETCH_TIMEOUT_MS = 22000

/** Railway / gateway hata metnini kullanıcı dostu stringe çevirir. */
function parseBackendErrorText(raw) {
  const text = String(raw || '').trim()
  if (!text) return 'Backend yanıt vermedi'
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text)
      if (typeof parsed?.message === 'string' && parsed.message.trim()) {
        return parsed.message.trim()
      }
      if (typeof parsed?.detail === 'string' && parsed.detail.trim()) {
        return parsed.detail.trim()
      }
      if (typeof parsed?.error === 'string' && parsed.error.trim()) {
        return parsed.error.trim()
      }
    } catch {
      // keep raw
    }
  }
  if (/^upstream error$/i.test(text)) {
    return 'Backend geçici olarak yanıt vermedi (upstream).'
  }
  return text
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithTimeout(url, fetchOptions, timeoutMs = BACKEND_FETCH_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...fetchOptions, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchBackendWithRetry(url, fetchOptions, action) {
  const shouldRetry = BACKEND_RETRY_ACTIONS.has(action)
  const maxAttempts = shouldRetry ? BACKEND_MAX_ATTEMPTS : 1
  let lastError = null

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, fetchOptions)
      if (
        shouldRetry
        && BACKEND_RETRY_STATUSES.has(response.status)
        && attempt < maxAttempts - 1
      ) {
        console.warn(`[RETRY] ${action} backend ${response.status}, attempt ${attempt + 1}/${maxAttempts}`)
        await sleep(BACKEND_RETRY_DELAY_MS)
        continue
      }
      return response
    } catch (err) {
      lastError = err
      if (shouldRetry && attempt < maxAttempts - 1) {
        console.warn(`[RETRY] ${action} fetch failed, attempt ${attempt + 1}/${maxAttempts}:`, err?.message || err)
        await sleep(BACKEND_RETRY_DELAY_MS)
        continue
      }
      throw err
    }
  }

  throw lastError || new Error('Backend request failed after retries')
}

/**
 * Vercel Serverless Function for HSG245 Investigation
 * 
 * IMPORTANT: This runs on Vercel Edge/Serverless
 * Path: /api/hsg245.js -> Accessible at: https://your-site.vercel.app/api/hsg245
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
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Tenant-ID, X-API-Key, X-User-ID, X-User-Email, Authorization'
  )

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    // BACKEND URL: Railway production backend
    // You can also set this in Vercel Dashboard -> Settings -> Environment Variables
    // Preferred variable names (in order):
    // 1) BACKEND_API_URL
    // 2) NEXT_PUBLIC_BACKEND_API_URL
    // 3) VITE_BACKEND_API_URL
    // Fallback is legacy Railway domain.
    const BACKEND_URL = (
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_API_URL ||
      process.env.VITE_BACKEND_API_URL ||
      'https://web-production-c9d02.up.railway.app'
    ).trim()

    console.log('[REQUEST]', req.method, req.url)
    console.log('[BACKEND URL]', BACKEND_URL)
    const forwardHeaders = {}
    if (req.headers['x-tenant-id']) {
      forwardHeaders['X-Tenant-ID'] = String(req.headers['x-tenant-id'])
    }
    if (req.headers['x-api-key']) {
      forwardHeaders['X-API-Key'] = String(req.headers['x-api-key'])
    }
    if (req.headers['authorization']) {
      forwardHeaders['Authorization'] = String(req.headers['authorization'])
    }
    if (req.headers['x-user-id']) {
      forwardHeaders['X-User-ID'] = String(req.headers['x-user-id'])
    }
    if (req.headers['x-user-email']) {
      forwardHeaders['X-User-Email'] = String(req.headers['x-user-email'])
    }

    // Handle GET request (health check) — Railway cold-start için retry
    if (req.method === 'GET') {
      console.log(`[HEALTH CHECK] ${BACKEND_URL}/api/v1/health`)
      let response = null
      let lastHealthError = null

      for (let attempt = 0; attempt < HEALTH_MAX_ATTEMPTS; attempt += 1) {
        try {
          response = await fetchWithTimeout(`${BACKEND_URL}/api/v1/health`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...forwardHeaders,
            },
          }, 15000)
          if (
            BACKEND_RETRY_STATUSES.has(response.status)
            && attempt < HEALTH_MAX_ATTEMPTS - 1
          ) {
            console.warn(`[RETRY] health backend ${response.status}, attempt ${attempt + 1}/${HEALTH_MAX_ATTEMPTS}`)
            await sleep(HEALTH_RETRY_DELAY_MS)
            continue
          }
          break
        } catch (err) {
          lastHealthError = err
          if (attempt < HEALTH_MAX_ATTEMPTS - 1) {
            console.warn(`[RETRY] health fetch failed, attempt ${attempt + 1}/${HEALTH_MAX_ATTEMPTS}:`, err?.message || err)
            await sleep(HEALTH_RETRY_DELAY_MS)
            continue
          }
          throw err
        }
      }

      if (!response?.ok) {
        const errorText = response ? await response.text().catch(() => '') : ''
        const detail = parseBackendErrorText(errorText) || lastHealthError?.message || `Backend returned ${response?.status || 'unknown'}`
        return res.status(response?.status || 502).json({
          error: 'Backend health check failed',
          details: detail,
          backend_url: BACKEND_URL,
        })
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

      console.log('[ACTION]', action)

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

        case 'create_incident_fast':
          endpoint = '/api/v1/incidents/create/fast'
          payload = {
            reported_by: data.reported_by,
            date_time: data.date_time,
            event_category: data.event_category,
            description: data.description,
            injury_description: data.injury_description || '',
            forwarded_to: data.forwarded_to || ''
          }
          break

        case 'bootstrap_interactive':
          endpoint = '/api/v1/incidents/bootstrap/interactive'
          payload = {
            reported_by: data.reported_by || 'Unknown reporter',
            date_time: data.date_time || new Date().toISOString(),
            event_category: data.event_category || 'incident',
            description: data.description || '',
            injury_description: data.injury_description || '',
            forwarded_to: data.forwarded_to || '',
            event_type: data.event_type || '',
            actual_harm: data.actual_harm || '',
            riddor_reportable: data.riddor_reportable || '',
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

        case 'add_assessment_form':
          endpoint = `/api/v1/incidents/${data.incident_id}/assessment/form`
          payload = {
            incident_id: data.incident_id,
            event_type: data.event_type,
            actual_harm: data.actual_harm,
            riddor_reportable: data.riddor_reportable
          }
          break

        case 'investigate':
          return res.status(410).json({
            error: 'Deprecated action',
            details: 'investigate artik desteklenmiyor. pipeline_start + job_status kullanin.',
          })

        case 'pipeline_start':
          endpoint = `/api/v1/incidents/${data.incident_id}/pipeline/start`
          payload = {
            how_happened: data.how_happened || '',
            location: data.location || '',
            who_involved: data.who_involved || '',
            activities: data.activities || '',
            working_conditions: data.working_conditions || '',
            safety_procedures: data.safety_procedures || '',
            injuries: data.injuries || '',
            why_probe_answers: data.why_probe_answers || [],
            root_cause_probe_answers: data.root_cause_probe_answers || [],
            output_language: data.output_language || '',
            analysis_model_preset: data.analysis_model_preset || '',
          }
          break

        case 'job_status':
          endpoint = `/api/v1/jobs/${data.job_id}`
          method = 'GET'
          break

        case 'hitl_questions':
          endpoint = `/api/v1/incidents/${data.incident_id}/hitl/questions`
          payload = {
            how_happened: data.how_happened || '',
            root_cause_initial: data.root_cause_initial || '',
            answered_ids: data.answered_ids || [],
            immediate_causes: data.immediate_causes ?? null,
            immediate_code: data.immediate_code || '',
            why_level: data.why_level ?? 0,
            current_why_question: data.current_why_question || '',
            previous_why_answer: data.previous_why_answer || '',
            mode: data.mode || 'global',
            batch_size: data.batch_size ?? 1,
            known_fields: data.known_fields || [],
            output_language: data.output_language || '',
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

        case 'generate_html':
          endpoint = `/api/v1/reports/html`
          payload = {
            incident_id: data.incident_id,
            report_layout: data.report_layout || undefined,
            force_regenerate: !!data.force_regenerate,
          }

          // HTML report links endpoint
          const htmlMetaResp = await fetchBackendWithRetry(
            `${BACKEND_URL}${endpoint}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...forwardHeaders },
              body: JSON.stringify(payload),
            },
            action,
          )

          if (!htmlMetaResp.ok) {
            const error = await htmlMetaResp.text()
            return res.status(htmlMetaResp.status).json({ 
              error: 'HTML report generation failed', 
              details: error 
            })
          }
          return res.status(200).json(await htmlMetaResp.json())

        case 'download_html_report':
          endpoint = `/api/v1/reports/${data.incident_id}/html?download=1`
          method = 'GET'
          break

        case 'download_decision_tree':
          endpoint = `/api/v1/reports/${data.incident_id}/decision-tree?download=1`
          method = 'GET'
          break

        case 'download_docx_report':
          endpoint = `/api/v1/reports/generate`
          method = 'POST'
          payload = {
            incident_id: data.incident_id,
            report_layout: data.report_layout || undefined,
            force_regenerate: !!data.force_regenerate,
          }
          break

        case 'report_layout_options': {
          const langQ = data.lang ? `?lang=${encodeURIComponent(data.lang)}` : ''
          endpoint = `/api/v1/reports/layout-options${langQ}`
          method = 'GET'
          payload = undefined
          break
        }

        case 'save_report_layout':
          endpoint = `/api/v1/incidents/${encodeURIComponent(data.incident_id)}/report-layout`
          method = 'PUT'
          payload = {
            report_layout: data.report_layout || {},
            force_regenerate: data.force_regenerate !== false,
          }
          break

        case 'view_html_report':
          endpoint = `/api/v1/reports/${data.incident_id}/html?download=0`
          method = 'GET'
          break

        case 'view_decision_tree':
          endpoint = `/api/v1/reports/${data.incident_id}/decision-tree?download=0`
          method = 'GET'
          break

        case 'list_incidents':
          endpoint = `/api/v1/incidents`
          method = 'GET'
          break

        case 'library_list': {
          const kindQ = data.kind ? `?kind=${encodeURIComponent(data.kind)}` : ''
          endpoint = `/api/v1/library/items${kindQ}`
          method = 'GET'
          payload = undefined
          break
        }

        case 'library_upsert':
          endpoint = `/api/v1/library/items`
          method = 'POST'
          payload = {
            kind: data.kind || 'draft',
            snapshot: data.snapshot || {},
            title_hint: data.title_hint || '',
            incident_id: data.incident_id || '',
            report_ready: !!data.report_ready,
            analysis_model_preset: data.analysis_model_preset || '',
            item_id: data.item_id || '',
          }
          break

        case 'library_finalize':
          endpoint = `/api/v1/library/items/finalize`
          method = 'POST'
          payload = {
            incident_id: data.incident_id,
            snapshot: data.snapshot || {},
            title_hint: data.title_hint || '',
            analysis_model_preset: data.analysis_model_preset || '',
            report_layout: data.report_layout || undefined,
          }
          break

        case 'library_save_html':
          endpoint = `/api/v1/library/items/save-html`
          method = 'POST'
          payload = {
            incident_id: data.incident_id,
            snapshot: data.snapshot || {},
            title_hint: data.title_hint || '',
            analysis_model_preset: data.analysis_model_preset || '',
            report_html: data.report_html || '',
            decision_tree_html: data.decision_tree_html || '',
          }
          break

        case 'library_delete':
          endpoint = `/api/v1/library/items/${encodeURIComponent(data.item_id)}`
          method = 'DELETE'
          payload = undefined
          break

        case 'library_artifact':
          endpoint = `/api/v1/library/items/${encodeURIComponent(data.item_id)}/artifact/${encodeURIComponent(data.artifact_type || 'report')}`
          method = 'GET'
          payload = undefined
          break

        case 'usage_summary':
          endpoint = '/api/v1/usage/summary'
          method = 'GET'
          payload = undefined
          break

        case 'usage_timeseries': {
          const d = data.days != null ? Number(data.days) : 7
          endpoint = `/api/v1/usage/timeseries?days=${encodeURIComponent(d)}`
          method = 'GET'
          payload = undefined
          break
        }

        case 'usage_by_module': {
          const d = data.days != null ? Number(data.days) : 30
          endpoint = `/api/v1/usage/by-module?days=${encodeURIComponent(d)}`
          method = 'GET'
          payload = undefined
          break
        }

        case 'usage_recent': {
          const lim = data.limit != null ? Number(data.limit) : 20
          endpoint = `/api/v1/usage/recent?limit=${encodeURIComponent(lim)}`
          method = 'GET'
          payload = undefined
          break
        }

        case 'list_deliveries': {
          const lim = data.limit != null ? Number(data.limit) : 10
          endpoint = `/api/v1/deliveries?limit=${encodeURIComponent(lim)}`
          method = 'GET'
          payload = undefined
          break
        }

        default:
          return res.status(400).json({ error: `Unknown action: ${action}` })
      }

      // Make request to backend
      console.log(`[CALLING] ${BACKEND_URL}${endpoint}`)
      
      const fetchOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...forwardHeaders,
        },
      }

      if (method === 'POST') {
        fetchOptions.body = JSON.stringify(payload)
      }

      let response
      try {
        response = await fetchBackendWithRetry(
          `${BACKEND_URL}${endpoint}`,
          fetchOptions,
          action,
        )
      } catch (fetchError) {
        console.error('[ERROR] Backend fetch failed:', fetchError?.message || fetchError)
        return res.status(502).json({
          error: 'Backend unreachable',
          details: `Gateway could not reach backend at ${BACKEND_URL}${endpoint}: ${fetchError?.message || 'fetch failed'}`,
          backend_url: BACKEND_URL
        })
      }

      if (!response.ok) {
        const error = await response.text()
        const parsedDetail = parseBackendErrorText(error)
        console.error('[ERROR] Backend error:', parsedDetail)
        return res.status(response.status).json({
          error: 'Backend API error',
          details: parsedDetail,
          status: response.status
        })
      }

      if (
        action === 'download_html_report' ||
        action === 'download_decision_tree' ||
        action === 'download_docx_report'
      ) {
        const fileBuffer = await response.arrayBuffer()
        const contentType = response.headers.get('content-type') || 'text/html; charset=utf-8'
        const disposition = response.headers.get('content-disposition') || 'attachment'
        res.setHeader('Content-Type', contentType)
        res.setHeader('Content-Disposition', disposition)
        return res.send(Buffer.from(fileBuffer))
      }

      if (action === 'view_html_report' || action === 'view_decision_tree' || action === 'library_artifact') {
        const html = await response.text()
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        return res.status(200).send(html)
      }

      const result = await response.json()
      console.log('[SUCCESS]')

      return res.status(200).json(result)
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('[ERROR]', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
