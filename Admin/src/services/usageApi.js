/**
 * Token usage / dashboard API (via Vercel gateway or direct backend).
 */
import { getUserContextHeaders as buildUserContextHeaders } from '../rca-frontend/utils/userContext';

const API_GATEWAY_URL = '/api/hsg245';
const BACKEND_HTTP_BASE = (
  import.meta.env.VITE_BACKEND_API_URL ||
  import.meta.env.VITE_HSG245_BACKEND_URL ||
  ''
).trim();
const GATEWAY_RETRIES = 2;
const GATEWAY_RETRY_DELAY_MS = 2000;

function headers() {
  return {
    'Content-Type': 'application/json',
    ...buildUserContextHeaders(),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Browser always uses Vercel gateway (cold-start retry, no CORS). */
function useDirectBackend() {
  if (typeof window !== 'undefined') {
    return false;
  }
  return Boolean(BACKEND_HTTP_BASE);
}

function isRetriableGatewayError(message) {
  const msg = String(message || '').toLowerCase();
  return (
    msg.includes('aborted') ||
    msg.includes('timeout') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('backend unreachable') ||
    msg.includes('cold-start') ||
    msg.includes('fetch failed') ||
    msg.includes('network')
  );
}

async function handleResponse(response) {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    let message = `HTTP ${response.status}`;
    if (payload?.detail?.message) message = payload.detail.message;
    else if (typeof payload?.detail === 'string') message = payload.detail;
    else if (payload?.details) message = String(payload.details);
    throw new Error(message);
  }
  return response.json();
}

async function gatewayGet(action, extra = {}) {
  let lastError = null;
  for (let attempt = 0; attempt <= GATEWAY_RETRIES; attempt += 1) {
    try {
      const response = await fetch(API_GATEWAY_URL, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ action, data: extra }),
      });
      return handleResponse(response);
    } catch (error) {
      lastError = error;
      if (attempt < GATEWAY_RETRIES && isRetriableGatewayError(error?.message)) {
        await sleep(GATEWAY_RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

async function directGet(path, query = {}) {
  const base = BACKEND_HTTP_BASE.replace(/\/$/, '');
  const qs = new URLSearchParams(query).toString();
  const url = `${base}${path}${qs ? `?${qs}` : ''}`;
  const response = await fetch(url, { method: 'GET', headers: headers() });
  return handleResponse(response);
}

/** Wake Railway backend via gateway health before dashboard batch load. */
export async function prewarmUsageBackend() {
  try {
    const response = await fetch(API_GATEWAY_URL, {
      method: 'GET',
      headers: headers(),
    });
    if (!response.ok) return false;
    await response.json().catch(() => null);
    return true;
  } catch {
    return false;
  }
}

export async function fetchUsageSummary() {
  if (useDirectBackend()) {
    const res = await directGet('/api/v1/usage/summary');
    return res.data;
  }
  const res = await gatewayGet('usage_summary');
  return res.data;
}

export async function fetchUsageTimeseries(days = 7) {
  if (useDirectBackend()) {
    const res = await directGet('/api/v1/usage/timeseries', { days: String(days) });
    return res.data;
  }
  const res = await gatewayGet('usage_timeseries', { days });
  return res.data;
}

export async function fetchUsageByModule(days = 30) {
  if (useDirectBackend()) {
    const res = await directGet('/api/v1/usage/by-module', { days: String(days) });
    return res.data;
  }
  const res = await gatewayGet('usage_by_module', { days });
  return res.data;
}

export async function fetchUsageRecent(limit = 20) {
  if (useDirectBackend()) {
    const res = await directGet('/api/v1/usage/recent', { limit: String(limit) });
    return res.data;
  }
  const res = await gatewayGet('usage_recent', { limit });
  return res.data;
}

export function formatToken(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return String(v);
}

export function formatTokenFull(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('tr-TR');
}

export function formatUsageDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return String(iso).replace('T', ' ').slice(0, 16);
  }
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function fetchReportDeliveries(limit = 10) {
  if (useDirectBackend()) {
    const res = await directGet('/api/v1/deliveries', { limit: String(limit) });
    return res.data;
  }
  const res = await gatewayGet('list_deliveries', { limit });
  return res.data;
}

export function usesAnalysisCredits(summary) {
  return Boolean(summary?.analysis_credits_enforcement_enabled);
}

export function analysisCreditsLabel(summary) {
  if (!summary) return '';
  const rem = summary.analysis_credits_remaining ?? 0;
  const lim = summary.analysis_credits_limit ?? 3;
  return `${rem} / ${lim}`;
}

export function isAnalysisBlocked(summary) {
  if (!summary) return false;
  if (usesAnalysisCredits(summary)) {
    return (summary.analysis_credits_remaining ?? 0) <= 0;
  }
  return (
    summary.warn_level === 'blocked' ||
    (summary.enforcement_enabled && (summary.available ?? 1) <= 0)
  );
}
