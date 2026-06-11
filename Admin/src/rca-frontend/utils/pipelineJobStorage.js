const STORAGE_KEY = 'rca_active_pipeline_job';

/** @returns {{ incidentId: string, jobId: string, savedAt: number } | null} */
export function loadPipelineJob() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.incidentId || !parsed?.jobId) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** @param {{ incidentId: string, jobId: string }} job */
export function savePipelineJob(job) {
  if (typeof window === 'undefined') return;
  if (!job?.incidentId || !job?.jobId) return;
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...job, savedAt: Date.now() }),
  );
}

export function clearPipelineJob() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}
