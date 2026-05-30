import React, { useEffect, useState } from 'react';
import { LayoutTemplate, Eye, EyeOff, Check } from 'lucide-react';
import {
  fetchReportLayoutOptions,
  DEFAULT_REPORT_LAYOUT,
  buildLayoutPayload,
} from '../../services/reportLayoutApi';
import './ReportTemplatePicker.css';

/**
 * Visual report template picker shown before HTML/DOCX export.
 */
export default function ReportTemplatePicker({ language = 'tr', value, onChange, disabled = false }) {
  const isTr = String(language).toLowerCase().startsWith('tr');
  const [catalog, setCatalog] = useState(null);
  const [loadError, setLoadError] = useState('');

  const selection = value || {
    coverTemplate: DEFAULT_REPORT_LAYOUT.cover_template,
    watermarkMode: DEFAULT_REPORT_LAYOUT.watermark_mode,
    showTechnicalCodes: DEFAULT_REPORT_LAYOUT.show_technical_codes,
    enabledSections: [...DEFAULT_REPORT_LAYOUT.sections],
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchReportLayoutOptions(language);
        if (!cancelled) {
          setCatalog(data);
          setLoadError('');
        }
      } catch (err) {
        if (!cancelled) setLoadError(err?.message || 'load_failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);

  const templates = catalog?.cover_templates || [
    { id: 'standard', name: isTr ? 'Standart' : 'Standard', description: '', accent: '#2563eb' },
    { id: 'formal', name: isTr ? 'Resmi' : 'Formal', description: '', accent: '#1e293b' },
    { id: 'executive', name: isTr ? 'Yönetici Özeti' : 'Executive', description: '', accent: '#b45309' },
    { id: 'minimal', name: isTr ? 'Minimal' : 'Minimal', description: '', accent: '#64748b' },
  ];

  const watermarkOptions = catalog?.watermark_options || [
    { id: 'none', name: isTr ? 'Filigran yok' : 'No watermark' },
    { id: 'draft', name: 'DRAFT' },
    { id: 'final', name: 'FINAL' },
  ];

  const sections = catalog?.sections || DEFAULT_REPORT_LAYOUT.sections.map((id) => ({
    id,
    name: id,
    default_enabled: true,
  }));

  const patch = (partial) => {
    const next = { ...selection, ...partial };
    const payload = buildLayoutPayload(catalog, next);
    onChange?.({ ...next, layoutPayload: payload });
  };

  const toggleSection = (sectionId) => {
    const current = selection.enabledSections || [];
    const next = current.includes(sectionId)
      ? current.filter((id) => id !== sectionId)
      : [...current, sectionId];
    if (next.length === 0) return;
    patch({ enabledSections: next });
  };

  return (
    <div className="report-template-picker" aria-label={isTr ? 'Rapor şablonu' : 'Report template'}>
      <div className="rtp-header">
        <LayoutTemplate size={18} />
        <div>
          <strong>{isTr ? 'Rapor Şablonu & Görünüm' : 'Report template & appearance'}</strong>
          <p>{isTr ? 'Kapak stili, filigran ve bölüm görünürlüğünü seçin' : 'Choose cover style, watermark, and sections'}</p>
        </div>
      </div>

      {loadError ? (
        <p className="rtp-hint rtp-hint--warn">
          {isTr ? 'Şablon listesi yüklenemedi; varsayılan seçenekler gösteriliyor.' : 'Could not load templates; showing defaults.'}
        </p>
      ) : null}

      <div className="rtp-template-grid">
        {templates.map((tpl) => {
          const active = selection.coverTemplate === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              className={`rtp-template-card ${active ? 'active' : ''}`}
              disabled={disabled}
              onClick={() => patch({ coverTemplate: tpl.id })}
            >
              <div className="rtp-preview" style={{ '--rtp-accent': tpl.accent || '#2563eb' }}>
                <div className="rtp-preview-cover" />
                <div className="rtp-preview-line" />
                <div className="rtp-preview-line short" />
              </div>
              <div className="rtp-template-meta">
                <span className="rtp-template-name">{tpl.name}</span>
                {tpl.description ? <span className="rtp-template-desc">{tpl.description}</span> : null}
              </div>
              {active ? <Check size={16} className="rtp-check" /> : null}
            </button>
          );
        })}
      </div>

      <div className="rtp-options-row">
        <label className="rtp-field">
          <span>{isTr ? 'Filigran' : 'Watermark'}</span>
          <select
            value={selection.watermarkMode}
            disabled={disabled}
            onChange={(e) => patch({ watermarkMode: e.target.value })}
          >
            {watermarkOptions.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>

        <label className="rtp-toggle">
          <input
            type="checkbox"
            checked={Boolean(selection.showTechnicalCodes)}
            disabled={disabled}
            onChange={(e) => patch({ showTechnicalCodes: e.target.checked })}
          />
          {selection.showTechnicalCodes ? <Eye size={16} /> : <EyeOff size={16} />}
          <span>{isTr ? 'Teknik kodları göster' : 'Show technical codes'}</span>
        </label>
      </div>

      <details className="rtp-sections-details">
        <summary>{isTr ? 'Rapor bölümleri' : 'Report sections'} ({selection.enabledSections?.length || 0})</summary>
        <div className="rtp-sections-grid">
          {sections.map((sec) => {
            const on = (selection.enabledSections || []).includes(sec.id);
            return (
              <button
                key={sec.id}
                type="button"
                className={`rtp-section-chip ${on ? 'on' : ''}`}
                disabled={disabled}
                onClick={() => toggleSection(sec.id)}
              >
                {sec.name || sec.id}
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
}
