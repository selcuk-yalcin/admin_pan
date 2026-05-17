/**
 * Tenant + authenticated user headers for DeepWhy API gateway.
 */
export function getTenantContextHeaders() {
  if (typeof window === 'undefined') return {};
  const tenantId = (window.localStorage.getItem('tenant_id') || import.meta.env.VITE_TENANT_ID || '').trim();
  const tenantApiKey = (window.localStorage.getItem('tenant_api_key') || import.meta.env.VITE_TENANT_API_KEY || '').trim();
  const headers = {};
  if (tenantId) headers['X-Tenant-ID'] = tenantId;
  if (tenantApiKey) headers['X-API-Key'] = tenantApiKey;
  return headers;
}

export function getUserContextHeaders() {
  const headers = { ...getTenantContextHeaders() };
  if (typeof window === 'undefined') return headers;
  try {
    const raw = window.localStorage.getItem('authUser');
    if (!raw) return headers;
    const user = JSON.parse(raw);
    const uid = user?.id || user?.sub || user?.userId || '';
    if (uid) headers['X-User-ID'] = String(uid);
    if (user?.email) headers['X-User-Email'] = String(user.email);
  } catch {
    // ignore parse errors
  }
  return headers;
}

export function getCurrentUserId() {
  const h = getUserContextHeaders();
  return h['X-User-ID'] || h['X-User-Email'] || 'anonymous';
}
