import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, CardBody, Table, Progress } from 'reactstrap';
import {
  fetchUsageSummary,
  fetchUsageTimeseries,
  fetchUsageByModule,
  fetchUsageRecent,
  formatToken,
} from '../../services/usageApi';
import './dashboard.css';

function pctWidth(series) {
  if (!series?.length) return [];
  const max = Math.max(...series.map((p) => p.tokens), 1);
  return series.map((p) => ({
    ...p,
    h: Math.max(8, Math.round((p.tokens / max) * 100)),
  }));
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [modules, setModules] = useState([]);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, ts, mod, rec] = await Promise.all([
          fetchUsageSummary(),
          fetchUsageTimeseries(7),
          fetchUsageByModule(30),
          fetchUsageRecent(15),
        ]);
        if (cancelled) return;
        setSummary(s);
        setSeries(ts?.series || []);
        setModules(mod?.modules || []);
        setRecent(rec?.operations || []);
        setError('');
      } catch (e) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const bars = pctWidth(series);
  const usedPct = summary?.used_percent ?? 0;
  const warn = summary?.warn_level || 'ok';

  return (
    <div className="page-content dashboard-usage-page">
      <Container fluid>
        <h4 className="mb-1">Kullanım İstatistikleri</h4>
        <p className="text-muted mb-4">Token bakiyesi ve AI işlem geçmişi</p>

        {error ? (
          <div className="alert alert-warning" role="alert">
            {error}
          </div>
        ) : null}

        {warn === 'blocked' && summary ? (
          <div className="alert alert-danger" role="alert">
            Token limitiniz doldu. Yeni analiz başlatılamaz; mevcut raporlarınızı görüntüleyebilirsiniz.
          </div>
        ) : null}
        {warn === 'warning' && summary ? (
          <div className="alert alert-warning" role="alert">
            Token kullanımınız limitin %{Math.round(usedPct)} seviyesinde.
          </div>
        ) : null}

        <Row className="g-3 mb-4">
          <Col md={6} xl={3}>
            <Card className="dash-stat-card">
              <CardBody>
                <div className="text-muted small">Toplam Token</div>
                <h3 className="mb-2">{loading ? '…' : formatToken(summary?.used ?? 0)}</h3>
                <Progress value={Math.min(100, usedPct)} color={warn === 'blocked' ? 'danger' : 'primary'} />
                <div className="small text-muted mt-2">
                  Kullanılan: %{usedPct.toFixed ? usedPct.toFixed(0) : usedPct} · Limit:{' '}
                  {formatToken(summary?.period_limit ?? 0)}
                </div>
                <div className="small mt-1">
                  Kalan: <strong>{formatToken(summary?.available ?? 0)}</strong>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col md={6} xl={3}>
            <Card className="dash-stat-card">
              <CardBody>
                <div className="text-muted small">AI Soru Sayısı (30g)</div>
                <h3>{loading ? '…' : summary?.ai_question_count ?? 0}</h3>
              </CardBody>
            </Card>
          </Col>
          <Col md={6} xl={3}>
            <Card className="dash-stat-card">
              <CardBody>
                <div className="text-muted small">Pipeline (30g)</div>
                <h3>{loading ? '…' : summary?.pipeline_runs_30d ?? 0}</h3>
              </CardBody>
            </Card>
          </Col>
          <Col md={6} xl={3}>
            <Card className="dash-stat-card">
              <CardBody>
                <div className="text-muted small">Plan</div>
                <h3 className="text-capitalize">{loading ? '…' : summary?.plan_tier ?? 'starter'}</h3>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Row className="g-3 mb-4">
          <Col lg={8}>
            <Card>
              <CardBody>
                <h5 className="mb-3">Token Tüketim Geçmişi (son 7 gün)</h5>
                <div className="usage-bar-chart">
                  {bars.map((p) => (
                    <div key={p.date} className="usage-bar-col" title={`${p.date}: ${p.tokens} tkn`}>
                      <div className="usage-bar-fill" style={{ height: `${p.h}%` }} />
                      <span className="usage-bar-label">{p.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col lg={4}>
            <Card>
              <CardBody>
                <h5 className="mb-3">Modül Dağılımı</h5>
                <ul className="list-unstyled mb-0 module-usage-list">
                  {modules.map((m) => (
                    <li key={m.module} className="d-flex justify-content-between py-1">
                      <span>{m.label}</span>
                      <span className="text-muted">
                        {m.percent}% · {formatToken(m.tokens)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Card>
          <CardBody>
            <h5 className="mb-3">Son AI İşlemleri</h5>
            <div className="table-responsive">
              <Table className="table align-middle mb-0" size="sm">
                <thead>
                  <tr>
                    <th>İşlem</th>
                    <th>Modül</th>
                    <th>Tarih</th>
                    <th className="text-end">Token</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-muted text-center py-4">
                        {loading ? 'Yükleniyor…' : 'Henüz kayıt yok'}
                      </td>
                    </tr>
                  ) : (
                    recent.map((row) => (
                      <tr key={row.id}>
                        <td>{row.operation_label}</td>
                        <td>
                          <span className="badge bg-soft-primary text-primary">{row.module}</span>
                        </td>
                        <td className="text-muted small">
                          {(row.created_at || '').replace('T', ' ').slice(0, 16)}
                        </td>
                        <td className="text-end fw-semibold">{formatToken(row.token_cost)} Tkn</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
