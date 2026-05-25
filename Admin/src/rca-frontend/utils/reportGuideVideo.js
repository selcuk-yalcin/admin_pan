/**
 * Rapor hazırlama bilgilendirme videosu — yönetici tarafından sağlanır (kullanıcı yüklemez).
 * VITE_RCA_GUIDE_VIDEO_URL: tam URL (MP4, WebM, YouTube veya Vimeo).
 * Boşsa: public/media/rca-report-guide/report-guide.mp4
 */

const DEFAULT_PATH = '/media/rca-report-guide/report-guide.mp4';

function youtubeEmbedId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace(/^\//, '').split('/')[0] || null;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const m = u.pathname.match(/\/embed\/([^/?]+)/);
      if (m) return m[1];
      const shorts = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (shorts) return shorts[1];
    }
  } catch {
    /* ignore */
  }
  return null;
}

function vimeoEmbedId(url) {
  try {
    const m = String(url).match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/**
 * @returns {{ type: 'file'|'youtube'|'vimeo', src: string, embedSrc?: string, poster?: string }}
 */
export function getReportGuideVideoConfig() {
  const raw = (import.meta.env.VITE_RCA_GUIDE_VIDEO_URL || '').trim();
  const src = raw || DEFAULT_PATH;
  const poster = (import.meta.env.VITE_RCA_GUIDE_VIDEO_POSTER || '').trim() || undefined;

  const yt = youtubeEmbedId(src);
  if (yt) {
    return {
      type: 'youtube',
      src,
      embedSrc: `https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1`,
      poster,
    };
  }

  const vimeo = vimeoEmbedId(src);
  if (vimeo) {
    return {
      type: 'vimeo',
      src,
      embedSrc: `https://player.vimeo.com/video/${vimeo}`,
      poster,
    };
  }

  return { type: 'file', src, poster };
}
