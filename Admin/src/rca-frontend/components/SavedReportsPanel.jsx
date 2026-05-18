import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  FolderOpen,
  Trash2,
  Pencil,
  Clock,
  Inbox,
  FileText,
  GitBranch,
  Loader2,
  RefreshCw,
  Eye,
  Download,
} from 'lucide-react';
import { getTranslation } from '../utils/translations';
import {
  loadDraftReportsList,
  deleteDraftReport,
  renameSavedReportEntry,
  notifyDraftsChanged,
  isLibraryServerMode,
  getLastLibraryError,
} from '../utils/draftReportsStorage';
import {
  openReportForEntry,
  downloadArtifactForEntry,
  downloadDocxForEntry,
  syncReportHtmlToLibrary,
} from '../utils/reportsLibraryApi';
import { getCurrentUserId } from '../utils/userContext';
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

function EditableReportTitle({ entry, t, onRename, renamingId }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.title || '');
  const inputRef = useRef(null);
  const saving = renamingId === entry.id;

  useEffect(() => {
    setDraft(entry.title || '');
  }, [entry.title, entry.id]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = async () => {
    const next = draft.trim();
    if (!next) {
      setDraft(entry.title || '');
      setEditing(false);
      return;
    }
    if (next === (entry.title || '').trim()) {
      setEditing(false);
      return;
    }
    await onRename(entry, next);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(entry.title || '');
    setEditing(false);
  };

  if (editing) {
    return (
      <span className="saved-reports-title-edit-wrap">
        <input
          ref={inputRef}
          type="text"
          className="saved-reports-title-input"
          value={draft}
          maxLength={96}
          disabled={saving}
          aria-label={t('reports_rename_label')}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (!saving) commit();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
          }}
        />
        {saving ? <Loader2 size={14} className="spin saved-reports-title-saving" aria-hidden /> : null}
      </span>
    );
  }

  return (
    <button
      type="button"
      className="saved-reports-card-title saved-reports-card-title--editable"
      title={t('reports_rename_hint')}
      onClick={() => setEditing(true)}
    >
      {entry.title}
      <Pencil size={13} className="saved-reports-title-edit-icon" aria-hidden />
    </button>
  );
}

function ReportList({
  entries,
  language,
  t,
  onOpen,
  onRemove,
  onViewArtifact,
  onDownloadArtifact,
  onDownloadDocx,
  onSyncArtifacts,
  onRenameTitle,
  syncingId,
  downloadingId,
  renamingId,
  compact = false,
}) {
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
        const incidentId = entry.incidentId || '';

        return (
          <li key={entry.id} className="saved-reports-list-item">
            <article
              className={`saved-reports-card ${report ? 'saved-reports-card--report' : 'saved-reports-card--draft'} ${compact ? 'saved-reports-card--compact' : ''}`}
            >
              <div className="saved-reports-card-body">
                <div className="saved-reports-card-main-static">
                  <span className="saved-reports-card-title-row">
                    <span
                      className={`saved-reports-kind ${report ? 'saved-reports-kind--report' : 'saved-reports-kind--draft'}`}
                    >
                      {report ? t('reports_kind_report') : t('reports_kind_draft')}
                    </span>
                    <EditableReportTitle
                      entry={entry}
                      t={t}
                      renamingId={renamingId}
                      onRename={onRenameTitle}
                    />
                  </span>
                  <span className="saved-reports-card-meta">
                    <Clock size={14} className="saved-reports-card-clock" aria-hidden />
                    {formatDate(entry.updatedAt, language)}
                    {report && incidentId ? (
                      <span className="saved-reports-incident-id">{incidentId}</span>
                    ) : null}
                  </span>
                </div>

                {report && incidentId && !compact ? (
                  <div className="saved-reports-actions-panel" role="group" aria-label={t('reports_actions_title')}>
                    <div className="saved-reports-action-row">
                      <span className="saved-reports-action-label">
                        <FileText size={15} aria-hidden />
                        {t('reports_section_report')}
                      </span>
                      <div className="saved-reports-action-chips">
                        <button
                          type="button"
                          className="saved-reports-chip saved-reports-chip--view"
                          onClick={() => onViewArtifact(entry, 'report')}
                        >
                          <Eye size={14} aria-hidden />
                          {t('reports_view_short')}
                        </button>
                        <button
                          type="button"
                          className="saved-reports-chip saved-reports-chip--html"
                          disabled={downloadingId === `${entry.id}-html-report`}
                          onClick={() => onDownloadArtifact(entry, 'report')}
                        >
                          {downloadingId === `${entry.id}-html-report` ? (
                            <Loader2 size={14} className="spin" aria-hidden />
                          ) : (
                            <Download size={14} aria-hidden />
                          )}
                          HTML
                        </button>
                        <button
                          type="button"
                          className="saved-reports-chip saved-reports-chip--word"
                          disabled={downloadingId === `${entry.id}-docx`}
                          onClick={() => onDownloadDocx(entry)}
                        >
                          {downloadingId === `${entry.id}-docx` ? (
                            <Loader2 size={14} className="spin" aria-hidden />
                          ) : (
                            <Download size={14} aria-hidden />
                          )}
                          Word
                        </button>
                      </div>
                    </div>
                    <div className="saved-reports-action-row">
                      <span className="saved-reports-action-label">
                        <GitBranch size={15} aria-hidden />
                        {t('reports_section_tree')}
                      </span>
                      <div className="saved-reports-action-chips">
                        <button
                          type="button"
                          className="saved-reports-chip saved-reports-chip--view"
                          onClick={() => onViewArtifact(entry, 'decision_tree')}
                        >
                          <Eye size={14} aria-hidden />
                          {t('reports_view_short')}
                        </button>
                        <button
                          type="button"
                          className="saved-reports-chip saved-reports-chip--html"
                          disabled={downloadingId === `${entry.id}-html-tree`}
                          onClick={() => onDownloadArtifact(entry, 'decision_tree')}
                        >
                          {downloadingId === `${entry.id}-html-tree` ? (
                            <Loader2 size={14} className="spin" aria-hidden />
                          ) : (
                            <Download size={14} aria-hidden />
                          )}
                          HTML
                        </button>
                      </div>
                    </div>
                    {isLibraryServerMode() ? (
                      <button
                        type="button"
                        className="saved-reports-chip saved-reports-chip--sync"
                        disabled={syncingId === entry.id}
                        onClick={() => onSyncArtifacts(entry)}
                      >
                        {syncingId === entry.id ? (
                          <Loader2 size={14} className="spin" aria-hidden />
                        ) : (
                          <RefreshCw size={14} aria-hidden />
                        )}
                        {t('reports_sync_artifacts')}
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {!report ? (
                  <button
                    type="button"
                    className={`saved-reports-open-draft-btn ${compact ? 'saved-reports-open-draft-btn--block' : ''}`}
                    onClick={() => onOpen(entry)}
                  >
                    <Pencil size={14} aria-hidden />
                    {t('reports_open_draft')}
                  </button>
                ) : null}
              </div>

              <div className="saved-reports-card-actions">
                <button
                  type="button"
                  className="icon-btn-reports danger"
                  title={t('reports_delete')}
                  onClick={(e) => onRemove(entry.id, e)}
                >
                  <Trash2 size={18} aria-hidden />
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
}) {
  const t = useCallback((k) => getTranslation(language, k), [language]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serverMode, setServerMode] = useState(true);
  const [syncingId, setSyncingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await loadDraftReportsList();
      list.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      setEntries(list);
      const onServer = isLibraryServerMode();
      setServerMode(onServer);
      if (!onServer && list.length) {
        setError(`${getLastLibraryError() || ''} — ${t('reports_mongo_hint')}`.replace(/^ — /, ''));
      }
    } catch (err) {
      const msg = getLastLibraryError() || err?.message || String(err);
      setError(`${msg} — ${t('reports_mongo_hint')}`);
      setServerMode(false);
    } finally {
      setLoading(false);
    }
  }, [t]);

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

  const handleOpenDraft = (entry) => {
    if (typeof onEditDraft === 'function') onEditDraft(entry);
  };

  const handleViewArtifact = async (entry, artifactType) => {
    setError('');
    try {
      await openReportForEntry(entry, artifactType);
    } catch (err) {
      setError(err?.message || String(err));
    }
  };

  const handleDownloadArtifact = async (entry, artifactType) => {
    const key = `${entry.id}-html-${artifactType === 'decision_tree' ? 'tree' : 'report'}`;
    setDownloadingId(key);
    setError('');
    try {
      await downloadArtifactForEntry(entry, artifactType);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadDocx = async (entry) => {
    const key = `${entry.id}-docx`;
    setDownloadingId(key);
    setError('');
    try {
      await downloadDocxForEntry(entry);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRenameTitle = async (entry, newTitle) => {
    setRenamingId(entry.id);
    setError('');
    try {
      await renameSavedReportEntry(entry, newTitle);
      await reload();
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setRenamingId(null);
    }
  };

  const handleSyncArtifacts = async (entry) => {
    const incidentId = entry?.incidentId || '';
    if (!incidentId) return;
    setSyncingId(entry.id);
    setError('');
    try {
      const { generateHTMLReport } = await import('../../services/hsg245Api');
      await syncReportHtmlToLibrary({
        incidentId,
        snapshot: entry.snapshot || {},
        titleHint: entry.title || '',
        analysisModelPreset: entry.snapshot?.analysisModelPreset || '',
        generateHTMLReportFn: generateHTMLReport,
      });
      notifyDraftsChanged();
      await reload();
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setSyncingId(null);
    }
  };

  const reports = entries.filter(isReportEntry);
  const drafts = entries.filter((e) => !isReportEntry(e));
  const count = entries.length;
  const userIdShort = (() => {
    const uid = getCurrentUserId();
    if (!uid || uid === 'anonymous') return null;
    return uid.length > 12 ? `${uid.slice(0, 8)}…` : uid;
  })();

  return (
    <div className="saved-reports-panel">
      <header className="saved-reports-hero saved-reports-hero--compact">
        <div className="saved-reports-hero-visual" aria-hidden>
          <FolderOpen size={26} strokeWidth={1.75} />
        </div>
        <div className="saved-reports-hero-copy">
          <div className="saved-reports-hero-row">
            <span className="saved-reports-badge">
              {serverMode ? t('reports_badge_server') : t('reports_badge')}
            </span>
            {count > 0 ? (
              <span className="saved-reports-count-pill">
                {count} {language === 'tr' ? 'kayıt' : 'saved'}
              </span>
            ) : null}
            {userIdShort && serverMode ? (
              <span className="saved-reports-user-pill" title={getCurrentUserId()}>
                {t('reports_your_account')}: {userIdShort}
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
        <div className="saved-reports-layout">
          <section className="saved-reports-folder saved-reports-folder--reports" aria-labelledby="reports-created-heading">
            <h3 id="reports-created-heading" className="saved-reports-folder-title">
              <FileText size={18} aria-hidden />
              {t('reports_folder_created')}
              <span className="saved-reports-folder-count">{reports.length}</span>
            </h3>
            <ReportList
              entries={reports}
              language={language}
              t={t}
              onOpen={handleOpenDraft}
              onRemove={handleRemove}
              onViewArtifact={handleViewArtifact}
              onDownloadArtifact={handleDownloadArtifact}
              onDownloadDocx={handleDownloadDocx}
              onRenameTitle={handleRenameTitle}
              onSyncArtifacts={handleSyncArtifacts}
              syncingId={syncingId}
              downloadingId={downloadingId}
              renamingId={renamingId}
              compact={false}
            />
          </section>

          <aside className="saved-reports-folder saved-reports-folder--drafts" aria-labelledby="reports-drafts-heading">
            <h3 id="reports-drafts-heading" className="saved-reports-folder-title">
              <Pencil size={18} aria-hidden />
              {t('reports_folder_drafts')}
              <span className="saved-reports-folder-count">{drafts.length}</span>
            </h3>
            <p className="saved-reports-drafts-hint">{t('reports_drafts_sidebar_hint')}</p>
            <ReportList
              entries={drafts}
              language={language}
              t={t}
              onOpen={handleOpenDraft}
              onRemove={handleRemove}
              onViewArtifact={handleViewArtifact}
              onDownloadArtifact={handleDownloadArtifact}
              onDownloadDocx={handleDownloadDocx}
              onRenameTitle={handleRenameTitle}
              onSyncArtifacts={handleSyncArtifacts}
              syncingId={syncingId}
              downloadingId={downloadingId}
              renamingId={renamingId}
              compact
            />
          </aside>
        </div>
      )}
    </div>
  );
}
