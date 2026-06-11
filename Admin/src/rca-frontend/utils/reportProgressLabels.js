/**
 * Rapor / pipeline ilerleme metinleri (form doğrudan rapor + HITL chat).
 */

export function getStageLabel(language, stage, progress) {
  const isTr = String(language || '').toLowerCase().startsWith('tr');
  const pctNum = Number(progress);
  const pct = Number.isFinite(pctNum) ? ` (${Math.max(0, Math.min(100, pctNum))}%)` : '';
  const tr = {
    queued: `Analiz kuyruğa alındı${pct}`,
    investigate: `Kök neden analizi çalışıyor${pct}`,
    actionplan: `Aksiyon planı oluşturuluyor${pct}`,
    completed: `Analiz tamamlandı${pct}`,
    failed: `Analiz hata ile sonlandı${pct}`,
  };
  const en = {
    queued: `Analysis queued${pct}`,
    investigate: `Root cause analysis in progress${pct}`,
    actionplan: `Building action plan${pct}`,
    completed: `Analysis completed${pct}`,
    failed: `Analysis ended with an error${pct}`,
  };
  const map = isTr ? tr : en;
  return map[stage] || (isTr ? `Çalışıyor${pct}` : `Running${pct}`);
}

/** Doğrudan rapor akışı: bootstrap öncesi / sonrası fazlar */
export function getReportPhaseLabel(language, phase, progress) {
  const isTr = String(language || '').toLowerCase().startsWith('tr');
  const pct = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)));
  const suffix = ` (${pct}%)`;
  const tr = {
    prewarm: `Sunucu hazırlanıyor${suffix}`,
    bootstrap: `Olay kaydı oluşturuluyor${suffix}`,
    pipeline_start: `Kök neden analizi başlatılıyor${suffix}`,
    report_html: `HTML rapor oluşturuluyor ve indiriliyor${suffix}`,
    report_done: `Tamamlandı — rapor indirildi${suffix}`,
    cancelled: `Analiz iptal edildi`,
  };
  const en = {
    prewarm: `Warming up server${suffix}`,
    bootstrap: `Creating incident record${suffix}`,
    pipeline_start: `Starting root cause analysis${suffix}`,
    report_html: `Generating and downloading HTML report${suffix}`,
    report_done: `Complete — report downloaded${suffix}`,
    cancelled: `Analysis cancelled`,
  };
  const map = isTr ? tr : en;
  return map[phase] || (isTr ? `İşlem sürüyor${suffix}` : `Processing${suffix}`);
}

/** Pipeline smooth % (0–100) → genel rapor % (12–88 aralığı) */
export function mapPipelineToOverallPct(smoothPct) {
  const inner = Math.max(0, Math.min(100, Number(smoothPct) || 0));
  return Math.round(12 + (inner / 100) * 76);
}
