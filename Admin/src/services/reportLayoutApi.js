/**
 * Report layout / template options (P0.9).
 */
import { getUserContextHeaders } from '../rca-frontend/utils/userContext';

const API_GATEWAY_URL = '/api/hsg245';
const BACKEND_HTTP_BASE = (
  import.meta.env.VITE_BACKEND_API_URL ||
  import.meta.env.VITE_HSG245_BACKEND_URL ||
  ''
).trim();

function headers() {
  return {
    'Content-Type': 'application/json',
    ...getUserContextHeaders(),
  };
}

async function handleResponse(response) {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    let message = `HTTP ${response.status}`;
    if (typeof payload?.detail === 'string') message = payload.detail;
    else if (payload?.error) message = payload.error;
    throw new Error(message);
  }
  return response.json();
}

export const DEFAULT_REPORT_LAYOUT = {
  cover_template: 'standard',
  show_technical_codes: false,
  watermark_mode: 'final',
  sections: [
    'cover',
    'executive_summary',
    'incident_details',
    'analysis_method',
    'branches',
    'root_causes',
    'corrective_actions',
    'lessons_learned',
    'conclusion',
  ],
};

export async function fetchReportLayoutOptions(lang = 'tr') {
  if (BACKEND_HTTP_BASE) {
    const base = BACKEND_HTTP_BASE.replace(/\/$/, '');
    const res = await fetch(`${base}/api/v1/reports/layout-options?lang=${encodeURIComponent(lang)}`, {
      method: 'GET',
      headers: headers(),
    });
    const json = await handleResponse(res);
    return json.data;
  }
  const response = await fetch(API_GATEWAY_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      action: 'report_layout_options',
      data: { lang },
    }),
  });
  const json = await handleResponse(response);
  return json.data;
}

export async function saveReportLayout(incidentId, reportLayout, { forceRegenerate = true } = {}) {
  const payload = {
    incident_id: incidentId,
    report_layout: reportLayout,
    force_regenerate: forceRegenerate,
  };
  if (BACKEND_HTTP_BASE) {
    const base = BACKEND_HTTP_BASE.replace(/\/$/, '');
    const res = await fetch(`${base}/api/v1/incidents/${encodeURIComponent(incidentId)}/report-layout`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        report_layout: reportLayout,
        force_regenerate: forceRegenerate,
      }),
    });
    const json = await handleResponse(res);
    return json.data;
  }
  const response = await fetch(API_GATEWAY_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      action: 'save_report_layout',
      data: payload,
    }),
  });
  const json = await handleResponse(response);
  return json.data;
}

export function buildLayoutPayload(catalog, selection) {
  const sections = catalog?.sections?.map((s) => s.id) || DEFAULT_REPORT_LAYOUT.sections;
  const enabled = selection.enabledSections || sections;
  return {
    cover_template: selection.coverTemplate || 'standard',
    show_technical_codes: Boolean(selection.showTechnicalCodes),
    watermark_mode: selection.watermarkMode || 'final',
    sections: enabled.filter((id) => sections.includes(id)),
  };
}
