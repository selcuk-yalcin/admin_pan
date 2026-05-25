/**
 * Sunucu pipeline yüzdesi seyrek güncellenir; UI sürekli ve yavaş ilerler.
 * - İlk ~24%: yavaş tırmanış (kullanıcı “çok hızlı” demesin diye)
 * - 24% sonrası sunucu beklerken: plato boyunca yavaş sürükleme (boşluk hissi yok)
 * - Sunucu sıçradığında: hedefe doğru normal hızla yetişme
 */

const STAGE_PLATEAU = {
  queued: 10,
  investigate: 58,
  running: 58,
  actionplan: 86,
  completed: 100,
  failed: 100,
};

/**
 * @param {object} opts
 * @param {(displayPct: number, stage: string) => void} opts.onTick
 * @param {number} [opts.earlyCap=24] İlk fazda görünen üst sınır (sunucu 10 iken)
 * @param {number} [opts.earlyStepMs=1300] 0 → earlyCap arası ms / %
 * @param {number} [opts.plateauStepMs=2200] plato sürükleme ms / %
 * @param {number} [opts.tickMs=650] sunucu hedefine yetişme ms / %
 * @param {number} [opts.maxCreep=92]
 */
export function createSmoothPipelineProgress(opts = {}) {
  const earlyCap = opts.earlyCap ?? 24;
  const earlyStepMs = opts.earlyStepMs ?? 1300;
  const plateauStepMs = opts.plateauStepMs ?? 2200;
  const tickMs = opts.tickMs ?? 650;
  const maxCreep = opts.maxCreep ?? 92;

  let displayPct = 0;
  let targetPct = 0;
  let stage = 'investigate';
  let timer = null;
  let running = false;

  const emit = () => {
    if (typeof opts.onTick === 'function') {
      opts.onTick(displayPct, stage);
    }
  };

  const plateauCeiling = () => {
    const stageCap = STAGE_PLATEAU[stage] ?? 70;
    if (displayPct >= targetPct) {
      return Math.min(stageCap, maxCreep);
    }
    return Math.min(maxCreep, targetPct + 14);
  };

  const delayForNextStep = () => {
    if (displayPct < Math.min(targetPct, earlyCap)) return earlyStepMs;
    if (displayPct < targetPct) return tickMs;
    if (displayPct < plateauCeiling()) return plateauStepMs;
    return plateauStepMs * 1.4;
  };

  const tick = () => {
    let advanced = false;
    if (displayPct < targetPct) {
      displayPct += 1;
      advanced = true;
    } else {
      const ceiling = plateauCeiling();
      if (displayPct < ceiling) {
        displayPct += 1;
        advanced = true;
      }
    }
    if (advanced) emit();
  };

  const schedule = () => {
    if (!running || displayPct >= 100 || stage === 'completed') return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      tick();
      schedule();
    }, delayForNextStep());
  };

  const start = () => {
    if (running) return;
    running = true;
    schedule();
  };

  const halt = () => {
    running = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return {
    /** @param {object} job */
    update(job) {
      const nextStage = job?.stage || job?.status || stage;
      stage = nextStage;
      const raw = Number(job?.progress);
      if (Number.isFinite(raw)) {
        const clamped = Math.max(0, Math.min(100, Math.round(raw)));
        targetPct = Math.max(targetPct, clamped);
      }
      start();
      emit();
    },
    finish(success = true) {
      halt();
      if (success) {
        displayPct = 100;
        targetPct = 100;
        stage = 'completed';
      }
      emit();
    },
    stop() {
      halt();
    },
    getDisplayPct() {
      return displayPct;
    },
  };
}
