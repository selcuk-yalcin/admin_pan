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

function headers() {
  return {
    'Content-Type': 'application/json',
    ...buildUserContextHeaders(),
  };
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
  const response = await fetch(API_GATEWAY_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ action, data: extra }),
  });
  return handleResponse(response);
}

async function directGet(path, query = {}) {
  const base = BACKEND_HTTP_BASE.replace(/\/$/, '');
  const qs = new URLSearchParams(query).toString();
  const url = `${base}${path}${qs ? `?${qs}` : ''}`;
  const response = await fetch(url, { method: 'GET', headers: headers() });
  return handleResponse(response);
}

export async function fetchUsageSummary() {
  if (BACKEND_HTTP_BASE) {
    const res = await directGet('/api/v1/usage/summary');
    return res.data;
  }
  const res = await gatewayGet('usage_summary');
  return res.data;
}

export async function fetchUsageTimeseries(days = 7) {
  if (BACKEND_HTTP_BASE) {
    const res = await directGet('/api/v1/usage/timeseries', { days: String(days) });
    return res.data;
  }
  const res = await gatewayGet('usage_timeseries', { days });
  return res.data;
}

export async function fetchUsageByModule(days = 30) {
  if (BACKEND_HTTP_BASE) {
    const res = await directGet('/api/v1/usage/by-module', { days: String(days) });
    return res.data;
  }
  const res = await gatewayGet('usage_by_module', { days });
  return res.data;
}

export async function fetchUsageRecent(limit = 20) {
  if (BACKEND_HTTP_BASE) {
    const res = await directGet('/api/v1/usage/recent', { limit: String(limit) });
    return res.data;
  }
  const res = await gatewayGet('usage_recent', { limit });
  return res.data;
}

export function formatToken(n) {
  const v = Number(n) || 0;
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return String(v);
}
