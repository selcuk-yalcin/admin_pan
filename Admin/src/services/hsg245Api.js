/**
 * HSG245 Investigation API Service
 * 
 * UPDATED: Now uses Vercel API Route as proxy to Railway backend
 * 
 * Architecture:
 * Admin Panel -> Vercel API Route (/api/hsg245) -> Railway Backend -> AI Agents
 * 
 * Benefits:
 * - No CORS issues
 * - Backend URL stays private
 * - Better security
 */

// IMPORTANT: Use Vercel serverless gateway endpoint.
// Admin/api/hsg245.js expects { action, data } payload on POST.
const API_GATEWAY_URL = '/api/hsg245';
const BACKEND_HTTP_BASE = (
  import.meta.env.VITE_BACKEND_API_URL ||
  import.meta.env.VITE_HSG245_BACKEND_URL ||
  ''
).trim();

function getTenantContextHeaders() {
  if (typeof window === 'undefined') return {};
  const tenantId = (window.localStorage.getItem('tenant_id') || import.meta.env.VITE_TENANT_ID || '').trim();
  const tenantApiKey = (window.localStorage.getItem('tenant_api_key') || import.meta.env.VITE_TENANT_API_KEY || '').trim();
  const headers = {};
  if (tenantId) headers['X-Tenant-ID'] = tenantId;
  if (tenantApiKey) headers['X-API-Key'] = tenantApiKey;
  return headers;
}

function normalizeWebSocketBase(raw) {
  if (!raw) return '';
  try {
    const u = new URL(raw);
    if (u.protocol === 'https:') u.protocol = 'wss:';
    else if (u.protocol === 'http:') u.protocol = 'ws:';
    if (u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function resolveJobWebSocketUrl(jobId) {
  const explicitWs = (import.meta.env.VITE_BACKEND_WS_URL || '').trim();
  const wsBase = normalizeWebSocketBase(explicitWs || BACKEND_HTTP_BASE);
  if (!wsBase || !jobId) return '';
  const tenantId = (typeof window !== 'undefined' && window.localStorage.getItem('tenant_id')) || import.meta.env.VITE_TENANT_ID || '';
  const query = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : '';
  return `${wsBase}/ws/jobs/${jobId}${query}`;
}

/**
 * API çağrılarında hata yönetimi için yardımcı fonksiyon
 */
async function handleResponse(response) {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    let message = `HTTP ${response.status}: ${response.statusText}`;
    if (payload) {
      // Gateway shape: { error, details, status }
      // Backend shape: { detail: "..." }
      if (typeof payload.detail === 'string' && payload.detail.trim()) {
        message = payload.detail;
      } else if (typeof payload.details === 'string' && payload.details.trim()) {
        try {
          const nested = JSON.parse(payload.details);
          if (nested?.detail) {
            message = String(nested.detail);
          } else {
            message = payload.details;
          }
        } catch {
          message = payload.details;
        }
      } else if (typeof payload.error === 'string' && payload.error.trim()) {
        message = payload.error;
      }
    }
    throw new Error(message || 'Unknown error');
  }
  return await response.json();
}

/**
 * ============================================================================
 * HEALTH CHECK - Sistem Durumu Kontrolü
 * ============================================================================
 * Backend'in çalışıp çalışmadığını kontrol eder.
 * Admin panel açıldığında otomatik çağrılmalı.
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_GATEWAY_URL}`, { method: 'GET' });
    const data = await handleResponse(response);
    
    console.log('[SUCCESS] Backend bağlantısı başarılı:', data);
    return data;
  } catch (error) {
    console.error('[ERROR] Backend bağlantısı başarısız:', error.message);
    return { 
      status: 'offline', 
      error: error.message,
      agents: {}
    };
  }
}

/**
 * ============================================================================
 * PART 1: CREATE INCIDENT - Incident Oluşturma
 * ============================================================================
 * Kullanıcı formu doldurduktan sonra ilk çağrılan fonksiyon.
 * Overview Agent çalıştırılır ve incident ID oluşturulur.
 * 
 * @param {Object} data - Form verisi
 * @param {string} data.reported_by - Rapor eden kişi (örn: "John Doe - Safety Officer")
 * @param {string} data.description - Olay açıklaması
 * @param {string} data.injury_description - Yaralanma detayı
 * @param {string} data.forwarded_to - Kime iletildi
 * @param {string} data.event_category - Olay kategorisi
 * 
 * @returns {Promise<Object>} - { success, data: { incident_id, part1 } }
 */
export async function createIncident(data, options = {}) {
  console.log('[INFO] Creating incident...', data);
  
  try {
    const response = await fetch(`${API_GATEWAY_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getTenantContextHeaders(),
      },
      signal: options.signal,
      body: JSON.stringify({
        action: 'create_incident',
        data: {
          reported_by: data.reported_by,
          description: data.description,
          injury_description: data.injury_description || '',
          forwarded_to: data.forwarded_to || '',
          event_category: data.event_category || '',
          date_time: data.date_time || new Date().toISOString()
        }
      })
    });
    
    const result = await handleResponse(response);
    console.log('[SUCCESS] Incident created:', result.data.incident_id);
    
    return result;
  } catch (error) {
    console.error('[ERROR] Failed to create incident:', error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * PART 2: ADD ASSESSMENT - Değerlendirme Ekleme
 * ============================================================================
 * Part 1 tamamlandıktan sonra çağrılır.
 * Assessment Agent çalıştırılır (severity, RIDDOR, investigation level).
 * 
 * @param {string} incidentId - Incident ID (örn: "INC-20260105-020328")
 * @param {Object} data - Assessment verisi
 * @param {string} data.event_type - Olay tipi ("Accident", "Incident", etc.)
 * @param {string} data.actual_harm - Zarar seviyesi ("Minor", "Serious", etc.)
 * @param {string} data.riddor_reportable - RIDDOR durumu ("Yes", "No", "Unsure")
 * 
 * @returns {Promise<Object>} - { success, data: part2_data }
 */
export async function addAssessment(incidentId, data, options = {}) {
  console.log(`[INFO] Adding assessment for ${incidentId}...`);
  
  try {
    const response = await fetch(`${API_GATEWAY_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getTenantContextHeaders(),
      },
      signal: options.signal,
      body: JSON.stringify({
        action: 'add_assessment',
        data: {
          incident_id: incidentId,
          event_type: data.event_type,
          actual_harm: data.actual_harm,
          riddor_reportable: data.riddor_reportable
        }
      })
    });
    
    const result = await handleResponse(response);
    console.log('[SUCCESS] Assessment completed');
    
    return result;
  } catch (error) {
    console.error('[ERROR] Failed to add assessment:', error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * PART 3: INVESTIGATE INCIDENT - Root Cause Analizi
 * ============================================================================
 * Part 2 tamamlandıktan sonra çağrılır.
 * Root Cause Agent çalıştırılır (5 Why analysis).
 * 
 * @param {string} incidentId - Incident ID
 * @param {Object} data - Investigation verisi
 * @param {string} data.location - Olay yeri
 * @param {string} data.who_involved - Yaralanan/dahil olan kişiler
 * @param {string} data.how_happened - Nasıl oldu (detaylı açıklama)
 * @param {string} data.activities - Yapılan aktiviteler
 * @param {string} data.working_conditions - Çalışma koşulları
 * @param {string} data.safety_procedures - Güvenlik prosedürleri
 * @param {string} data.injuries - Yaralanmalar
 * 
 * @returns {Promise<Object>} - { success, data: part3_data with root causes }
 */
/**
 * Dinamik HITL soru batch'i (backend: disambiguation + QuestionEngine / knowledge_base).
 *
 * @param {string} incidentId
 * @param {{ how_happened?: string, root_cause_initial?: string, answered_ids?: string[], immediate_causes?: object[]|null, immediate_code?: string, why_level?: number, current_why_question?: string, previous_why_answer?: string, mode?: 'global'|'why_probe', batch_size?: number, known_fields?: string[] }} body
 */
const HITL_QUESTIONS_TIMEOUT_MS = 120_000;

export async function fetchHitlQuestions(incidentId, body, options = {}) {
  const timeoutMs = options.timeoutMs ?? HITL_QUESTIONS_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_GATEWAY_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getTenantContextHeaders() },
      signal: controller.signal,
      body: JSON.stringify({
        action: 'hitl_questions',
        data: {
          incident_id: incidentId,
          how_happened: body.how_happened || '',
          root_cause_initial: body.root_cause_initial || '',
          answered_ids: body.answered_ids || [],
          immediate_causes: body.immediate_causes ?? null,
          immediate_code: body.immediate_code || '',
          why_level: body.why_level ?? 0,
          current_why_question: body.current_why_question || '',
          previous_why_answer: body.previous_why_answer || '',
          mode: body.mode || 'global',
          batch_size: body.batch_size ?? 1,
          known_fields: body.known_fields || [],
        },
      }),
    });
    return handleResponse(response);
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Soru yükleme zaman aşımı (${Math.round(timeoutMs / 1000)} sn)`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function startPipelineJob(incidentId, data, options = {}) {
  const response = await fetch(`${API_GATEWAY_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getTenantContextHeaders() },
    signal: options.signal,
    body: JSON.stringify({
      action: 'pipeline_start',
      data: {
        incident_id: incidentId,
        how_happened: data.how_happened,
        location: data.location || '',
        who_involved: data.who_involved || '',
        activities: data.activities || '',
        working_conditions: data.working_conditions || '',
        safety_procedures: data.safety_procedures || '',
        injuries: data.injuries || '',
        why_probe_answers: data.why_probe_answers || [],
        output_language: data.output_language || '',
        analysis_model_preset: data.analysis_model_preset || '',
      },
    }),
  });
  return handleResponse(response);
}

export async function getPipelineJobStatus(jobId, options = {}) {
  const response = await fetch(`${API_GATEWAY_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getTenantContextHeaders() },
    signal: options.signal,
    body: JSON.stringify({
      action: 'job_status',
      data: { job_id: jobId },
    }),
  });
  return handleResponse(response);
}

/** Default client wait for Celery pipeline (RCA / thinking models can exceed a few minutes). */
const DEFAULT_PIPELINE_TIMEOUT_MS = 20 * 60 * 1000;

async function pollPipelineJobUntilDone(jobId, options = {}) {
  const pollIntervalMs = options.pollIntervalMs ?? 2000;
  const timeoutMs = options.timeoutMs ?? DEFAULT_PIPELINE_TIMEOUT_MS;
  const startedAt = Date.now();

  while (true) {
    if (options.signal?.aborted) {
      const abortErr = new Error('Pipeline polling aborted');
      abortErr.name = 'AbortError';
      throw abortErr;
    }

    const statusResp = await getPipelineJobStatus(jobId, options);
    const job = statusResp?.data || {};
    if (typeof options.onUpdate === 'function') {
      options.onUpdate(job);
    }

    if (job.status === 'completed') {
      return { success: true, data: job.result, job };
    }
    if (job.status === 'failed') {
      throw new Error(job.error || 'Pipeline failed');
    }
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`Pipeline timeout (${Math.round(timeoutMs / 1000)}s)`);
    }

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (options.signal) {
          options.signal.removeEventListener('abort', onAbort);
        }
        resolve();
      }, pollIntervalMs);
      const onAbort = () => {
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', onAbort);
        const abortErr = new Error('Pipeline polling aborted');
        abortErr.name = 'AbortError';
        reject(abortErr);
      };
      options.signal?.addEventListener('abort', onAbort, { once: true });
    });
  }
}

export function watchPipelineJobWebSocket(jobId, options = {}) {
  const wsUrl = resolveJobWebSocketUrl(jobId);
  if (!wsUrl || typeof WebSocket === 'undefined') {
    return null;
  }

  const socket = new WebSocket(wsUrl);
  const abortSignal = options.signal;
  let finished = false;

  const closeSocket = () => {
    try {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close(1000, 'client_closed');
      }
    } catch {
      // no-op
    }
  };

  const onAbort = () => {
    if (finished) return;
    finished = true;
    closeSocket();
    if (typeof options.onError === 'function') {
      const abortErr = new Error('Pipeline websocket aborted');
      abortErr.name = 'AbortError';
      options.onError(abortErr);
    }
  };
  abortSignal?.addEventListener('abort', onAbort, { once: true });

  socket.onmessage = (event) => {
    if (finished) return;
    try {
      const payload = JSON.parse(event.data || '{}');
      const job = payload?.data || {};
      if (typeof options.onUpdate === 'function') {
        options.onUpdate(job);
      }
      if (job.status === 'completed') {
        finished = true;
        options.onDone?.({ success: true, data: job.result, job });
        closeSocket();
      } else if (job.status === 'failed') {
        finished = true;
        options.onError?.(new Error(job.error || 'Pipeline failed'));
        closeSocket();
      }
    } catch (err) {
      finished = true;
      options.onError?.(err);
      closeSocket();
    }
  };

  socket.onerror = () => {
    if (finished) return;
    finished = true;
    options.onError?.(new Error('WebSocket connection error'));
    closeSocket();
  };

  socket.onclose = () => {
    abortSignal?.removeEventListener('abort', onAbort);
    if (!finished) {
      finished = true;
      options.onError?.(new Error('WebSocket disconnected'));
    }
  };

  return {
    close: () => {
      finished = true;
      abortSignal?.removeEventListener('abort', onAbort);
      closeSocket();
    },
    url: wsUrl,
  };
}

async function runPipelineJobWithWebSocket(jobId, options = {}) {
  return await new Promise((resolve, reject) => {
    const timeoutMs = options.timeoutMs ?? DEFAULT_PIPELINE_TIMEOUT_MS;
    const timeoutId = setTimeout(() => {
      watcher?.close();
      reject(new Error(`Pipeline websocket timeout (${Math.round(timeoutMs / 1000)}s)`));
    }, timeoutMs);

    const watcher = watchPipelineJobWebSocket(jobId, {
      signal: options.signal,
      onUpdate: options.onUpdate,
      onDone: (result) => {
        clearTimeout(timeoutId);
        resolve(result);
      },
      onError: (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    });

    if (!watcher) {
      clearTimeout(timeoutId);
      reject(new Error('WebSocket not configured'));
    }
  });
}

export async function runPipelineJobWithPolling(incidentId, data, options = {}) {
  const started = await startPipelineJob(incidentId, data, options);
  const jobId = started?.data?.job_id;
  if (!jobId) {
    throw new Error('Pipeline baslatildi ama job_id donmedi.');
  }

  const preferWebSocket = options.preferWebSocket !== false;
  if (preferWebSocket) {
    try {
      return await runPipelineJobWithWebSocket(jobId, options);
    } catch (wsError) {
      console.warn('[WARN] WebSocket progress unavailable, falling back to polling:', wsError?.message || wsError);
    }
  }

  return await pollPipelineJobUntilDone(jobId, options);
}

export async function investigateIncident(incidentId, data, options = {}) {
  console.log(`🔍 Investigating incident ${incidentId}...`);
  console.log('⏳ This may take 10-20 seconds (AI analysis running)...');
  
  try {
    const response = await fetch(`${API_GATEWAY_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getTenantContextHeaders(),
      },
      signal: options.signal,
      body: JSON.stringify({
        action: 'investigate',
        data: {
          incident_id: incidentId,
          location: data.location || '',
          who_involved: data.who_involved || '',
          how_happened: data.how_happened,
          activities: data.activities || '',
          working_conditions: data.working_conditions || '',
          safety_procedures: data.safety_procedures || '',
          injuries: data.injuries || '',
          why_probe_answers: data.why_probe_answers || [],
          output_language: data.output_language || '',
          oracle_context: data.oracle_context || '',
          analysis_model_preset: data.analysis_model_preset || '',
        },
      })
    });
    
    const result = await handleResponse(response);
    console.log('[SUCCESS] Investigation completed');
    console.log(`   - Immediate causes: ${result.data.immediate_causes?.length || 0}`);
    console.log(`   - Underlying causes: ${result.data.underlying_causes?.length || 0}`);
    console.log(`   - Root causes: ${result.data.root_causes?.length || 0}`);
    
    return result;
  } catch (error) {
    console.error('[ERROR] Failed to investigate:', error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * PART 4: GENERATE ACTION PLAN - Aksiyon Planı Oluşturma
 * ============================================================================
 * Part 3 tamamlandıktan sonra otomatik çağrılır.
 * Action Plan Agent çalıştırılır (immediate, short-term, long-term actions).
 * 
 * @param {string} incidentId - Incident ID
 * 
 * @returns {Promise<Object>} - { success, data: part4_data with action plan }
 */
export async function generateActionPlan(incidentId, options = {}) {
  console.log(`💡 Generating action plan for ${incidentId}...`);
  
  try {
    const response = await fetch(`${API_GATEWAY_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getTenantContextHeaders(),
      },
      signal: options.signal,
      body: JSON.stringify({
        action: 'generate_action_plan',
        data: { incident_id: incidentId }
      })
    });
    
    const result = await handleResponse(response);
    console.log('[SUCCESS] Action plan generated');
    console.log(`   - Immediate actions: ${result.data.immediate_actions?.length || 0}`);
    console.log(`   - Short-term actions: ${result.data.short_term_actions?.length || 0}`);
    console.log(`   - Long-term actions: ${result.data.long_term_actions?.length || 0}`);
    
    return result;
  } catch (error) {
    console.error('[ERROR] Failed to generate action plan:', error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * GET INCIDENT - Incident Detaylarını Getir
 * ============================================================================
 * Tüm incident verisini (Part 1-4) getirir.
 * Sayfa yenilendiğinde veya devam etmek için kullanılır.
 * 
 * @param {string} incidentId - Incident ID
 * 
 * @returns {Promise<Object>} - Complete incident data
 */
export async function getIncident(incidentId) {
  console.log(`📖 Fetching incident ${incidentId}...`);
  
  try {
    const response = await fetch(`${API_GATEWAY_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getTenantContextHeaders(),
      },
      body: JSON.stringify({
        action: 'get_incident',
        data: { incident_id: incidentId }
      })
    });
    
    const result = await handleResponse(response);
    console.log('[SUCCESS] Incident data retrieved');
    
    return result;
  } catch (error) {
    console.error('[ERROR] Failed to get incident:', error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * LIST INCIDENTS - Tüm Incident'leri Listele
 * ============================================================================
 * Sistemdeki tüm incident'leri getirir.
 * Dashboard/liste sayfası için kullanılır.
 * 
 * @returns {Promise<Object>} - { success, data: [...incidents], count }
 */
export async function listIncidents() {
  console.log('[INFO] Fetching all incidents...');
  
  try {
    const response = await fetch(`${API_GATEWAY_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getTenantContextHeaders(),
      },
      body: JSON.stringify({
        action: 'list_incidents',
        data: {}
      })
    });
    const result = await handleResponse(response);
    
    console.log(`✅ Retrieved ${result.count} incidents`);
    return result;
  } catch (error) {
    console.error('[ERROR] Failed to list incidents:', error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * GENERATE PDF REPORT - PDF Rapor Oluştur ve İndir
 * ============================================================================
 * Tüm 4 part tamamlandıktan sonra çağrılır.
 * PDF Report Agent çalıştırılır ve dosya indirilir.
 * 
 * @param {string} incidentId - Incident ID
 * 
 * @returns {Promise<void>} - PDF otomatik indirilir
 */
export async function generateHTMLReport(incidentId, options = {}) {
  console.log(`📄 Generating HTML report for ${incidentId}...`);
  
  try {
    const response = await fetch(`${API_GATEWAY_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getTenantContextHeaders(),
      },
      signal: options.signal,
      body: JSON.stringify({
        action: 'generate_html',
        data: { incident_id: incidentId }
      })
    });

    const result = await handleResponse(response);
    console.log('[SUCCESS] HTML report artifacts generated');
    return result;
  } catch (error) {
    console.error('[ERROR] Failed to generate HTML report:', error.message);
    throw error;
  }
}

// Backward compatibility: legacy callers still use generatePDFReport name.
export async function generatePDFReport(incidentId, options = {}) {
  await generateHTMLReport(incidentId, options);
  await downloadHTMLReport(incidentId);
}

function downloadHtmlBlob(html, filenameFallback) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filenameFallback;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

async function downloadHtmlLike(action, incidentId, filenameFallback) {
  const response = await fetch(`${API_GATEWAY_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getTenantContextHeaders(),
    },
    body: JSON.stringify({
      action,
      data: { incident_id: incidentId },
    }),
  });
  if (!response.ok) {
    throw new Error(await parseGatewayError(response, 'Download failed'));
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filenameFallback;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function downloadHTMLReport(incidentId) {
  await generateHTMLReport(incidentId);
  return downloadHtmlLike('download_html_report', incidentId, `HSG245_Report_${incidentId}.html`);
}

export async function downloadDecisionTree(incidentId) {
  await generateHTMLReport(incidentId);
  return downloadHtmlLike('download_decision_tree', incidentId, `HSG245_Report_${incidentId}_decision_tree.html`);
}

async function parseGatewayError(response, fallbackMessage) {
  const payload = await response.json().catch(() => ({}));
  let message = payload?.detail || payload?.error || fallbackMessage;
  if (typeof payload?.details === 'string' && payload.details.trim()) {
    try {
      const nested = JSON.parse(payload.details);
      message = nested?.detail || nested?.error || payload.details;
    } catch {
      message = payload.details;
    }
  }
  return message || fallbackMessage;
}

export async function openHTMLReport(incidentId, options = {}) {
  const filename = `HSG245_Report_${incidentId}.html`;
  const response = await fetch(`${API_GATEWAY_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getTenantContextHeaders(),
    },
    body: JSON.stringify({
      action: 'view_html_report',
      data: { incident_id: incidentId },
    }),
  });
  if (!response.ok) {
    throw new Error(await parseGatewayError(response, 'Failed to load report preview'));
  }
  const html = await response.text();

  const reportWindow = options.preopenedWindow;
  if (reportWindow && !reportWindow.closed) {
    try {
      reportWindow.document.open();
      reportWindow.document.write(html);
      reportWindow.document.close();
      return { mode: 'preview' };
    } catch {
      try {
        reportWindow.close();
      } catch {
        /* ignore */
      }
    }
  }

  const blobUrl = window.URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const tab = window.open(blobUrl, '_blank', 'noopener,noreferrer');
  if (tab) {
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 120000);
    return { mode: 'tab' };
  }

  downloadHtmlBlob(html, filename);
  return { mode: 'download' };
}

export async function openDecisionTree(incidentId, options = {}) {
  const filename = `HSG245_Report_${incidentId}_decision_tree.html`;
  const response = await fetch(`${API_GATEWAY_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getTenantContextHeaders(),
    },
    body: JSON.stringify({
      action: 'view_decision_tree',
      data: { incident_id: incidentId },
    }),
  });
  if (!response.ok) {
    throw new Error(await parseGatewayError(response, 'Failed to load decision tree preview'));
  }
  const html = await response.text();

  const treeWindow = options.preopenedWindow;
  if (treeWindow && !treeWindow.closed) {
    try {
      treeWindow.document.open();
      treeWindow.document.write(html);
      treeWindow.document.close();
    } catch {
      try {
        treeWindow.close();
      } catch {
        /* ignore */
      }
    }
  } else {
    const blobUrl = window.URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const tab = window.open(blobUrl, '_blank', 'noopener,noreferrer');
    if (tab) {
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 120000);
    } else {
      downloadHtmlBlob(html, filename);
      return { mode: 'download' };
    }
  }

  const previewWindow = treeWindow && !treeWindow.closed ? treeWindow : null;
  if (!previewWindow) {
    return { mode: 'tab' };
  }

  // Enhance decision tree preview: editable text + in-page download action.
  try {
    const doc = previewWindow.document;
    const toolbar = doc.createElement('div');
    toolbar.id = 'decision-tree-toolbar';
    toolbar.style.position = 'fixed';
    toolbar.style.top = '12px';
    toolbar.style.right = '12px';
    toolbar.style.zIndex = '2147483647';
    toolbar.style.display = 'flex';
    toolbar.style.gap = '8px';
    toolbar.style.padding = '8px';
    toolbar.style.borderRadius = '10px';
    toolbar.style.background = 'rgba(15, 23, 42, 0.92)';
    toolbar.style.border = '1px solid rgba(148, 163, 184, 0.45)';
    toolbar.style.backdropFilter = 'blur(4px)';

    const makeBtn = (label) => {
      const btn = doc.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.style.background = '#1d4ed8';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.style.borderRadius = '8px';
      btn.style.padding = '8px 10px';
      btn.style.fontFamily = 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
      btn.style.fontSize = '13px';
      btn.style.cursor = 'pointer';
      return btn;
    };

    const editBtn = makeBtn('Duzenlemeyi Ac');
    const downloadBtn = makeBtn('Indir (HTML)');
    const hint = doc.createElement('span');
    hint.textContent = 'Metinleri tiklayip duzenleyebilirsiniz.';
    hint.style.color = '#cbd5e1';
    hint.style.fontSize = '12px';
    hint.style.alignSelf = 'center';
    hint.style.marginLeft = '4px';

    const editableNodes = Array.from(
      doc.querySelectorAll('p, span, li, td, th, h1, h2, h3, h4, h5, h6, text, div'),
    ).filter((el) => {
      if (!(el instanceof previewWindow.HTMLElement || el instanceof previewWindow.SVGElement)) return false;
      if (el.closest('#decision-tree-toolbar')) return false;
      if (el.children.length > 0) return false;
      const txt = (el.textContent || '').trim();
      return txt.length > 0;
    });

    let editMode = false;
    editBtn.onclick = () => {
      editMode = !editMode;
      editableNodes.forEach((el) => {
        if (el instanceof previewWindow.HTMLElement) {
          el.contentEditable = editMode ? 'true' : 'false';
          el.style.outline = editMode ? '1px dashed rgba(37, 99, 235, 0.55)' : '';
          el.style.outlineOffset = editMode ? '2px' : '';
          el.style.cursor = editMode ? 'text' : '';
        }
      });
      editBtn.textContent = editMode ? 'Duzenlemeyi Kapat' : 'Duzenlemeyi Ac';
      hint.textContent = editMode
        ? 'Duzenleme aktif. Bittiginde kapatabilirsiniz.'
        : 'Metinleri tiklayip duzenleyebilirsiniz.';
    };

    downloadBtn.onclick = () => {
      const blob = new Blob([`<!doctype html>\n${doc.documentElement.outerHTML}`], { type: 'text/html;charset=utf-8' });
      const url = previewWindow.URL.createObjectURL(blob);
      const a = doc.createElement('a');
      a.href = url;
      a.download = `HSG245_Report_${incidentId}_decision_tree_edited.html`;
      doc.body.appendChild(a);
      a.click();
      a.remove();
      previewWindow.URL.revokeObjectURL(url);
    };

    toolbar.appendChild(editBtn);
    toolbar.appendChild(downloadBtn);
    toolbar.appendChild(hint);
    doc.body.appendChild(toolbar);
  } catch (enhanceError) {
    console.warn('[WARN] Could not enhance decision tree editor:', enhanceError);
  }
  return { mode: 'preview' };
}

/**
 * ============================================================================
 * HELPER FUNCTIONS - Yardımcı Fonksiyonlar
 * ============================================================================
 */

/**
 * Incident status'ü Türkçe'ye çevir
 */
export function getStatusLabel(status) {
  const labels = {
    'created': 'Oluşturuldu (Part 1)',
    'assessed': 'Değerlendirildi (Part 2)',
    'investigated': 'İncelendi (Part 3)',
    'completed': 'Tamamlandı (Part 4)',
    'error': 'Hata'
  };
  return labels[status] || status;
}

/**
 * Priority seviyesi için renk döndür
 */
export function getPriorityColor(priority) {
  const colors = {
    'High': 'red',
    'Medium': 'orange',
    'Low': 'green'
  };
  return colors[priority] || 'gray';
}

/**
 * API URL'ini kontrol et
 */
export function getApiUrl() {
  return API_GATEWAY_URL;
}

// Export all functions as default
export default {
  checkHealth,
  createIncident,
  addAssessment,
  fetchHitlQuestions,
  startPipelineJob,
  getPipelineJobStatus,
  runPipelineJobWithPolling,
  investigateIncident,
  generateActionPlan,
  getIncident,
  listIncidents,
  generatePDFReport,
  generateHTMLReport,
  downloadHTMLReport,
  downloadDecisionTree,
  openHTMLReport,
  openDecisionTree,
  getStatusLabel,
  getPriorityColor,
  getApiUrl
};
