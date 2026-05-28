/**
 * P0.11 — Pricing plans from backend catalog.
 */
import { getUserContextHeaders as buildUserContextHeaders } from '../rca-frontend/utils/userContext';

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
    if (typeof payload?.detail === 'string') message = payload.detail;
    throw new Error(message);
  }
  return response.json();
}

export async function fetchPricingPlans() {
  const base = BACKEND_HTTP_BASE.replace(/\/$/, '');
  if (!base) {
    throw new Error('VITE_BACKEND_API_URL is not configured');
  }
  const response = await fetch(`${base}/api/v1/pricing/plans`, {
    method: 'GET',
    headers: headers(),
  });
  const res = await handleResponse(response);
  return res.data;
}

export function planFeaturesFromConfig(plan, lang = 'tr') {
  const isEn = String(lang).toLowerCase().startsWith('en');
  const quota = plan.monthly_report_quota;
  const tokens = plan.monthly_token_budget;
  const analysis = (plan.analysis_features || []).join(', ');
  const formats = (plan.formats || []).join(', ');
  const seats = plan.seat_limit;
  const apiLine = plan.api_sso_sla || '—';
  return [
    {
      title: isEn
        ? `${quota} reports / month`
        : `Aylık ${quota} rapor kotası`,
      included: true,
      highlight: true,
    },
    {
      title: isEn
        ? `${Math.round(tokens / 1000)}k tokens / month`
        : `Aylık ${Math.round(tokens / 1000)}k token`,
      included: true,
    },
    {
      title: isEn ? `Analysis: ${analysis}` : `Analiz: ${analysis}`,
      included: true,
      highlight: true,
    },
    {
      title: isEn ? `Formats: ${formats}` : `Formatlar: ${formats}`,
      included: true,
    },
    {
      title: isEn ? `Seats: ${seats}` : `Koltuk: ${seats}`,
      included: true,
    },
    {
      title: isEn ? `API / SSO / SLA: ${apiLine}` : `API / SSO / SLA: ${apiLine}`,
      included: apiLine !== '—',
    },
  ];
}

export function ctaForPlan(plan, lang = 'tr') {
  const isEn = String(lang).toLowerCase().startsWith('en');
  const action = plan.cta_action || 'signup';
  if (action === 'contact') {
    return {
      label: isEn ? plan.cta_en || 'Contact sales' : plan.cta_tr || 'İletişime geç',
      href: 'mailto:sales@inferaworld.com',
      style: 'secondary',
    };
  }
  if (action === 'checkout') {
    return {
      label: isEn ? plan.cta_en || 'Buy now' : plan.cta_tr || 'Satın al',
      href: '/dashboard',
      style: 'primary',
    };
  }
  return {
    label: isEn ? plan.cta_en || 'Get started' : plan.cta_tr || 'Başla',
    href: '/dashboard',
    style: 'primary',
  };
}
