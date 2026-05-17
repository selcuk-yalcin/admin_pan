/**
 * Saved drafts + completed reports.
 * Primary: MongoDB per tenant + user (reportsLibraryApi).
 * Fallback: browser localStorage when server unavailable.
 */
import {
  listLibraryItems,
  upsertLibraryItem,
  deleteLibraryItem,
  syncReportHtmlToLibrary,
} from './reportsLibraryApi';

const STORAGE_KEY = "infera_deepwhy_drafts_v1";
let serverAvailable = true;
let lastLibraryError = "";

export function isLibraryServerMode() {
  return serverAvailable;
}

export function getLastLibraryError() {
  return lastLibraryError;
}

/**
 * @typedef {'draft' | 'report'} SavedEntryKind
 * @typedef {{
 *   id: string;
 *   kind: SavedEntryKind;
 *   title: string;
 *   updatedAt: string;
 *   snapshot: object;
 *   incidentId?: string;
 *   reportReady?: boolean;
 *   has_report_html?: boolean;
 *   has_decision_tree_html?: boolean;
 * }} SavedDraftEntry
 */

function mapServerItem(item) {
  if (!item) return null;
  return {
    id: item.id,
    kind: item.kind === 'report' ? 'report' : 'draft',
    title: item.title || '',
    updatedAt: item.updated_at || item.updatedAt || new Date().toISOString(),
    snapshot: item.snapshot || {},
    incidentId: item.incident_id || item.incidentId || '',
    reportReady: Boolean(item.report_ready ?? item.reportReady),
    has_report_html: Boolean(item.has_report_html),
    has_decision_tree_html: Boolean(item.has_decision_tree_html),
  };
}

/** @returns {SavedDraftEntry[]} */
export function loadDraftReportsListLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistListLocal(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function buildTitle(snapshot, titleHint = "", incidentId = "") {
  const hint = `${snapshot?.location || ""} ${snapshot?.reportedBy || ""}`.trim();
  if (titleHint) return titleHint.slice(0, 96);
  if (hint) return hint.slice(0, 96);
  if (incidentId) return incidentId.slice(0, 96);
  return "Kayıt";
}

/** @returns {Promise<SavedDraftEntry[]>} */
export async function loadDraftReportsList() {
  try {
    const items = await listLibraryItems();
    lastLibraryError = "";
    serverAvailable = true;
    return items.map(mapServerItem).filter(Boolean);
  } catch (err) {
    lastLibraryError = err?.message || String(err);
    serverAvailable = false;
    const local = loadDraftReportsListLocal();
    if (local.length) return local;
    throw err;
  }
}

export function notifyDraftsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('deepwhy-drafts-changed'));
  }
}

/** @param {object} snapshot @param {string} titleHint @param {string|null} persistId */
export async function upsertDraftReport(snapshot, titleHint = "", persistId = null) {
  if (serverAvailable) {
    try {
      const item = await upsertLibraryItem({
        kind: 'draft',
        snapshot,
        title_hint: titleHint,
        item_id: persistId || '',
        report_ready: false,
      });
      notifyDraftsChanged();
      return mapServerItem(item);
    } catch {
      serverAvailable = false;
    }
  }
  const list = loadDraftReportsListLocal();
  const id =
    persistId ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `d-${Date.now()}`);
  const entry = {
    id,
    kind: "draft",
    title: buildTitle(snapshot, titleHint),
    updatedAt: new Date().toISOString(),
    snapshot: { ...snapshot },
  };
  persistListLocal([entry, ...list.filter((x) => x?.id !== id)].slice(0, 50));
  notifyDraftsChanged();
  return entry;
}

/**
 * Save completed report metadata (without HTML) — use finalizeSavedReport for HTML.
 */
export async function upsertSavedReport({ incidentId, snapshot = {}, titleHint = "", reportReady = true }) {
  if (!incidentId) throw new Error("incidentId required");
  if (serverAvailable) {
    try {
      const item = await upsertLibraryItem({
        kind: 'report',
        incident_id: incidentId,
        snapshot,
        title_hint: titleHint,
        report_ready: reportReady,
      });
      notifyDraftsChanged();
      return mapServerItem(item);
    } catch {
      serverAvailable = false;
    }
  }
  const list = loadDraftReportsListLocal();
  const id = `report-${incidentId}`;
  const existing = list.find((x) => x.id === id || x.incidentId === incidentId);
  const entry = {
    id,
    kind: "report",
    incidentId,
    title: buildTitle(snapshot, titleHint, incidentId),
    updatedAt: new Date().toISOString(),
    snapshot: { ...(existing?.snapshot || {}), ...snapshot },
    reportReady: reportReady !== false,
  };
  persistListLocal([entry, ...list.filter((x) => x.id !== id && x.incidentId !== incidentId)].slice(0, 50));
  notifyDraftsChanged();
  return entry;
}

/**
 * Generate HTML artifacts on server and persist report + decision tree for the user.
 */
export async function finalizeSavedReport({
  incidentId,
  snapshot = {},
  titleHint = '',
  analysisModelPreset = '',
}) {
  if (!incidentId) throw new Error('incidentId required');
  if (serverAvailable) {
    try {
      const { generateHTMLReport } = await import('../../services/hsg245Api');
      const item = await syncReportHtmlToLibrary({
        incidentId,
        snapshot,
        titleHint,
        analysisModelPreset,
        generateHTMLReportFn: generateHTMLReport,
      });
      notifyDraftsChanged();
      return mapServerItem(item);
    } catch (err) {
      await upsertSavedReport({ incidentId, snapshot, titleHint, reportReady: false });
      throw err;
    }
  }
  return upsertSavedReport({ incidentId, snapshot, titleHint, reportReady: true });
}

export async function deleteDraftReport(id) {
  if (serverAvailable) {
    try {
      await deleteLibraryItem(id);
      notifyDraftsChanged();
      return;
    } catch {
      serverAvailable = false;
    }
  }
  const list = loadDraftReportsListLocal().filter((x) => x?.id !== id);
  persistListLocal(list);
  notifyDraftsChanged();
}
