const STORAGE_KEY = "infera_deepwhy_drafts_v1";

/** @typedef {{ id: string; title: string; updatedAt: string; snapshot: object }} SavedDraftEntry */

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

/** @param {object} snapshot @param {string} titleHint */
export function upsertDraftReport(snapshot, titleHint = "", persistId = null) {
  const list = loadDraftReportsList();
  const id =
    persistId ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `d-${Date.now()}`);
  const hint = `${snapshot?.location || ""} ${snapshot?.reportedBy || ""}`.trim();
  const title = (titleHint || hint || "Taslak").slice(0, 96);
  const entry = {
    id,
    title,
    updatedAt: new Date().toISOString(),
    snapshot: { ...snapshot },
  };
  persistList([entry, ...list.filter((x) => x?.id !== id)].slice(0, 50));
  return entry;
}

export function deleteDraftReport(id) {
  persistList(loadDraftReportsList().filter((x) => x.id !== id));
}
