import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PlayCircle, Maximize2, Minimize2, Play } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { getReportGuideVideoConfig } from '../utils/reportGuideVideo';
import './ReportGuideVideoPanel.css';

/**
 * Tam ekran bilgilendirme videosu — raporun nasıl hazırlandığını gösterir (yönetici videosu).
 * @param {object} props
 * @param {string} props.language
 */
export default function ReportGuideVideoPanel({ language }) {
  const t = (key) => getTranslation(language, key);
  const config = useMemo(() => getReportGuideVideoConfig(), []);
  const [loadError, setLoadError] = useState(false);
  const [theater, setTheater] = useState(false);
  const [showPlayOverlay, setShowPlayOverlay] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [durationLabel, setDurationLabel] = useState('');
  const videoRef = useRef(null);

  const toggleTheater = () => setTheater((v) => !v);
  const isTurkish = String(language || '').toLowerCase().startsWith('tr');

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const tryPlay = useCallback(async ({ unmute = false } = {}) => {
    const videoEl = videoRef.current;
    if (!videoEl) return false;
    try {
      if (!unmute) videoEl.muted = true;
      else videoEl.muted = false;
      videoEl.playsInline = true;
      const result = videoEl.play();
      if (result && typeof result.then === 'function') {
        await result;
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (config.type !== 'file') return undefined;
    const videoEl = videoRef.current;
    if (!videoEl) return undefined;

    setLoadError(false);
    setShowPlayOverlay(true);
    setIsBuffering(true);
    videoEl.load();

    let cancelled = false;
    (async () => {
      const ok = await tryPlay({ unmute: false });
      if (!cancelled && ok && videoEl.currentTime > 0.05) {
        setShowPlayOverlay(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [config.type, config.src, tryPlay]);

  const handleOverlayPlay = async () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (videoEl.currentTime < 0.05) {
      videoEl.currentTime = 0;
    }
    const ok = await tryPlay({ unmute: true });
    if (ok) setShowPlayOverlay(false);
  };

  const handleLoadedMetadata = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    setDurationLabel(formatTime(videoEl.duration));
    setIsBuffering(false);
  };

  const handleTimeUpdate = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (videoEl.currentTime > 0.05 && !videoEl.paused) {
      setShowPlayOverlay(false);
      setIsBuffering(false);
    }
  };

  return (
    <div className={`report-guide-panel${theater ? ' report-guide-panel--theater' : ''}`}>
      <header className="report-guide-header">
        <div className="report-guide-header-icon" aria-hidden>
          <PlayCircle size={26} />
        </div>
        <div className="report-guide-header-copy">
          <h2 className="report-guide-title">{t('tab_report_guide')}</h2>
          <p className="report-guide-lead">{t('guide_intro')}</p>
        </div>
        <button
          type="button"
          className="report-guide-theater-btn"
          onClick={toggleTheater}
          title={theater ? t('guide_exit_theater') : t('guide_enter_theater')}
        >
          {theater ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          <span>{theater ? t('guide_exit_theater') : t('guide_enter_theater')}</span>
        </button>
      </header>

      <div className="report-guide-stage">
        {loadError ? (
          <div className="report-guide-missing">
            <p>{t('guide_video_missing')}</p>
            <p className="report-guide-missing-path">
              <code>{config.src}</code>
            </p>
            <p className="report-guide-missing-hint">{t('guide_video_missing_hint')}</p>
          </div>
        ) : config.type === 'youtube' || config.type === 'vimeo' ? (
          <iframe
            className="report-guide-embed"
            src={config.embedSrc}
            title={t('guide_video_title')}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="report-guide-player-wrap">
            <video
              ref={videoRef}
              className="report-guide-video"
              poster={config.poster}
              controls
              playsInline
              preload="auto"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onPlaying={() => {
                setShowPlayOverlay(false);
                setIsBuffering(false);
              }}
              onWaiting={() => setIsBuffering(true)}
              onCanPlay={() => setIsBuffering(false)}
              onPause={() => {
                const el = videoRef.current;
                if (el && el.currentTime < 0.05) setShowPlayOverlay(true);
              }}
              onError={() => setLoadError(true)}
            >
              <source src={config.src} type="video/mp4" />
            </video>
            {showPlayOverlay ? (
              <button
                type="button"
                className="report-guide-play-overlay"
                onClick={handleOverlayPlay}
                aria-label={isTurkish ? 'Videoyu başlat' : 'Start video'}
              >
                <span className="report-guide-play-overlay-icon" aria-hidden>
                  <Play size={36} fill="currentColor" />
                </span>
                <span className="report-guide-play-overlay-label">
                  {isTurkish ? 'Videoyu başlat' : 'Start video'}
                </span>
                {durationLabel ? (
                  <span className="report-guide-play-overlay-meta">{durationLabel}</span>
                ) : null}
              </button>
            ) : null}
            {isBuffering && !showPlayOverlay ? (
              <div className="report-guide-buffering" aria-live="polite">
                {isTurkish ? 'Yükleniyor…' : 'Loading…'}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <p className="report-guide-footer">{t('guide_footer')}</p>
    </div>
  );
}
