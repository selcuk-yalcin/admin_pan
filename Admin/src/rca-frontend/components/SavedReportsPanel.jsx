import React, { useEffect, useState, useCallback } from 'react';
import { FolderOpen, Trash2, Pencil } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { loadDraftReportsList, deleteDraftReport } from '../utils/draftReportsStorage';
import './SavedReportsPanel.css';

/** @typedef {{ id: string; title: string; updatedAt: string; snapshot: object }} DraftEntry */

function formatDate(iso, lang) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB');
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

  return (
    <div className="saved-reports-panel">
      <div className="saved-reports-intro">
        <FolderOpen size={28} aria-hidden />
        <div>
          <h2>{t('tab_saved_reports')}</h2>
          <p>{t('reports_intro')}</p>
        </div>
      </div>

      {drafts.length === 0 ? (
        <div className="saved-reports-empty">
          <p>{t('reports_empty')}</p>
        </div>
      ) : (
        <ul className="saved-reports-list">
          {drafts.map((entry) => (
            <li key={entry.id} className="saved-reports-card">
              <button
                type="button"
                className="saved-reports-card-main"
                onClick={() => handleEdit(entry)}
              >
                <span className="saved-reports-card-title">{entry.title}</span>
                <span className="saved-reports-card-meta">
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
