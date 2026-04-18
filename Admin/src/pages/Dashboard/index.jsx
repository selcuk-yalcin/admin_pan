import PropTypes from "prop-types";
import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Badge,
  Table,
} from "reactstrap";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

//i18n
import { withTranslation } from "react-i18next";

import "./dashboard.scss";

// ── Token tüketim verileri (son 7 gün) ──
const tokenData = [
  { date: "03 Feb", tokens: 12000 },
  { date: "04 Feb", tokens: 15000 },
  { date: "05 Feb", tokens: 8000 },
  { date: "06 Feb", tokens: 22000 },
  { date: "07 Feb", tokens: 18000 },
  { date: "08 Feb", tokens: 5000 },
  { date: "09 Feb", tokens: 14500 },
];

// ── Modül dağılımı ──
const moduleData = [
  { name: "Mevzuat Botu", value: 850, color: "#6366f1", label: "850 Soru" },
  { name: "Risk Analizi", value: 12, color: "#22c55e", label: "12 Rapor" },
  { name: "Kök Neden", value: 24, color: "#f59e0b", label: "24 Analiz" },
];

// ── Son AI İşlemleri ──
const recentOperations = [
  {
    name: '"Yüksekte çalışma yönetmeliği madde 4..." sorgusu',
    module: "Bot",
    moduleColor: "primary",
    moduleIcon: "bx bx-bot",
    date: "09.02.2026 14:30",
    tokenCost: "1,240 Tkn",
    status: "Başarılı",
    statusColor: "success",
  },
  {
    name: "Risk Analizi: Depo Alanı v2",
    module: "Risk",
    moduleColor: "success",
    moduleIcon: "bx bx-shield-quarter",
    date: "09.02.2026 11:15",
    tokenCost: "8,500 Tkn",
    status: "Taslak",
    statusColor: "warning",
  },
  {
    name: "Kök Neden: Bant Kopması Olayı",
    module: "Analiz",
    moduleColor: "info",
    moduleIcon: "bx bx-analyse",
    date: "08.02.2026 16:45",
    tokenCost: "3,200 Tkn",
    status: "Kaydedildi",
    statusColor: "primary",
  },
  {
    name: '"KKD zimmet formu örneği" sorgusu',
    module: "Bot",
    moduleColor: "primary",
    moduleIcon: "bx bx-bot",
    date: "08.02.2026 09:20",
    tokenCost: "650 Tkn",
    status: "Başarılı",
    statusColor: "success",
  },
];

// ── Stat Card ──
const StatCard = ({ icon, iconBg, title, value, subtitle, children }) => (
  <Card className="stat-card border-0 shadow-sm h-100">
    <CardBody className="p-4">
      <div className="d-flex align-items-center mb-3">
        <div className={`stat-icon-box ${iconBg}`}>
          <i className={icon}></i>
        </div>
        <h6 className="text-muted mb-0 ms-3 fw-medium">{title}</h6>
      </div>
      <h2 className="stat-value mb-1">{value}</h2>
      {subtitle && (
        <p className="text-muted font-size-13 mb-0">{subtitle}</p>
      )}
      {children}
    </CardBody>
  </Card>
);

// ── Custom Tooltip ──
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip">
        <p className="fw-medium mb-1">{label}</p>
        <p className="text-primary mb-0">
          {payload[0].value.toLocaleString()} token
        </p>
      </div>
    );
  }
  return null;
};

// ── Donut center label ──
const renderCenterLabel = () => (
  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
    <tspan x="50%" dy="-8" className="donut-center-value">
      68%
    </tspan>
    <tspan x="50%" dy="22" className="donut-center-label">
      Aktiflik
    </tspan>
  </text>
);

const Dashboard = (props) => {
  const [chartPeriod, setChartPeriod] = useState("7gun");

  //meta title
  document.title = "Panel | Infera World - İSG Admin Paneli";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-1 fw-bold">Kullanım İstatistikleri</h4>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="text-end">
                <h6 className="mb-0 fw-semibold">ISG Admin</h6>
                <small className="text-muted">Üyelik: Premium</small>
              </div>
              <div className="avatar-sm">
                <span className="avatar-title rounded-circle bg-primary-subtle text-primary font-size-16">
                  <i className="bx bx-user"></i>
                </span>
              </div>
            </div>
          </div>

          {/* ── Stat Cards Row ── */}
          <Row className="g-3 mb-4">
            <Col xl={3} md={6}>
              <StatCard
                icon="bx bx-chip"
                iconBg="icon-bg-indigo"
                title="Toplam Token"
                value="142,590"
              >
                <div className="mt-3">
                  <div className="progress progress-sm">
                    <div
                      className="progress-bar bg-primary"
                      style={{ width: "65%" }}
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between mt-1">
                    <small className="text-muted">Kullanılan: %65</small>
                    <small className="text-muted">Limit: 220k</small>
                  </div>
                </div>
              </StatCard>
            </Col>
            <Col xl={3} md={6}>
              <StatCard
                icon="bx bx-message-dots"
                iconBg="icon-bg-orange"
                title="AI Soru Sayısı"
                value="328"
                subtitle={
                  <span className="text-success">
                    <i className="bx bx-trending-up me-1"></i>
                    Geçen aya göre +%12
                  </span>
                }
              />
            </Col>
            <Col xl={3} md={6}>
              <StatCard
                icon="bx bx-shield-quarter"
                iconBg="icon-bg-green"
                title="Risk Analizi"
                value="12"
              >
                <div className="d-flex gap-2 mt-2">
                  <Badge color="success" className="px-2 py-1 font-size-12">
                    8 Tamamlandı
                  </Badge>
                  <Badge color="warning" className="px-2 py-1 font-size-12">
                    4 Taslak
                  </Badge>
                </div>
              </StatCard>
            </Col>
            <Col xl={3} md={6}>
              <StatCard
                icon="bx bx-analyse"
                iconBg="icon-bg-blue"
                title="Kök Neden Analizi"
                value="24"
                subtitle="Balık Kılçığı ve 5 Neden"
              />
            </Col>
          </Row>

          {/* ── Charts Row ── */}
          <Row className="g-3 mb-4">
            {/* Token Tüketim Grafiği */}
            <Col xl={8}>
              <Card className="border-0 shadow-sm h-100">
                <CardBody className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                      <h5 className="fw-bold mb-1">Token Tüketim Geçmişi</h5>
                      <p className="text-muted font-size-13 mb-0">
                        Son 7 günlük AI aktivitesi
                      </p>
                    </div>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: "130px" }}
                      value={chartPeriod}
                      onChange={(e) => setChartPeriod(e.target.value)}
                    >
                      <option value="7gun">Son 7 Gün</option>
                      <option value="30gun">Son 30 Gün</option>
                      <option value="90gun">Son 90 Gün</option>
                    </select>
                  </div>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={tokenData}>
                        <defs>
                          <linearGradient
                            id="tokenGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#6366f1"
                              stopOpacity={0.15}
                            />
                            <stop
                              offset="95%"
                              stopColor="#6366f1"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f0f0f0"
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#8c8c8c", fontSize: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#8c8c8c", fontSize: 12 }}
                          tickFormatter={(v) => v.toLocaleString()}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="tokens"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          fill="url(#tokenGradient)"
                          dot={{
                            r: 5,
                            fill: "#fff",
                            stroke: "#6366f1",
                            strokeWidth: 2,
                          }}
                          activeDot={{
                            r: 7,
                            fill: "#6366f1",
                            stroke: "#fff",
                            strokeWidth: 2,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>
            </Col>

            {/* Modül Kullanım Dağılımı - Donut */}
            <Col xl={4}>
              <Card className="border-0 shadow-sm h-100">
                <CardBody className="p-4 d-flex flex-column">
                  <h5 className="fw-bold mb-4 text-center">
                    Modül Kullanım Dağılımı
                  </h5>
                  <div
                    className="d-flex justify-content-center"
                    style={{ height: 220 }}
                  >
                    <ResponsiveContainer width={220} height={220}>
                      <PieChart>
                        <Pie
                          data={moduleData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {moduleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        {renderCenterLabel()}
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="mt-auto">
                    {moduleData.map((item, index) => (
                      <div
                        key={index}
                        className="d-flex justify-content-between align-items-center mb-2"
                      >
                        <div className="d-flex align-items-center">
                          <span
                            className="legend-dot me-2"
                            style={{ backgroundColor: item.color }}
                          ></span>
                          <span className="text-muted font-size-14">
                            {item.name}
                          </span>
                        </div>
                        <span className="fw-bold font-size-14">
                          {item.label}
                        </span>
                      </div>
                    ))}
                    <div className="text-center mt-3">
                      <Link
                        to="#"
                        className="btn btn-soft-primary btn-sm w-100 rounded-pill"
                      >
                        <i className="bx bx-download me-1"></i>
                        Detaylı Rapor İndir
                      </Link>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* ── Son AI İşlemleri Tablosu ── */}
          <Row>
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <CardBody className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">
                      Son AI İşlemleri ve Raporlar
                    </h5>
                    <Link
                      to="#"
                      className="text-primary fw-medium font-size-14"
                    >
                      Tümünü Gör{" "}
                      <i className="bx bx-right-arrow-alt ms-1"></i>
                    </Link>
                  </div>
                  <div className="table-responsive">
                    <Table className="table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="text-uppercase font-size-12 text-muted fw-semibold">
                            İşlem Adı
                          </th>
                          <th className="text-uppercase font-size-12 text-muted fw-semibold">
                            Modül
                          </th>
                          <th className="text-uppercase font-size-12 text-muted fw-semibold">
                            Tarih
                          </th>
                          <th className="text-uppercase font-size-12 text-muted fw-semibold">
                            Token Maliyeti
                          </th>
                          <th className="text-uppercase font-size-12 text-muted fw-semibold text-end">
                            Durum
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOperations.map((op, idx) => (
                          <tr key={idx}>
                            <td>
                              <span className="fw-medium">{op.name}</span>
                            </td>
                            <td>
                              <Badge
                                color={op.moduleColor}
                                className="badge-soft px-2 py-1 font-size-12"
                                pill
                              >
                                <i className={`${op.moduleIcon} me-1`}></i>
                                {op.module}
                              </Badge>
                            </td>
                            <td className="text-muted">{op.date}</td>
                            <td className="fw-medium">{op.tokenCost}</td>
                            <td className="text-end">
                              <span
                                className={`text-${op.statusColor} fw-semibold`}
                              >
                                {op.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

Dashboard.propTypes = {
  t: PropTypes.any,
};

export default withTranslation()(Dashboard);
