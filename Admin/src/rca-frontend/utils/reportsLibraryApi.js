/**
 * Server-side saved reports library (MongoDB via Railway API + Vercel gateway).
 */
import { getUserContextHeaders } from './userContext';

const API_GATEWAY_URL = '/api/hsg245';

async function handleResponse(response) {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    let message = `HTTP ${response.status}`;
    if (payload?.detail) message = payload.detail;
    else if (payload?.details) message = payload.details;
    else if (payload?.error) message = payload.error;
    throw new Error(message);
  }
  const ct = response.headers.get('content-type') || '';
  if (ct.includes('text/html')) {
    return { html: await response.text() };
  }
  return response.json();
}

export async function listLibraryItems(kind = null) {
  const response = await fetch(API_GATEWAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getUserContextHeaders() },
    body: JSON.stringify({
      action: 'library_list',
      data: kind ? { kind } : {},
    }),
  });
  const json = await handleResponse(response);
  return json?.data?.items || [];
}

export async function upsertLibraryItem(payload) {
  const response = await fetch(API_GATEWAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getUserContextHeaders() },
    body: JSON.stringify({
      action: 'library_upsert',
      data: payload,
    }),
  });
  const json = await handleResponse(response);
  return json?.data;
}

export async function finalizeLibraryReport({
  incidentId,
  snapshot = {},
  titleHint = '',
  analysisModelPreset = '',
}) {
  const response = await fetch(API_GATEWAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getUserContextHeaders() },
    body: JSON.stringify({
      action: 'library_finalize',
      data: {
        incident_id: incidentId,
        snapshot,
        title_hint: titleHint,
        analysis_model_preset: analysisModelPreset,
      },
    }),
  });
  const json = await handleResponse(response);
  return json?.data;
}

export async function saveLibraryHtml({
  incidentId,
  snapshot = {},
  titleHint = '',
  analysisModelPreset = '',
  reportHtml = '',
  decisionTreeHtml = '',
}) {
  const response = await fetch(API_GATEWAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getUserContextHeaders() },
    body: JSON.stringify({
      action: 'library_save_html',
      data: {
        incident_id: incidentId,
        snapshot,
        title_hint: titleHint,
        analysis_model_preset: analysisModelPreset,
        report_html: reportHtml,
        decision_tree_html: decisionTreeHtml,
      },
    }),
  });
  const json = await handleResponse(response);
  return json?.data;
}

export async function deleteLibraryItem(itemId) {
  const response = await fetch(API_GATEWAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getUserContextHeaders() },
    body: JSON.stringify({
      action: 'library_delete',
      data: { item_id: itemId },
    }),
  });
  return handleResponse(response);
}

/** Fetch HTML from incident artifacts (generates on backend if needed). */
export async function fetchIncidentArtifactHtml(incidentId, artifactType = 'report') {
  const action = artifactType === 'decision_tree' ? 'view_decision_tree' : 'view_html_report';
  const response = await fetch(API_GATEWAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getUserContextHeaders() },
    body: JSON.stringify({
      action,
      data: { incident_id: incidentId },
    }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.details || payload?.error || `HTTP ${response.status}`);
  }
  return response.text();
}

function openHtmlInNewTab(html, artifactType = 'report') {
  if (!html) throw new Error('Empty HTML');
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (!w) {
    const a = document.createElement('a');
    a.href = url;
    a.download = artifactType === 'decision_tree' ? 'decision_tree.html' : 'report.html';
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Open stored HTML artifact in a new tab (from Mongo). */
export async function openLibraryArtifact(itemId, artifactType = 'report') {
  const response = await fetch(API_GATEWAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getUserContextHeaders() },
    body: JSON.stringify({
      action: 'library_artifact',
      data: { item_id: itemId, artifact_type: artifactType },
    }),
  });
  const result = await handleResponse(response);
  openHtmlInNewTab(result?.html || '', artifactType);
}

/** Open report HTML: Mongo first, then live incident artifacts. */
export async function openReportForEntry(entry, artifactType = 'report') {
  const incidentId = entry?.incidentId || entry?.incident_id || '';
  const itemId = entry?.id || (incidentId ? `report-${incidentId}` : '');
  try {
    if (itemId) {
      await openLibraryArtifact(itemId, artifactType);
      return;
    }
  } catch {
    // fall through
  }
  if (!incidentId) throw new Error('incidentId missing');
  const html = await fetchIncidentArtifactHtml(incidentId, artifactType);
  openHtmlInNewTab(html, artifactType);
}

/**
 * Persist report + decision tree HTML to user library.
 * Tries fast save-html path after generating artifacts via gateway.
 */
export async function syncReportHtmlToLibrary({
  incidentId,
  snapshot = {},
  titleHint = '',
  analysisModelPreset = '',
  generateHTMLReportFn,
}) {
  if (!incidentId) throw new Error('incidentId required');

  try {
    return await finalizeLibraryReport({
      incidentId,
      snapshot,
      titleHint,
      analysisModelPreset,
    });
  } catch {
    // Vercel may timeout on finalize — generate then upload HTML in two lighter calls.
  }

  if (typeof generateHTMLReportFn === 'function') {
    await generateHTMLReportFn(incidentId);
  }

  const reportHtml = await fetchIncidentArtifactHtml(incidentId, 'report');
  let decisionTreeHtml = '';
  try {
    decisionTreeHtml = await fetchIncidentArtifactHtml(incidentId, 'decision_tree');
  } catch {
    decisionTreeHtml = '';
  }

  return saveLibraryHtml({
    incidentId,
    snapshot,
    titleHint,
    analysisModelPreset,
    reportHtml,
    decisionTreeHtml,
  });
}
