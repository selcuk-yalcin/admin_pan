import React, { useEffect, useState, useCallback } from 'react';
import {
  FolderOpen,
  Trash2,
  Pencil,
  Clock,
  ChevronRight,
  Inbox,
  FileText,
  GitBranch,
  Loader2,
} from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { loadDraftReportsList, deleteDraftReport, notifyDraftsChanged } from '../utils/draftReportsStorage';
import { openLibraryArtifact } from '../utils/reportsLibraryApi';
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

function isReportEntry(entry) {
  return entry?.kind === 'report' || Boolean(entry?.incidentId);
}

function ReportList({ entries, language, t, onOpen, onRemove, onViewArtifact }) {
  if (!entries.length) {
    return (
      <p className="saved-reports-folder-empty">
        {t('reports_folder_empty')}
      </p>
    );
  }
  return (
    <ul className="saved-reports-list">
      {entries.map((entry) => {
        const report = isReportEntry(entry);
        return (
          <li key={entry.id}>
            <article className={`saved-reports-card ${report ? 'saved-reports-card--report' : ''}`}>
              <button
                type="button"
                className="saved-reports-card-main"
                onClick={() => onOpen(entry)}
              >
                <span className="saved-reports-card-title-row">
                  <span
                    className={`saved-reports-kind ${report ? 'saved-reports-kind--report' : 'saved-reports-kind--draft'}`}
                  >
                    {report ? t('reports_kind_report') : t('reports_kind_draft')}
                  </span>
                  <span className="saved-reports-card-title" title={entry.title}>
                    {entry.title}
                  </span>
                </span>
                <span className="saved-reports-card-meta">
                  <Clock size={14} className="saved-reports-card-clock" aria-hidden />
                  {formatDate(entry.updatedAt, language)}
                  {report && entry.incidentId ? (
                    <span className="saved-reports-incident-id">{entry.incidentId}</span>
                  ) : null}
                </span>
              </button>
              <div className="saved-reports-card-actions">
                {report && entry.has_report_html ? (
                  <button
                    type="button"
                    className="icon-btn-reports"
                    title={t('reports_view_html')}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewArtifact(entry, 'report');
                    }}
                  >
                    <FileText size={18} aria-hidden />
                  </button>
                ) : null}
                {report && entry.has_decision_tree_html ? (
                  <button
                    type="button"
                    className="icon-btn-reports"
                    title={t('reports_view_tree')}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewArtifact(entry, 'decision_tree');
                    }}
                  >
                    <GitBranch size={18} aria-hidden />
                  </button>
                ) : null}
                {!report ? (
                  <button
                    type="button"
                    className="icon-btn-reports"
                    title={t('reports_open_draft')}
                    onClick={() => onOpen(entry)}
                  >
                    <Pencil size={18} aria-hidden />
                  </button>
                ) : null}
                <button
                  type="button"
                  className="icon-btn-reports danger"
                  title={t('reports_delete')}
                  onClick={(e) => onRemove(entry.id, e)}
                >
                  <Trash2 size={18} aria-hidden />
                </button>
                <button
                  type="button"
                  className="saved-reports-card-chevron"
                  aria-label={report ? t('reports_open_report') : t('reports_open_draft')}
                  onClick={() => onOpen(entry)}
                >
                  <ChevronRight size={20} aria-hidden />
                </button>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

export default function SavedReportsPanel({
  language = 'tr',
  onEditDraft,
  onOpenReport,
}) {
  const t = useCallback((k) => getTranslation(language, k), [language]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await loadDraftReportsList();
      list.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      setEntries(list);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    const handler = () => reload();
    window.addEventListener('deepwhy-drafts-changed', handler);
    return () => window.removeEventListener('deepwhy-drafts-changed', handler);
  }, [reload]);

  const handleRemove = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(t('reports_delete_confirm'))) return;
    try {
      await deleteDraftReport(id);
      await reload();
    } catch (err) {
      setError(err?.message || String(err));
    }
    notifyDraftsChanged();
  };

  const handleOpen = (entry) => {
    if (isReportEntry(entry)) {
      if (typeof onOpenReport === 'function') onOpenReport(entry);
      return;
    }
    if (typeof onEditDraft === 'function') onEditDraft(entry);
  };

  const handleViewArtifact = async (entry, artifactType) => {
    try {
      await openLibraryArtifact(entry.id, artifactType);
    } catch (err) {
      setError(err?.message || String(err));
    }
  };

  const reports = entries.filter(isReportEntry);
  const drafts = entries.filter((e) => !isReportEntry(e));
  const count = entries.length;

  return (
    <div className="saved-reports-panel">
      <header className="saved-reports-hero">
        <div className="saved-reports-hero-visual" aria-hidden>
          <FolderOpen size={26} strokeWidth={1.75} />
        </div>
        <div className="saved-reports-hero-copy">
          <div className="saved-reports-hero-row">
            <span className="saved-reports-badge">{t('reports_badge_server')}</span>
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

      {error ? <p className="saved-reports-error">{error}</p> : null}

      {loading ? (
        <div className="saved-reports-loading">
          <Loader2 size={28} className="spin" aria-hidden />
          <span>{t('reports_loading')}</span>
        </div>
      ) : count === 0 ? (
        <div className="saved-reports-empty">
          <div className="saved-reports-empty-icon" aria-hidden>
            <Inbox size={40} strokeWidth={1.25} />
          </div>
          <p className="saved-reports-empty-title">{t('reports_empty')}</p>
          <p className="saved-reports-empty-hint">{t('reports_empty_cta')}</p>
        </div>
      ) : (
        <>
          <section className="saved-reports-folder">
            <h3 className="saved-reports-folder-title">
              <FileText size={18} aria-hidden />
              {t('reports_folder_created')}
              <span className="saved-reports-folder-count">{reports.length}</span>
            </h3>
            <ReportList
              entries={reports}
              language={language}
              t={t}
              onOpen={handleOpen}
              onRemove={handleRemove}
              onViewArtifact={handleViewArtifact}
            />
          </section>

          <section className="saved-reports-folder">
            <h3 className="saved-reports-folder-title">
              <Pencil size={18} aria-hidden />
              {t('reports_folder_drafts')}
              <span className="saved-reports-folder-count">{drafts.length}</span>
            </h3>
            <ReportList
              entries={drafts}
              language={language}
              t={t}
              onOpen={handleOpen}
              onRemove={handleRemove}
              onViewArtifact={handleViewArtifact}
            />
          </section>
        </>
      )}
    </div>
  );
}
