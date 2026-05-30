import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Container, Row, Col } from 'reactstrap';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Coins,
  Crown,
  GitBranch,
  MessageSquare,
  Mail,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  fetchUsageSummary,
  fetchUsageTimeseries,
  fetchUsageByModule,
  fetchUsageRecent,
  fetchReportDeliveries,
  formatToken,
  formatTokenFull,
  formatUsageDate,
} from '../../services/usageApi';
import './dashboard.css';

const MODULE_COLORS = {
  deepwhy: '#6366f1',
  report: '#10b981',
  hitl: '#f59e0b',
  pipeline: '#3b82f6',
  assessment: '#8b5cf6',
  risk: '#ec4899',
  bot: '#06b6d4',
  other: '#94a3b8',
};

const PLAN_LABELS = {
  starter: 'Starter',
  pro: 'Professional',
  enterprise: 'Enterprise',
};

function chartBars(series) {
  if (!series?.length) return [];
  const max = Math.max(...series.map((p) => p.tokens), 1);
  const today = new Date().toISOString().slice(0, 10);
  return series.map((p) => ({
    ...p,
    h: p.tokens > 0 ? Math.max(12, Math.round((p.tokens / max) * 100)) : 6,
    isToday: p.date === today,
  }));
}

function TokenRing({ percent, warnLevel }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, percent));
  const offset = c - (pct / 100) * c;
  const fillClass =
    warnLevel === 'blocked' || warnLevel === 'critical'
      ? 'usage-token-ring-fill--danger'
      : warnLevel === 'warning'
        ? 'usage-token-ring-fill--warning'
        : '';

  return (
    <div className="usage-token-ring">
      <svg viewBox="0 0 120 120" aria-hidden>
        <circle className="usage-token-ring-bg" cx="60" cy="60" r={r} />
        <circle
          className={`usage-token-ring-fill ${fillClass}`}
          cx="60"
          cy="60"
          r={r}
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="usage-token-ring-center">
        <span className="usage-token-ring-pct">{Math.round(pct)}%</span>
        <span className="usage-token-ring-label">kullanıldı</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, iconClass, label, value, hint, children }) {
  return (
    <div className="usage-stat-card">
      <div className="usage-stat-card-top">
        <span className="usage-stat-label">{label}</span>
        <div className={`usage-stat-icon usage-stat-icon--${iconClass}`}>
          <Icon size={22} strokeWidth={2} />
        </div>
      </div>
      {children || <p className="usage-stat-value">{value}</p>}
      {hint ? <p className="usage-stat-hint">{hint}</p> : null}
    </div>
  );
}

function modulePillClass(mod) {
  const m = (mod || '').toLowerCase();
  if (m.includes('deepwhy') || m === 'deepwhy') return 'usage-module-pill--deepwhy';
  if (m.includes('report')) return 'usage-module-pill--report';
  if (m.includes('hitl')) return 'usage-module-pill--hitl';
  if (m.includes('pipeline')) return 'usage-module-pill--pipeline';
  return 'usage-module-pill--default';
}

const AUTO_REFRESH_MS = 90_000;

function deliveryStatusLabel(status) {
  const s = (status || '').toLowerCase();
  if (s === 'sent') return { text: 'Gönderildi', cls: 'usage-delivery--sent' };
  if (s === 'pending') return { text: 'Bekliyor', cls: 'usage-delivery--pending' };
  if (s.startsWith('failed')) return { text: 'Başarısız', cls: 'usage-delivery--failed' };
  return { text: status || '—', cls: '' };
}

function useAnimatedNumber(value, duration = 600) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = Number(value) || 0;
    const start = display;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      setDisplay(Math.round(start + (target - start) * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return display;
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [modules, setModules] = useState([]);
  const [recent, setRecent] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [smtpInfo, setSmtpInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartDays, setChartDays] = useState(7);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadData = useCallback(async (days, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [s, ts, mod, rec, del] = await Promise.all([
        fetchUsageSummary(),
        fetchUsageTimeseries(days),
        fetchUsageByModule(30),
        fetchUsageRecent(20),
        fetchReportDeliveries(8).catch(() => ({ deliveries: [], smtp: {} })),
      ]);
      setSummary(s);
      setSeries(ts?.series || []);
      setModules(mod?.modules || []);
      setRecent(rec?.operations || []);
      setDeliveries(del?.deliveries || []);
      setSmtpInfo(del?.smtp || null);
      setLastUpdated(new Date());
      setError('');
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(chartDays);
  }, [chartDays, loadData]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(() => loadData(chartDays, true), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh, chartDays, loadData]);

  const bars = useMemo(() => chartBars(series), [series]);
  const usedPct = summary?.used_percent ?? 0;
  const warn = summary?.warn_level || 'ok';
  const chartTotal = useMemo(
    () => bars.reduce((sum, p) => sum + (p.tokens || 0), 0),
    [bars],
  );
  const recentTokenSum = useMemo(
    () => recent.reduce((sum, r) => sum + (Number(r.token_cost) || 0), 0),
    [recent],
  );
  const displayUsed = summary?.used ?? recentTokenSum;
  const hasChartData = chartTotal > 0 || recent.length > 0;
  const planTier = (summary?.plan_tier || 'starter').toLowerCase();
  const animUsed = useAnimatedNumber(displayUsed);
  const animQuestions = useAnimatedNumber(summary?.ai_question_count ?? 0);
  const animPipeline = useAnimatedNumber(summary?.pipeline_runs_30d ?? 0);
  const smtpReady = Boolean(smtpInfo?.configured);

  if (loading && !summary) {
    return (
      <div className="page-content dashboard-usage-page">
        <Container fluid className="dashboard-container">
          <div className="usage-skeleton usage-skeleton--hero" />
          <div className="usage-stat-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="usage-skeleton usage-skeleton--card" />
            ))}
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content dashboard-usage-page">
      <Container fluid className="dashboard-container">
        {/* Hero */}
        <section className="usage-hero">
          <div className="usage-hero-inner">
            <div className="usage-hero-copy">
              <div className="usage-live-badge">
                <span className={`usage-live-dot ${refreshing ? 'pulse' : ''}`} />
                {autoRefresh ? 'Canlı' : 'Manuel'}
              </div>
              <h1>Kullanım İstatistikleri</h1>
              <p>
                AI token bakiyenizi, modül tüketiminizi ve son işlemlerinizi tek ekranda
                takip edin.
              </p>
              {lastUpdated ? (
                <p className="usage-last-updated">
                  Son güncelleme: {formatUsageDate(lastUpdated.toISOString())}
                </p>
              ) : null}
            </div>

            <div className="usage-token-ring-wrap">
              <TokenRing percent={usedPct} warnLevel={warn} />
              <div className="usage-token-meta">
                <div className="usage-token-meta-row">
                  <strong>{formatToken(summary?.available ?? 0)}</strong>
                  <span>kalan token</span>
                </div>
                <div className="usage-token-meta-row">
                  <strong>{formatToken(summary?.period_limit ?? 0)}</strong>
                  <span>aylık limit</span>
                </div>
                <div className="usage-token-meta-row">
                  <span>
                    {formatTokenFull(summary?.used ?? 0)} kullanıldı ·{' '}
                    {formatTokenFull(summary?.available ?? 0)} kaldı
                  </span>
                </div>
              </div>
            </div>

            <div className="usage-hero-actions">
              <label className="usage-auto-toggle">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Otomatik yenile
              </label>
              <button
                type="button"
                className={`usage-refresh-btn ${refreshing ? 'spinning' : ''}`}
                onClick={() => loadData(chartDays, true)}
                disabled={refreshing}
              >
                <RefreshCw size={16} />
                Yenile
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="usage-alert usage-alert--warning" role="alert">
            <Activity size={18} />
            <span>{error}</span>
          </div>
        ) : null}

        {warn === 'blocked' && summary ? (
          <div className="usage-alert usage-alert--danger" role="alert">
            <Zap size={18} />
            <div>
              <strong>Token limitiniz doldu.</strong> Yeni analiz başlatılamaz.{' '}
              <Link to="/pages-pricing" className="alert-link">
                Planınızı yükseltin
              </Link>
            </div>
          </div>
        ) : null}
        {warn === 'warning' && summary ? (
          <div className="usage-alert usage-alert--warning" role="alert">
            <Activity size={18} />
            <span>
              Kullanımınız limitin %{Math.round(usedPct)} seviyesinde.{' '}
              <Link to="/pages-pricing">Planları inceleyin</Link>
            </span>
          </div>
        ) : null}

        {!smtpReady && smtpInfo !== null ? (
          <div className="usage-alert usage-alert--info" role="status">
            <Mail size={18} />
            <div>
              <strong>Rapor e-postası henüz yapılandırılmadı.</strong> SMTP ayarları
              tamamlanana kadar rapor hazır bildirimleri kuyruğa alınır ancak gönderilmez.
              Gönderen adres: <code>{smtpInfo?.from_address || 'noreply@inferaworld.com'}</code>
            </div>
          </div>
        ) : null}

        {/* Quick actions */}
        <div className="usage-quick-actions">
          <Link to="/root-cause-tools" className="usage-quick-card">
            <div className="usage-quick-card-icon">
              <Sparkles size={20} />
            </div>
            <div className="usage-quick-card-text">
              <strong>DeepWhy Analiz</strong>
              <span>Yeni kök neden analizi başlat</span>
            </div>
            <ArrowRight size={18} color="#94a3b8" />
          </Link>
          <Link to="/pages-pricing" className="usage-quick-card">
            <div className="usage-quick-card-icon">
              <Crown size={20} />
            </div>
            <div className="usage-quick-card-text">
              <strong>Plan & Fiyatlandırma</strong>
              <span>Limitleri ve paketleri görüntüle</span>
            </div>
            <ArrowRight size={18} color="#94a3b8" />
          </Link>
          <a href="#rapor-epostalari" className="usage-quick-card">
            <div className="usage-quick-card-icon">
              <Mail size={20} />
            </div>
            <div className="usage-quick-card-text">
              <strong>Rapor E-postaları</strong>
              <span>Teslimat durumunu görüntüle</span>
            </div>
            <ArrowRight size={18} color="#94a3b8" />
          </a>
          <a href="#son-islemler" className="usage-quick-card">
            <div className="usage-quick-card-icon">
              <BarChart3 size={20} />
            </div>
            <div className="usage-quick-card-text">
              <strong>İşlem Geçmişi</strong>
              <span>Son AI işlemlerine git</span>
            </div>
            <ArrowRight size={18} color="#94a3b8" />
          </a>
        </div>

        {/* Stat cards — was 3 quick + 4 stats; quick now 4 */}
        <div className="usage-stat-grid">
          <StatCard
            icon={Coins}
            iconClass="indigo"
            label="Kullanılan Token"
            value={formatToken(animUsed)}
            hint={`Limitin %${Math.round(usedPct)}'i · ${recent.length} son işlem`}
          />
          <StatCard
            icon={MessageSquare}
            iconClass="amber"
            label="HITL Soruları"
            value={animQuestions}
            hint="Son 30 gün"
          />
          <StatCard
            icon={GitBranch}
            iconClass="blue"
            label="Pipeline Çalıştırma"
            value={animPipeline}
            hint="Son 30 gün"
          />
          <StatCard icon={Crown} iconClass="emerald" label="Aktif Plan">
            <span className={`usage-plan-badge usage-plan-badge--${planTier}`}>
              {PLAN_LABELS[planTier] || planTier}
            </span>
            <p className="usage-stat-hint mt-2 mb-0">
              Aylık {formatToken(summary?.period_limit ?? 0)} token kotası
            </p>
          </StatCard>
        </div>

        <Row className="usage-layout-row g-3">
          <Col lg={8}>
            <div className="usage-panel">
              <div className="usage-panel-header">
                <h5>
                  <BarChart3 size={18} style={{ marginRight: 8, verticalAlign: -3 }} />
                  Token Tüketimi
                </h5>
                <div className="usage-period-tabs" role="tablist">
                  {[7, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      role="tab"
                      aria-selected={chartDays === d}
                      className={`usage-period-tab ${chartDays === d ? 'active' : ''}`}
                      onClick={() => setChartDays(d)}
                    >
                      {d} gün
                    </button>
                  ))}
                </div>
              </div>
              <div className="usage-panel-body">
                {hasChartData ? (
                  <>
                    <div className="usage-chart-total">
                      Toplam tüketim: <strong>{formatTokenFull(chartTotal)}</strong> token
                    </div>
                    <div className="usage-chart-wrap">
                      <div className="usage-bar-chart">
                        {bars.map((p) => (
                          <div
                            key={p.date}
                            className={`usage-bar-col ${p.isToday ? 'is-today' : ''}`}
                            title={`${p.date}: ${formatTokenFull(p.tokens)} token`}
                          >
                            <div className="usage-bar-fill" style={{ height: `${p.h}%` }}>
                              {p.tokens > 0 ? (
                                <span className="usage-bar-value">{formatToken(p.tokens)}</span>
                              ) : null}
                            </div>
                            <span className="usage-bar-label">{p.date.slice(5)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="usage-chart-empty">
                    <div className="usage-chart-empty-icon">📊</div>
                    <p>
                      Seçilen dönemde henüz token tüketimi yok.
                      <br />
                      DeepWhy ile ilk analizinizi başlattığınızda grafik dolacak.
                    </p>
                    <Link to="/root-cause-tools" className="btn btn-primary btn-sm">
                      Analiz Başlat
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </Col>

          <Col lg={4}>
            <div className="usage-panel">
              <div className="usage-panel-header">
                <h5>Modül Dağılımı</h5>
                <span className="text-muted small">30 gün</span>
              </div>
              <div className="usage-panel-body">
                {modules.length === 0 ? (
                  <p className="text-muted small mb-0 text-center py-3">Henüz veri yok</p>
                ) : (
                  <ul className="usage-module-list">
                    {modules.map((m) => {
                      const color = MODULE_COLORS[m.module] || MODULE_COLORS.other;
                      return (
                        <li key={m.module} className="usage-module-item">
                          <div className="usage-module-row">
                            <span className="usage-module-name">
                              <span
                                className="usage-module-dot"
                                style={{ background: color }}
                              />
                              {m.label}
                            </span>
                            <span className="text-muted">
                              {m.percent}% · {formatToken(m.tokens)}
                            </span>
                          </div>
                          <div className="usage-module-bar">
                            <div
                              className="usage-module-bar-fill"
                              style={{ width: `${m.percent}%`, background: color }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </Col>
        </Row>

        <div className="usage-panel" id="rapor-epostalari">
          <div className="usage-panel-header">
            <h5>
              <Mail size={18} style={{ marginRight: 8, verticalAlign: -3 }} />
              Rapor E-posta Teslimatları
            </h5>
            <span className={`usage-smtp-pill ${smtpReady ? 'ready' : 'off'}`}>
              {smtpReady ? 'SMTP aktif' : 'SMTP kapalı'}
            </span>
          </div>
          <div className="usage-panel-body">
            <p className="usage-email-hint">
              Rapor oluşturulduğunda oturum e-postanıza (
              <strong>authUser.email</strong> / <code>X-User-Email</code>) imzalı HTML ve
              Word indirme linkleri gönderilir. Gönderen:{' '}
              <code>{smtpInfo?.from_address || 'noreply@inferaworld.com'}</code>
            </p>
            {deliveries.length === 0 ? (
              <p className="text-muted small mb-0">
                Henüz e-posta teslimat kaydı yok. İlk raporunuz hazırlandığında burada görünür.
              </p>
            ) : (
              <ul className="usage-delivery-list">
                {deliveries.map((d) => {
                  const st = deliveryStatusLabel(d.status);
                  return (
                    <li key={d.id || d.delivery_key} className="usage-delivery-item">
                      <div>
                        <strong>{d.incident_id || d.report_id}</strong>
                        <span className="text-muted small ms-2">{d.recipient_email}</span>
                      </div>
                      <div className="usage-delivery-meta">
                        <span className={`usage-delivery-badge ${st.cls}`}>{st.text}</span>
                        <span className="text-muted small">
                          {formatUsageDate(d.sent_at || d.created_at)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="usage-panel" id="son-islemler">
          <div className="usage-panel-header">
            <h5>
              <Activity size={18} style={{ marginRight: 8, verticalAlign: -3 }} />
              Son AI İşlemleri
            </h5>
            <span className="text-muted small">{recent.length} kayıt</span>
          </div>
          <div className="usage-panel-body p-0">
            {recent.length === 0 ? (
              <div className="usage-empty-state">
                <MessageSquare size={40} color="#cbd5e1" />
                <p>Henüz AI işlemi kaydı yok</p>
                <Link to="/root-cause-tools" className="btn btn-soft-primary btn-sm">
                  İlk Analizi Başlat
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="usage-activity-table">
                  <thead>
                    <tr>
                      <th>İşlem</th>
                      <th>Modül</th>
                      <th>Tarih</th>
                      <th className="text-end">Token</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <span className="usage-op-label">{row.operation_label}</span>
                        </td>
                        <td>
                          <span className={`usage-module-pill ${modulePillClass(row.module)}`}>
                            {row.module || '—'}
                          </span>
                        </td>
                        <td className="text-muted small">{formatUsageDate(row.created_at)}</td>
                        <td className="text-end">
                          <span className="usage-token-cost">
                            −{formatToken(row.token_cost)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
