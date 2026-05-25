# Rapor hazırlama bilgilendirme videosu

Bu klasöre yönetici tarafından hazırlanan eğitim videosunu koyun:

- **Dosya adı (varsayılan):** `report-guide.mp4`
- **Tam yol (build sonrası):** `/media/rca-report-guide/report-guide.mp4`

Alternatif: `admin_pan/Admin/.env` içinde tam URL:

```env
VITE_RCA_GUIDE_VIDEO_URL=https://example.com/path/to/video.mp4
# veya YouTube / Vimeo paylaşım bağlantısı
```

İsteğe bağlı poster görseli:

```env
VITE_RCA_GUIDE_VIDEO_POSTER=/media/rca-report-guide/poster.jpg
```
