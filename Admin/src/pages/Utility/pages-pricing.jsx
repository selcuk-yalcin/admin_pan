import React, { useEffect, useState } from "react";
import { Container, Row, Col, Spinner, Alert } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
  fetchPricingPlans,
  planFeaturesFromConfig,
  ctaForPlan,
} from "../../services/pricingApi";

const FALLBACK_CATALOG = {
  plans: [
    {
      id: "starter",
      name_tr: "Starter",
      segment_tr: "KOBİ / bireysel HSE",
      highlight: false,
      monthly_report_quota: 10,
      monthly_token_budget: 220000,
      analysis_features: ["5-Why"],
      formats: ["HTML", "Word"],
      seat_limit: 3,
      api_sso_sla: "—",
      cta_tr: "Başla",
      cta_action: "signup",
    },
    {
      id: "pro",
      name_tr: "Professional",
      segment_tr: "Orta ölçekli işletme",
      highlight: true,
      monthly_report_quota: 50,
      monthly_token_budget: 900000,
      analysis_features: ["5-Why", "Bow-tie"],
      formats: ["HTML", "Word", "PDF"],
      seat_limit: 15,
      api_sso_sla: "API",
      cta_tr: "Satın al",
      cta_action: "checkout",
    },
    {
      id: "enterprise",
      name_tr: "Enterprise",
      segment_tr: "Büyük sanayi / holding",
      highlight: false,
      monthly_report_quota: 500,
      monthly_token_budget: 5000000,
      analysis_features: ["5-Why", "Bow-tie", "Custom taxonomy"],
      formats: ["HTML", "Word", "PDF"],
      seat_limit: 999,
      api_sso_sla: "API + SSO + SLA",
      cta_tr: "İletişime geç",
      cta_action: "contact",
    },
  ],
};

const PagesPricing = () => {
  document.title = "Fiyatlandırma | Infera World - İSG Admin Paneli";
  const [catalog, setCatalog] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchPricingPlans();
        if (!cancelled) setCatalog(data);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err?.message || "Planlar yüklenemedi");
          setCatalog(FALLBACK_CATALOG);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const plans = catalog?.plans || [];

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Utility" breadcrumbItem="Fiyatlandırma" />

          <Row className="justify-content-center">
            <Col lg={8}>
              <div className="text-center mb-5">
                <h4 style={{ fontWeight: 700, color: "#0f172a", fontSize: 24 }}>
                  Kök Neden Analizi Planınızı Seçin
                </h4>
                <p className="text-muted" style={{ maxWidth: 520, margin: "8px auto 0", lineHeight: 1.7 }}>
                  Plan limitleri merkezi yapılandırmadan gelir; token bütçesi ve rapor kotası
                  hesabınızla eşlenir.
                </p>
              </div>
            </Col>
          </Row>

          {loading && (
            <div className="text-center py-5">
              <Spinner color="primary" />
            </div>
          )}

          {loadError && (
            <Row className="justify-content-center mb-3">
              <Col lg={8}>
                <Alert color="warning" className="mb-0">
                  API bağlantısı kurulamadı; yerel plan özeti gösteriliyor. ({loadError})
                </Alert>
              </Col>
            </Row>
          )}

          {!loading && (
            <Row className="justify-content-center">
              {plans.map((plan) => {
                const features = planFeaturesFromConfig(plan, "tr");
                const cta = ctaForPlan(plan, "tr");
                const recommended = Boolean(plan.highlight);
                return (
                  <Col xl={4} md={6} key={plan.id} style={{ marginBottom: 24 }}>
                    <div
                      style={{
                        background: recommended
                          ? "linear-gradient(135deg,#eef2ff,#e0e7ff)"
                          : "#fff",
                        borderRadius: 20,
                        border: recommended ? "2px solid #6366f1" : "1px solid #e2e8f0",
                        position: "relative",
                        boxShadow: recommended
                          ? "0 8px 30px rgba(99,102,241,.15)"
                          : "0 2px 12px rgba(0,0,0,.04)",
                      }}
                    >
                      {recommended && (
                        <div
                          style={{
                            position: "absolute",
                            top: 16,
                            right: 16,
                            background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "4px 12px",
                            borderRadius: 20,
                          }}
                        >
                          EN POPÜLER
                        </div>
                      )}

                      <div style={{ padding: "28px 28px 0" }}>
                        <h5 style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: 18 }}>
                          {plan.name_tr || plan.name_en || plan.id}
                        </h5>
                        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#64748b" }}>
                          {plan.segment_tr || plan.segment_en}
                        </p>

                        <div style={{ padding: "20px 0 0" }}>
                          <a
                            href={cta.href}
                            style={{
                              display: "block",
                              width: "100%",
                              padding: "12px",
                              borderRadius: 12,
                              border: "none",
                              fontSize: 14,
                              fontWeight: 700,
                              textAlign: "center",
                              textDecoration: "none",
                              background:
                                cta.style === "secondary" ? "#e2e8f0" : recommended ? "#6366f1" : "#0f172a",
                              color: cta.style === "secondary" ? "#334155" : "#fff",
                            }}
                          >
                            {cta.label}
                          </a>
                        </div>
                      </div>

                      <div style={{ padding: "0 28px 28px" }}>
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#94a3b8",
                            letterSpacing: ".5px",
                            marginBottom: 14,
                            textTransform: "uppercase",
                          }}
                        >
                          Özellikler
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {features.map((f, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ color: f.included ? "#10b981" : "#d1d5db" }}>
                                {f.included ? "✓" : "×"}
                              </span>
                              <span
                                style={{
                                  fontSize: 13.5,
                                  color: f.included ? "#334155" : "#94a3b8",
                                  fontWeight: f.highlight ? 600 : 400,
                                }}
                              >
                                {f.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </Container>
      </div>
    </React.Fragment>
  );
};

export default PagesPricing;
