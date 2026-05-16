import React, { useEffect, useState, useCallback } from 'react';
import {
  FolderOpen,
  Trash2,
  Pencil,
  Clock,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { loadDraftReportsList, deleteDraftReport } from '../utils/draftReportsStorage';
import './SavedReportsPanel.css';

function formatDate(iso, lang) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function SavedReportsPanel({ language = 'tr', onEditDraft }) {
  const t = useCallback((k) => getTranslation(language, k), [language]);
  const [drafts, setDrafts] = useState([]);

  const reload = useCallback(() => {
    const list = loadDraftReportsList();
    list.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    setDrafts(list);
  }, []);

  useEffect(() => {
    reload();
    const handler = () => reload();
    window.addEventListener('deepwhy-drafts-changed', handler);
    return () => window.removeEventListener('deepwhy-drafts-changed', handler);
  }, [reload]);

  const handleRemove = (id, e) => {
    e.stopPropagation();
    if (!window.confirm(t('reports_delete_confirm'))) return;
    deleteDraftReport(id);
    reload();
    window.dispatchEvent(new Event('deepwhy-drafts-changed'));
  };

  const handleEdit = (entry) => {
    if (typeof onEditDraft !== 'function') return;
    onEditDraft(entry);
  };

  const count = drafts.length;

  return (
    <div className="saved-reports-panel">
      <header className="saved-reports-hero">
        <div className="saved-reports-hero-visual" aria-hidden>
          <FolderOpen size={26} strokeWidth={1.75} />
        </div>
        <div className="saved-reports-hero-copy">
          <div className="saved-reports-hero-row">
            <span className="saved-reports-badge">{t('reports_badge')}</span>
            {count > 0 ? (
              <span className="saved-reports-count-pill">
                {count} {language === 'tr' ? 'kayıt' : 'saved'}
              </span>
            ) : null}
          </div>
          <h2 className="saved-reports-title">{t('tab_saved_reports')}</h2>
          <p className="saved-reports-lead">{t('reports_intro')}</p>
        </div>
      </header>

      {count === 0 ? (
        <div className="saved-reports-empty">
          <div className="saved-reports-empty-icon" aria-hidden>
            <Inbox size={40} strokeWidth={1.25} />
          </div>
          <p className="saved-reports-empty-title">{t('reports_empty')}</p>
          <p className="saved-reports-empty-hint">{t('reports_empty_cta')}</p>
        </div>
      ) : (
        <ul className="saved-reports-list">
          {drafts.map((entry) => (
            <li key={entry.id}>
              <article className="saved-reports-card">
                <button
                  type="button"
                  className="saved-reports-card-main"
                  onClick={() => handleEdit(entry)}
                >
                  <span className="saved-reports-card-title" title={entry.title}>
                    {entry.title}
                  </span>
                  <span className="saved-reports-card-meta">
                    <Clock size={14} className="saved-reports-card-clock" aria-hidden />
                    {formatDate(entry.updatedAt, language)}
                  </span>
                </button>
                <div className="saved-reports-card-actions">
                  <button
                    type="button"
                    className="icon-btn-reports"
                    title={t('reports_edit')}
                    onClick={() => handleEdit(entry)}
                  >
                    <Pencil size={18} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="icon-btn-reports danger"
                    title={t('reports_delete')}
                    onClick={(e) => handleRemove(entry.id, e)}
                  >
                    <Trash2 size={18} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="saved-reports-card-chevron"
                    aria-label={t('reports_edit')}
                    onClick={() => handleEdit(entry)}
                  >
                    <ChevronRight size={20} aria-hidden />
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
