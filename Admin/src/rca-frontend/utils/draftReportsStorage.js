const STORAGE_KEY = "infera_deepwhy_drafts_v1";

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
 * }} SavedDraftEntry
 */

/** @returns {SavedDraftEntry[]} */
export function loadDraftReportsList() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** @param {SavedDraftEntry[]} list */
function persistList(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function buildTitle(snapshot, titleHint = "", incidentId = "") {
  const hint = `${snapshot?.location || ""} ${snapshot?.reportedBy || ""}`.trim();
  if (titleHint) return titleHint.slice(0, 96);
  if (hint) return hint.slice(0, 96);
  if (incidentId) return incidentId.slice(0, 96);
  return "Kayıt";
}

/** @param {object} snapshot @param {string} titleHint @param {string|null} persistId */
export function upsertDraftReport(snapshot, titleHint = "", persistId = null) {
  const list = loadDraftReportsList();
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
  persistList([entry, ...list.filter((x) => x?.id !== id)].slice(0, 50));
  return entry;
}

/**
 * Save or update a completed report in Raporlar (keyed by incidentId when provided).
 * @param {{ incidentId: string, snapshot?: object, titleHint?: string, reportReady?: boolean }} params
 */
export function upsertSavedReport({ incidentId, snapshot = {}, titleHint = "", reportReady = true }) {
  if (!incidentId) {
    throw new Error("incidentId required");
  }
  const list = loadDraftReportsList();
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
  persistList([entry, ...list.filter((x) => x?.id !== id && x.incidentId !== incidentId)].slice(0, 50));
  return entry;
}

export function deleteDraftReport(id) {
  persistList(loadDraftReportsList().filter((x) => x.id !== id));
}

export function notifyDraftsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("deepwhy-drafts-changed"));
  }
}
