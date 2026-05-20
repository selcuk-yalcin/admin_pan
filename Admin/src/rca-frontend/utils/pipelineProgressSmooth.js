/**
 * Sunucu pipeline yüzdesi seyrek güncellenir (ör. 30 → 75).
 * Ekranda 1'er artan görünür ilerleme için hedefe doğru yumuşatır.
 */

/**
 * @param {object} opts
 * @param {(displayPct: number, stage: string) => void} opts.onTick
 * @param {number} [opts.tickMs=650]
 * @param {number} [opts.maxCreep=94]
 */
export function createSmoothPipelineProgress(opts = {}) {
  const tickMs = opts.tickMs ?? 500;
  const maxCreep = opts.maxCreep ?? 94;
  let displayPct = 0;
  let targetPct = 0;
  let stage = 'running';
  let timer = null;

  const emit = () => {
    if (typeof opts.onTick === 'function') {
      opts.onTick(displayPct, stage);
    }
  };

  const tick = () => {
    if (displayPct < targetPct) {
      displayPct += 1;
      emit();
      return;
    }
    if (targetPct < 100 && displayPct < maxCreep) {
      const ceiling = Math.min(maxCreep, targetPct + 14);
      if (displayPct < ceiling) {
        displayPct += 1;
        emit();
      }
    }
  };

  return {
    /** @param {object} job */
    update(job) {
      stage = job?.stage || job?.status || 'running';
      const raw = Number(job?.progress);
      if (Number.isFinite(raw)) {
        targetPct = Math.max(0, Math.min(100, Math.round(raw)));
      }
      if (!timer) {
        timer = setInterval(tick, tickMs);
        tick();
      }
    },
    finish(success = true) {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      displayPct = success ? 100 : displayPct;
      targetPct = success ? 100 : targetPct;
      stage = success ? 'completed' : stage;
      emit();
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
    getDisplayPct() {
      return displayPct;
    },
  };
}
