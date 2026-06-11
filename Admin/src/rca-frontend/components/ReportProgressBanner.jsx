import React from 'react';

/**
 * @param {{ pct: number, label: string, stage?: string }} progress
 * @param {boolean} isSubmitting
 * @param {string} language
 * @param {() => void} onCancel
 */
export default function ReportProgressBanner({
  progress,
  isSubmitting,
  language,
  onCancel,
}) {
  if (!progress) return null;

  const isTr = String(language || '').toLowerCase().startsWith('tr');
  const pct = Math.max(0, Math.min(100, Math.round(Number(progress.pct) || 0)));
  const done = pct >= 100;

  return (
    <div className="info-banner report-progress-banner" style={{ marginBottom: '16px' }}>
      <div className="info-banner-icon">AI</div>
      <div className="info-banner-content report-progress-content">
        <div className="report-progress-header">
          <h2>{isTr ? 'İşlem durumu' : 'Processing status'}</h2>
          <span className="report-progress-pct" aria-live="polite">
            {pct}%
          </span>
        </div>
        <p className="report-progress-label">{progress.label}</p>
        <div
          className="report-progress-track"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={progress.label}
        >
          <div
            className={`report-progress-fill${done ? ' report-progress-fill--done' : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {isSubmitting && !done && (
          <div className="report-progress-actions">
            <button type="button" className="report-progress-cancel" onClick={onCancel}>
              {isTr ? 'Analizi İptal Et' : 'Cancel analysis'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
