import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PlayCircle, Maximize2, Minimize2 } from 'lucide-react';
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
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const videoRef = useRef(null);

  const toggleTheater = () => setTheater((v) => !v);
  const isTurkish = String(language || '').toLowerCase().startsWith('tr');

  useEffect(() => {
    if (config.type !== 'file') return;
    const videoEl = videoRef.current;
    if (!videoEl) return;
    let cancelled = false;
    const tryAutoPlay = async () => {
      try {
        videoEl.muted = true;
        const result = videoEl.play();
        if (result && typeof result.then === 'function') {
          await result;
        }
        if (!cancelled) setAutoplayBlocked(false);
      } catch {
        if (!cancelled) setAutoplayBlocked(true);
      }
    };
    tryAutoPlay();
    return () => {
      cancelled = true;
    };
  }, [config.type, config.src]);

  const handleManualPlay = async () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    try {
      videoEl.muted = false;
      const result = videoEl.play();
      if (result && typeof result.then === 'function') {
        await result;
      }
      setAutoplayBlocked(false);
    } catch {
      // Keep blocked state; user may need browser-level autoplay interaction.
      setAutoplayBlocked(true);
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
          <>
            <video
              ref={videoRef}
              className="report-guide-video"
              src={config.src}
              poster={config.poster}
              controls
              autoPlay
              muted
              playsInline
              preload="metadata"
              onPlay={() => setAutoplayBlocked(false)}
              onError={() => setLoadError(true)}
            >
              <track kind="captions" />
            </video>
            {autoplayBlocked ? (
              <button
                type="button"
                className="report-guide-theater-btn"
                onClick={handleManualPlay}
                style={{ position: 'absolute', bottom: '14px', right: '14px' }}
              >
                {isTurkish ? 'Videoyu başlat' : 'Start video'}
              </button>
            ) : null}
          </>
        )}
      </div>

      <p className="report-guide-footer">{t('guide_footer')}</p>
    </div>
  );
}
