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
  const html = result?.html || '';
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
