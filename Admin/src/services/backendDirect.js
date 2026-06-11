/**
 * Uzun süren işlemler (pipeline polling) doğrudan Railway'e gider — Vercel 300s limitini aşmaz.
 */
import { getUserContextHeaders } from '../rca-frontend/utils/userContext';

export const PRODUCTION_BACKEND_URL = 'https://web-production-c9d02.up.railway.app';

export function getBackendBaseUrl() {
  return (
    import.meta.env.VITE_BACKEND_API_URL ||
    import.meta.env.VITE_HSG245_BACKEND_URL ||
    PRODUCTION_BACKEND_URL
  ).replace(/\/$/, '');
}

const DIRECT_ACTIONS = new Set([
  'bootstrap_interactive',
  'pipeline_start',
  'job_status',
  'get_incident',
  'generate_html',
  'hitl_questions',
  'library_list',
  'library_upsert',
  'library_finalize',
  'library_save_html',
  'library_delete',
  'library_artifact',
]);

export function canUseDirectBackend(action) {
  return Boolean(getBackendBaseUrl()) && DIRECT_ACTIONS.has(action);
}

function buildDirectRequest(action, data = {}) {
  switch (action) {
    case 'bootstrap_interactive':
      return {
        method: 'POST',
        path: '/api/v1/incidents/bootstrap/interactive',
        body: {
          reported_by: data.reported_by || 'Unknown reporter',
          date_time: data.date_time || new Date().toISOString(),
          event_category: data.event_category || 'incident',
          description: data.description || '',
          injury_description: data.injury_description || '',
          forwarded_to: data.forwarded_to || '',
          event_type: data.event_type || '',
          actual_harm: data.actual_harm || '',
          riddor_reportable: data.riddor_reportable || '',
        },
      };
    case 'pipeline_start':
      return {
        method: 'POST',
        path: `/api/v1/incidents/${encodeURIComponent(data.incident_id)}/pipeline/start`,
        body: {
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
        },
      };
    case 'job_status':
      return {
        method: 'GET',
        path: `/api/v1/jobs/${encodeURIComponent(data.job_id)}`,
      };
    case 'get_incident':
      return {
        method: 'GET',
        path: `/api/v1/incidents/${encodeURIComponent(data.incident_id)}`,
      };
    case 'generate_html':
      return {
        method: 'POST',
        path: '/api/v1/reports/html',
        body: {
          incident_id: data.incident_id,
          report_layout: data.report_layout || undefined,
          force_regenerate: !!data.force_regenerate,
        },
      };
    case 'hitl_questions':
      return {
        method: 'POST',
        path: `/api/v1/incidents/${encodeURIComponent(data.incident_id)}/hitl/questions`,
        body: {
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
        },
      };
    case 'library_list': {
      const kindQ = data.kind ? `?kind=${encodeURIComponent(data.kind)}` : '';
      return { method: 'GET', path: `/api/v1/library/items${kindQ}` };
    }
    case 'library_upsert':
      return {
        method: 'POST',
        path: '/api/v1/library/items',
        body: {
          kind: data.kind || 'draft',
          snapshot: data.snapshot || {},
          title_hint: data.title_hint || '',
          incident_id: data.incident_id || '',
          report_ready: !!data.report_ready,
          analysis_model_preset: data.analysis_model_preset || '',
          item_id: data.item_id || '',
        },
      };
    case 'library_finalize':
      return {
        method: 'POST',
        path: '/api/v1/library/items/finalize',
        body: {
          incident_id: data.incident_id,
          snapshot: data.snapshot || {},
          title_hint: data.title_hint || '',
          analysis_model_preset: data.analysis_model_preset || '',
          report_layout: data.report_layout || undefined,
        },
      };
    case 'library_save_html':
      return {
        method: 'POST',
        path: '/api/v1/library/items/save-html',
        body: {
          incident_id: data.incident_id,
          snapshot: data.snapshot || {},
          title_hint: data.title_hint || '',
          analysis_model_preset: data.analysis_model_preset || '',
          report_html: data.report_html || '',
          decision_tree_html: data.decision_tree_html || '',
        },
      };
    case 'library_delete':
      return {
        method: 'DELETE',
        path: `/api/v1/library/items/${encodeURIComponent(data.item_id)}`,
      };
    case 'library_artifact':
      return {
        method: 'GET',
        path: `/api/v1/library/items/${encodeURIComponent(data.item_id)}/artifact/${encodeURIComponent(data.artifact_type || 'report')}`,
      };
    default:
      return null;
  }
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (options.signal) {
    if (options.signal.aborted) {
      clearTimeout(timeoutId);
      throw new DOMException('Aborted', 'AbortError');
    }
    options.signal.addEventListener('abort', onAbort, { once: true });
  }
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', onAbort);
  }
}

/**
 * @returns {Promise<Response>}
 */
export async function fetchBackendDirect(action, data, options = {}) {
  const spec = buildDirectRequest(action, data);
  if (!spec) {
    throw new Error(`Direct backend not mapped for action: ${action}`);
  }
  const base = getBackendBaseUrl();
  const timeoutMs = options.timeoutMs ?? (
    action === 'generate_html' ? 90000
      : action === 'hitl_questions' ? 55000
        : action === 'library_save_html' ? 120000
          : action === 'library_finalize' ? 120000
            : 25000
  );
  const headers = {
    'Content-Type': 'application/json',
    ...getUserContextHeaders(),
  };
  const fetchOptions = { method: spec.method, headers };
  if (spec.method !== 'GET' && spec.body) {
    fetchOptions.body = JSON.stringify(spec.body);
  }
  return fetchWithTimeout(`${base}${spec.path}`, fetchOptions, timeoutMs, options);
}

export async function fetchBackendHealthDirect(options = {}) {
  const base = getBackendBaseUrl();
  return fetchWithTimeout(
    `${base}/api/v1/health`,
    { headers: { ...getUserContextHeaders() } },
    options.timeoutMs ?? 20000,
    options,
  );
}
