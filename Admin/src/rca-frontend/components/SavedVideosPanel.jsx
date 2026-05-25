import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Video,
  Upload,
  Link2,
  Trash2,
  Pencil,
  Clock,
  Inbox,
  Loader2,
  RefreshCw,
  Play,
  ExternalLink,
} from 'lucide-react';
import { getTranslation } from '../utils/translations';
import {
  listVideos,
  addVideoFile,
  addVideoUrl,
  deleteVideo,
  renameVideo,
  getVideoPlaybackUrl,
  formatVideoSize,
  onVideosChanged,
} from '../utils/videosStorage';
import './SavedVideosPanel.css';

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

/**
 * @param {object} props
 * @param {string} props.language
 * @param {boolean} [props.embedded] Raporlar sekmesinde yan sütun (klasör) modu
 */
export default function SavedVideosPanel({ language, embedded = false }) {
  const t = (key) => getTranslation(language, key);
  const isTr = String(language || '').toLowerCase().startsWith('tr');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [playUrl, setPlayUrl] = useState('');
  const [playType, setPlayType] = useState('blob');
  const [titleDraft, setTitleDraft] = useState('');
  const [incidentDraft, setIncidentDraft] = useState('');
  const [urlDraft, setUrlDraft] = useState('');
  const [showUrlForm, setShowUrlForm] = useState(false);
  const fileInputRef = useRef(null);
  const blobUrlRef = useRef(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await listVideos();
      setEntries(list);
    } catch (err) {
      setError(err?.message || String(err));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return onVideosChanged(refresh);
  }, [refresh]);

  const revokePlayUrl = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPlayUrl('');
    setPlayingId(null);
  };

  useEffect(() => () => revokePlayUrl(), []);

  const handleFilePick = async (e) => {
    const file = e.target?.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await addVideoFile(file, {
        title: titleDraft.trim() || file.name,
        incidentId: incidentDraft.trim(),
      });
      setTitleDraft('');
      await refresh();
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = async () => {
    if (!urlDraft.trim()) return;
    setUploading(true);
    setError('');
    try {
      await addVideoUrl(urlDraft, {
        title: titleDraft.trim(),
        incidentId: incidentDraft.trim(),
      });
      setUrlDraft('');
      setTitleDraft('');
      setShowUrlForm(false);
      await refresh();
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (entry) => {
    if (!window.confirm(t('videos_delete_confirm'))) return;
    if (playingId === entry.id) revokePlayUrl();
    try {
      await deleteVideo(entry.id);
      await refresh();
    } catch (err) {
      setError(err?.message || String(err));
    }
  };

  const handleRename = async (entry) => {
    const next = window.prompt(t('videos_rename_label'), entry.title || '');
    if (next == null) return;
    setRenamingId(entry.id);
    try {
      await renameVideo(entry.id, next);
      await refresh();
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setRenamingId(null);
    }
  };

  const handlePlay = async (entry) => {
    revokePlayUrl();
    setError('');
    try {
      const { type, url } = await getVideoPlaybackUrl(entry.id);
      if (type === 'blob') {
        blobUrlRef.current = url;
      }
      setPlayType(type);
      setPlayUrl(url);
      setPlayingId(entry.id);
    } catch (err) {
      setError(err?.message || String(err));
    }
  };

  const uploadHeadingId = embedded ? 'videos-upload-heading-embedded' : 'videos-upload-heading';
  const listHeadingId = embedded ? 'videos-list-heading-embedded' : 'videos-list-heading';

  return (
    <div className={`saved-videos-panel${embedded ? ' saved-videos-panel--embedded' : ''}`}>
      {!embedded ? (
        <header className="saved-videos-hero">
          <div className="saved-videos-hero-visual" aria-hidden>
            <Video size={28} />
          </div>
          <div className="saved-videos-hero-copy">
            <h2 className="saved-videos-title">{t('tab_videos')}</h2>
            <p className="saved-videos-lead">{t('videos_intro')}</p>
          </div>
        </header>
      ) : null}

      <section
        className="saved-videos-upload"
        aria-labelledby={uploadHeadingId}
      >
        {embedded ? (
          <h3 id={uploadHeadingId} className="saved-videos-folder-title saved-videos-folder-title--embedded">
            <Video size={18} aria-hidden />
            {t('reports_folder_videos')}
            <span className="saved-videos-folder-count">{entries.length}</span>
          </h3>
        ) : (
          <h3 id={uploadHeadingId} className="saved-videos-folder-title">
            <Upload size={18} aria-hidden />
            {t('videos_upload_section')}
          </h3>
        )}
        {!embedded ? (
          <div className="saved-videos-upload-fields">
            <input
              type="text"
              className="saved-videos-input"
              placeholder={t('videos_title_placeholder')}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
            />
            <input
              type="text"
              className="saved-videos-input"
              placeholder={t('videos_incident_placeholder')}
              value={incidentDraft}
              onChange={(e) => setIncidentDraft(e.target.value)}
            />
          </div>
        ) : (
          <input
            type="text"
            className="saved-videos-input saved-videos-input--compact"
            placeholder={t('videos_title_placeholder')}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
          />
        )}
        <div className="saved-videos-upload-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="saved-videos-file-input"
            onChange={handleFilePick}
          />
          <button
            type="button"
            className="saved-videos-btn saved-videos-btn--primary"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 size={18} className="spin" /> : <Upload size={18} />}
            {t('videos_add_file')}
          </button>
          <button
            type="button"
            className="saved-videos-btn"
            onClick={() => setShowUrlForm((v) => !v)}
          >
            <Link2 size={18} />
            {t('videos_add_link')}
          </button>
          <button type="button" className="saved-videos-btn saved-videos-btn--ghost" onClick={refresh}>
            <RefreshCw size={18} />
          </button>
        </div>
        {showUrlForm ? (
          <div className="saved-videos-url-row">
            <input
              type="url"
              className="saved-videos-input saved-videos-input--wide"
              placeholder="https://..."
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
            />
            <button
              type="button"
              className="saved-videos-btn saved-videos-btn--primary"
              disabled={uploading || !urlDraft.trim()}
              onClick={handleAddUrl}
            >
              {t('videos_save_link')}
            </button>
          </div>
        ) : null}
        {!embedded ? (
          <p className="saved-videos-hint">{t('videos_storage_hint')}</p>
        ) : (
          <p className="saved-videos-hint saved-videos-hint--embedded">{t('reports_videos_sidebar_hint')}</p>
        )}
      </section>

      {error ? <p className="saved-videos-error">{error}</p> : null}

      {playingId && playUrl ? (
        <section className="saved-videos-player-wrap">
          <div className="saved-videos-player-head">
            <span>{t('videos_now_playing')}</span>
            <button type="button" className="saved-videos-btn saved-videos-btn--ghost" onClick={revokePlayUrl}>
              {isTr ? 'Kapat' : 'Close'}
            </button>
          </div>
          {playType === 'blob' ? (
            <video className="saved-videos-player" src={playUrl} controls autoPlay playsInline />
          ) : (
            <div className="saved-videos-external">
              <a href={playUrl} target="_blank" rel="noopener noreferrer" className="saved-videos-external-link">
                <ExternalLink size={18} />
                {playUrl}
              </a>
              <p className="saved-videos-hint">{t('videos_external_hint')}</p>
            </div>
          )}
        </section>
      ) : null}

      <section
        className={`saved-videos-folder${embedded ? ' saved-videos-folder--embedded-list' : ''}`}
        aria-labelledby={listHeadingId}
      >
        {!embedded ? (
          <h3 id={listHeadingId} className="saved-videos-folder-title">
            <Video size={18} aria-hidden />
            {t('videos_folder_created')}
            <span className="saved-videos-folder-count">{entries.length}</span>
          </h3>
        ) : null}

        {loading ? (
          <div className="saved-videos-loading">
            <Loader2 size={22} className="spin" />
            <span>{t('videos_loading')}</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="saved-videos-empty">
            <Inbox size={40} aria-hidden />
            <p>{t('videos_empty')}</p>
            <p className="saved-videos-hint">{t('videos_empty_cta')}</p>
          </div>
        ) : (
          <ul className="saved-videos-list">
            {entries.map((entry) => (
              <li key={entry.id} className="saved-videos-card">
                <div className="saved-videos-card-body">
                  <span className="saved-videos-card-title">{entry.title}</span>
                  <span className="saved-videos-card-meta">
                    <Clock size={14} aria-hidden />
                    {formatDate(entry.createdAt, language)}
                    {entry.incidentId ? (
                      <span className="saved-videos-incident-id">{entry.incidentId}</span>
                    ) : null}
                    {entry.kind === 'file' ? (
                      <span className="saved-videos-size">{formatVideoSize(entry.size)}</span>
                    ) : (
                      <span className="saved-videos-badge-url">{t('videos_kind_link')}</span>
                    )}
                  </span>
                  {entry.fileName ? (
                    <span className="saved-videos-file-name">{entry.fileName}</span>
                  ) : null}
                </div>
                <div className="saved-videos-card-actions">
                  <button
                    type="button"
                    className="saved-videos-icon-btn"
                    title={t('videos_play')}
                    onClick={() => handlePlay(entry)}
                  >
                    <Play size={18} />
                  </button>
                  <button
                    type="button"
                    className="saved-videos-icon-btn"
                    title={t('videos_rename_hint')}
                    disabled={renamingId === entry.id}
                    onClick={() => handleRename(entry)}
                  >
                    {renamingId === entry.id ? (
                      <Loader2 size={18} className="spin" />
                    ) : (
                      <Pencil size={18} />
                    )}
                  </button>
                  <button
                    type="button"
                    className="saved-videos-icon-btn saved-videos-icon-btn--danger"
                    title={t('videos_delete')}
                    onClick={() => handleDelete(entry)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
