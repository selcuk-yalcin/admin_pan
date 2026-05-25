import React, { useMemo, useState } from 'react';
import { CirclePlay, Maximize2, Minimize2 } from 'lucide-react';
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

  const toggleTheater = () => setTheater((v) => !v);

  return (
    <div className={`report-guide-panel${theater ? ' report-guide-panel--theater' : ''}`}>
      <header className="report-guide-header">
        <div className="report-guide-header-icon" aria-hidden>
          <CirclePlay size={26} />
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
          <video
            className="report-guide-video"
            src={config.src}
            poster={config.poster}
            controls
            playsInline
            preload="metadata"
            onError={() => setLoadError(true)}
          >
            <track kind="captions" />
          </video>
        )}
      </div>

      <p className="report-guide-footer">{t('guide_footer')}</p>
    </div>
  );
}
