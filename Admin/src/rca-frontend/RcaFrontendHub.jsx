import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, FolderOpen, PlayCircle, FilePlus } from "lucide-react";
import ChatInterface from "./components/ChatInterface";
import IncidentForm from "./components/IncidentForm";
import SavedReportsPanel from "./components/SavedReportsPanel";
import ReportGuideVideoPanel from "./components/ReportGuideVideoPanel";
import Header from "./components/Header";
import { getTranslation } from "./utils/translations";
import {
  upsertDraftReport,
  upsertSavedReport,
  notifyDraftsChanged,
} from "./utils/draftReportsStorage";
import {
  bootstrapInteractiveSession,
  checkHealth,
  runPipelineJobWithPolling,
  generatePDFReport,
} from "../services/hsg245Api";
import { buildHowHappenedText, buildInvestigationPayload } from "./utils/investigationPayload";
import { fetchUsageSummary, formatToken } from "../services/usageApi";
import "./RcaFrontendHub.css";
import "./rcaEmbedLayout.css";

const TAB_KEYS = ["form", "chat", "reports", "guide"];
const LIBRARY_TABS = new Set(["reports", "guide"]);
/** Test aşamasında etkileşimli analiz kapalı; yalnızca doğrudan rapor oluşturma. */
const INTERACTIVE_ANALYSIS_ENABLED = false;

/**
 * Kök Neden araçları: Manuel form + Etkileşimli analiz (?tab=form|chat|reports|guide).
 * Eski ?tab=smart → form; ?tab=videos → guide.
 */
export default function RcaFrontendHub({ showAdminReturn = false }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("form");
  const [selectedLanguage, setSelectedLanguage] = useState("tr");
  const [isLightMode, setIsLightMode] = useState(true);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formSubmitError, setFormSubmitError] = useState("");
  const [formSubmitInfo, setFormSubmitInfo] = useState("");
  const [createdIncidentId, setCreatedIncidentId] = useState("");
  const [hitlSeed, setHitlSeed] = useState(null);
  const [activeSubmitMode, setActiveSubmitMode] = useState(null);
  const [chatPipelineStatus, setChatPipelineStatus] = useState("");
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [formDraftSeed, setFormDraftSeed] = useState(null);
  const [tokenSummary, setTokenSummary] = useState(null);
  const [flowComplete, setFlowComplete] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const submitAbortRef = useRef(null);
  /** React state gecikmesi olmadan HITL oturumu (setTab ?tab=chat senkron kontrolü) */
  const hitlSeedRef = useRef(null);

  const tokensBlocked =
    tokenSummary?.warn_level === "blocked" ||
    (tokenSummary?.enforcement_enabled && (tokenSummary?.available ?? 1) <= 0);

  const syncTabFromUrl = useCallback(() => {
    const raw = searchParams.get("tab");
    if (raw === "smart") {
      setSearchParams({ tab: "form" }, { replace: true });
      return;
    }
    if (raw === "videos") {
      setSearchParams({ tab: "guide" }, { replace: true });
      setActiveTab("guide");
      return;
    }
    if (raw === "chat" && !hitlSeedRef.current && !hitlSeed) {
      setSearchParams({ tab: "form" }, { replace: true });
      setActiveTab("form");
      return;
    }
    if (raw && TAB_KEYS.includes(raw)) {
      setActiveTab(raw);
    } else {
      setActiveTab("form");
    }
  }, [searchParams, setSearchParams, hitlSeed]);

  useEffect(() => {
    syncTabFromUrl();
  }, [syncTabFromUrl]);

  useEffect(() => {
    let cancelled = false;
    fetchUsageSummary()
      .then((data) => {
        if (!cancelled) setTokenSummary(data);
      })
      .catch(() => {
        if (!cancelled) setTokenSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, isSubmittingForm]);

  // Railway cold-start: form sekmesi açılınca backend'i uyar (504 riskini azaltır).
  useEffect(() => {
    if (activeTab !== "form") return;
    checkHealth().catch(() => {});
  }, [activeTab]);

  const translate = (key) => getTranslation(selectedLanguage, key);
  const subtitleText = translate("subtitle").replace(/^HSG245 v2\.0\s*-\s*/i, "");

  const hasHitlSession = useCallback(
    () => Boolean(hitlSeedRef.current || hitlSeed),
    [hitlSeed],
  );

  const applyHitlSeed = useCallback((seed) => {
    hitlSeedRef.current = seed;
    setHitlSeed(seed);
  }, []);

  const clearHitlSession = useCallback(() => {
    hitlSeedRef.current = null;
    setHitlSeed(null);
    setChatPipelineStatus("");
  }, []);

  const setTab = (tab) => {
    if (!TAB_KEYS.includes(tab)) return;
    if (tab === "chat" && !hasHitlSession()) {
      setActiveTab("form");
      setSearchParams({ tab: "form" }, { replace: true });
      return;
    }
    setFormSubmitError("");
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  const mapEventCategoryToEventType = (eventCategory) => {
    switch (eventCategory) {
      case "near_miss":
        return "Ramak Kala Olay";
      case "unsafe_condition":
        return "Guvensiz Durum";
      case "property_damage":
        return "Maddi Hasar";
      case "incident":
      default:
        return "Kaza";
    }
  };

  const mapInjurySeverityToActualHarm = (injurySeverity) => {
    switch ((injurySeverity || "").toLowerCase()) {
      case "fatal":
        return "Fatal or major";
      case "severe":
        return "Serious";
      case "moderate":
        return "Minor";
      case "minor":
      default:
        return "Minor";
    }
  };

  const mapInjurySeverityToRiddor = (injurySeverity) => {
    const value = (injurySeverity || "").toLowerCase();
    if (value === "fatal" || value === "severe") return "Yes";
    if (value === "minor" || value === "moderate") return "No";
    return "Unsure";
  };

  const handleFormSubmit = async (formData, mode = "report") => {
    if (isSubmittingForm) return;
    if (tokensBlocked) {
      setFormSubmitError(
        "Token limitiniz doldu. Lütfen Panel → Kullanım İstatistikleri üzerinden bakiyenizi kontrol edin.",
      );
      return;
    }

    const controller = new AbortController();
    submitAbortRef.current = controller;
    setIsSubmittingForm(true);
    setFormSubmitError("");
    setActiveSubmitMode(mode);
    hitlSeedRef.current = null;
    setHitlSeed(null);
    setFormSubmitInfo(
      mode === "interactive"
        ? "Kayit hazirlaniyor (sunucu uyaniyorsa birkaç saniye surebilir)..."
        : "Ajan pipeline ve PDF rapor baslatiliyor...",
    );
    setCreatedIncidentId("");

    try {
      const description = buildHowHappenedText(formData, selectedLanguage);
      const dateTime = `${formData.incidentDate || ""}T${formData.incidentTime || ""}`.replace(/T$/, "");

      let incidentId = "";

      if (mode === "interactive") {
        if (!INTERACTIVE_ANALYSIS_ENABLED) {
          throw new Error(
            selectedLanguage === "tr"
              ? "Etkileşimli analiz test aşamasında kapalıdır. Lütfen Rapor Oluştur kullanın."
              : "Interactive analysis is disabled during testing. Please use Create report.",
          );
        }
        const bootstrapResult = await bootstrapInteractiveSession({
          reported_by: formData.reportedBy || "Unknown reporter",
          description,
          injury_description: [
            formData.injuryType,
            formData.bodyPart,
            formData.medicalTreatment,
            formData.propertyDamage,
          ]
            .filter(Boolean)
            .join(" | "),
          forwarded_to: formData.department || "",
          event_category: formData.eventCategory || "incident",
          date_time: dateTime || new Date().toISOString(),
          event_type: mapEventCategoryToEventType(formData.eventCategory),
          actual_harm: mapInjurySeverityToActualHarm(formData.injurySeverity),
          riddor_reportable: mapInjurySeverityToRiddor(formData.injurySeverity),
        }, { signal: controller.signal });

        incidentId = bootstrapResult?.data?.incident_id;
        if (!incidentId) {
          throw new Error("Incident ID donmedi.");
        }
        setCreatedIncidentId(incidentId);
        setFormSubmitInfo(
          `Hazir: ${incidentId}. Etkilesimli analiz sekmesine geciliyor...`,
        );
        setChatPipelineStatus("");
        applyHitlSeed({ incidentId, formData });
        setFormSubmitError("");
        setActiveTab("chat");
        setSearchParams({ tab: "chat" }, { replace: true });
        return;
      }

      const bootstrapResult = await bootstrapInteractiveSession({
        reported_by: formData.reportedBy || "Unknown reporter",
        description,
        injury_description: [
          formData.injuryType,
          formData.bodyPart,
          formData.medicalTreatment,
          formData.propertyDamage,
        ]
          .filter(Boolean)
          .join(" | "),
        forwarded_to: formData.department || "",
        event_category: formData.eventCategory || "incident",
        date_time: dateTime || new Date().toISOString(),
        event_type: mapEventCategoryToEventType(formData.eventCategory),
        actual_harm: mapInjurySeverityToActualHarm(formData.injurySeverity),
        riddor_reportable: mapInjurySeverityToRiddor(formData.injurySeverity),
      }, { signal: controller.signal });

      incidentId = bootstrapResult?.data?.incident_id;
      if (!incidentId) {
        throw new Error("Incident ID donmedi.");
      }
      setCreatedIncidentId(incidentId);

      setFormSubmitInfo(`Kayit tamam (${incidentId}). Kök neden analizi baslatiliyor...`);

      const pipelineResult = await runPipelineJobWithPolling(
        incidentId,
        buildInvestigationPayload(formData, "", selectedLanguage),
        {
          signal: controller.signal,
          onUpdate: (job) => {
            const stage = job?.stage || "";
            const message = job?.message || "";
            if (message) {
              setFormSubmitInfo(message);
            } else if (stage) {
              setFormSubmitInfo(`Asama: ${stage} (${job?.progress ?? 0}%)`);
            }
          },
        },
      );

      if (!pipelineResult?.data && !pipelineResult?.job?.result) {
        throw new Error("Pipeline tamamlandi ancak sonuc donmedi.");
      }

      setFormSubmitInfo("HTML rapor olusturuluyor ve indiriliyor...");
      await generatePDFReport(incidentId, { signal: controller.signal });

      setFormSubmitInfo(
        `Tamamlandi. Incident ID: ${incidentId}. Rapor indirildi.`,
      );
    } catch (error) {
      if (error?.name === "AbortError") {
        setFormSubmitInfo("Analiz islemi kullanici tarafindan iptal edildi.");
        setFormSubmitError("");
      } else {
        setFormSubmitError(error?.message || "Form gonderimi sirasinda bilinmeyen bir hata olustu.");
        setFormSubmitInfo("");
      }
    } finally {
      submitAbortRef.current = null;
      setIsSubmittingForm(false);
      setActiveSubmitMode(null);
    }
  };

  const handleCancelSubmit = () => {
    if (submitAbortRef.current) {
      submitAbortRef.current.abort();
    }
  };

  const handleHitlFlowComplete = () => {
    clearHitlSession();
  };

  const handleStartNewAnalysis = useCallback(() => {
    if (submitAbortRef.current) {
      submitAbortRef.current.abort();
      submitAbortRef.current = null;
    }
    setFlowComplete(false);
    clearHitlSession();
    setFormSubmitInfo("");
    setFormSubmitError("");
    setCreatedIncidentId("");
    setActiveDraftId(null);
    setFormDraftSeed(null);
    setIsSubmittingForm(false);
    setActiveSubmitMode(null);
    setFormResetKey((k) => k + 1);
    setActiveTab("form");
    setSearchParams({ tab: "form" }, { replace: true });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        document.querySelector(".rca-frontend-hub .main-content")?.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 0);
    }
  }, [clearHitlSession, setSearchParams]);

  const handleAnalysisComplete = useCallback(
    ({ incidentId } = {}) => {
      setFlowComplete(true);
      if (incidentId) setCreatedIncidentId(incidentId);
      setFormSubmitInfo(translate("report_saved_toast"));
      setFormSubmitError("");
    },
    [translate],
  );

  const handlePersistDraft = useCallback(
    async (formData) => {
      const entry = await upsertDraftReport(formData, "", activeDraftId);
      setActiveDraftId(entry.id);
      setFormSubmitError("");
      setFormSubmitInfo(translate("draft_saved_toast"));
      notifyDraftsChanged();
    },
    [activeDraftId, translate],
  );

  const handleSaveToReports = useCallback(
    async ({ incidentId, formData, reportReady = true }) => {
      if (!incidentId) return;
      await upsertSavedReport({
        incidentId,
        snapshot: formData || {},
        reportReady,
      });
      notifyDraftsChanged();
      setFormSubmitError("");
      setFormSubmitInfo(translate("report_saved_toast"));
    },
    [translate],
  );

  const handleLoadDraftEntry = useCallback((entry) => {
    setActiveDraftId(entry.id);
    setFormDraftSeed(entry.snapshot ? { ...entry.snapshot } : null);
    setTab("form");
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 0);
  }, []);

  const handleOpenReportEntry = useCallback(
    async (entry) => {
      if (!entry?.incidentId) {
        handleLoadDraftEntry(entry);
        return;
      }
      setFormSubmitError("");
      try {
        const { openReportForEntry } = await import("./utils/reportsLibraryApi");
        await openReportForEntry(entry, "report");
        setFormSubmitInfo(
          `${translate("tab_saved_reports")}: ${entry.incidentId}`,
        );
      } catch (err) {
        setFormSubmitError(err?.message || String(err));
      }
    },
    [handleLoadDraftEntry, translate],
  );

  const handleThemeToggle = () => {
    setIsLightMode((prev) => !prev);
  };

  const hubClassName = `app rca-frontend-hub${showAdminReturn ? " fullscreen-mode" : ""}${isLightMode ? " light-mode" : " theme-dark"}`;

  return (
    <div className={hubClassName}>
      <div className="rca-hub-sticky-top">
      <Header
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        showAdminReturn={showAdminReturn}
        onAdminReturn={() => navigate("/dashboard")}
        onNewAnalysis={handleStartNewAnalysis}
        isLightMode={isLightMode}
        onThemeToggle={handleThemeToggle}
      />

      <div className="tab-navigation">
        <div className="tab-navigation-form-group">
          <button
            type="button"
            className="tab-new-report-btn"
            onClick={handleStartNewAnalysis}
            title={translate("btn_new_report")}
          >
            <FilePlus size={18} aria-hidden />
            <span>{translate("btn_new_report")}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "form" ? "active" : ""}`}
            onClick={() => setTab("form")}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{translate("manual_form")}</span>
          </button>
        </div>
        <button
          type="button"
          className={`tab-btn ${activeTab === "chat" ? "active" : ""}${!hasHitlSession() || !INTERACTIVE_ANALYSIS_ENABLED ? " tab-btn--locked" : ""}`}
          onClick={() => {
            if (!INTERACTIVE_ANALYSIS_ENABLED) return;
            setTab("chat");
          }}
          title={
            !INTERACTIVE_ANALYSIS_ENABLED
              ? (selectedLanguage === "tr"
                ? "Etkileşimli analiz test aşamasında kapalı"
                : "Interactive analysis is disabled during testing")
              : !hasHitlSession()
                ? translate("chat_tab_locked_hint")
                : undefined
          }
          aria-disabled={!hasHitlSession() || !INTERACTIVE_ANALYSIS_ENABLED}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <Lock size={14} className="tab-lock-icon" />
          <span>{translate("interactive_analysis")}</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "reports" ? "active" : ""}`}
          onClick={() => setTab("reports")}
        >
          <FolderOpen size={20} aria-hidden />
          <span>{translate("tab_saved_reports")}</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "guide" ? "active" : ""}`}
          onClick={() => setTab("guide")}
        >
          <PlayCircle size={20} aria-hidden />
          <span>{translate("tab_report_guide")}</span>
        </button>
      </div>

      {tokenSummary && !LIBRARY_TABS.has(activeTab) ? (
        <div
          className={`token-usage-strip token-usage-strip--${tokenSummary.warn_level || "ok"}`}
          style={{ marginBottom: 12 }}
        >
          <span>
            Token: <strong>{formatToken(tokenSummary.available)}</strong> kalan /{" "}
            {formatToken(tokenSummary.period_limit)} limit
          </span>
          {tokensBlocked ? (
            <span className="token-usage-strip-warn"> — Yeni analiz kapalı</span>
          ) : null}
        </div>
      ) : null}

      {!LIBRARY_TABS.has(activeTab) && activeTab !== "chat" ? (
        <div className="info-banner">
          <div className="info-banner-icon">RCA</div>
          <div className="info-banner-content">
            <h2>{translate("root_cause_analysis")}</h2>
            <p>
              <strong>DeepWhy</strong>
              {subtitleText ? ` - ${subtitleText}` : ""}
            </p>
          </div>
        </div>
      ) : null}

      {flowComplete && !LIBRARY_TABS.has(activeTab) ? (
        <div className="rca-completion-cta" role="status">
          <p className="rca-completion-cta-text">{translate("analysis_complete_banner")}</p>
          <div className="rca-completion-cta-actions">
            <button
              type="button"
              className="rca-btn-new-analysis"
              onClick={handleStartNewAnalysis}
            >
              {translate("btn_new_analysis")}
            </button>
            <button
              type="button"
              className="rca-btn-secondary-action"
              onClick={() => setTab("reports")}
            >
              {translate("hitl_open_reports_tab")}
            </button>
          </div>
        </div>
      ) : null}
      </div>

      <main
        className={`main-content${
          activeTab === "reports"
            ? " main-content--reports-tab"
            : activeTab === "guide"
              ? " main-content--guide-tab"
              : activeTab === "chat"
                ? " main-content--chat-tab"
                : ""
        }`}
      >
        {formSubmitInfo && !LIBRARY_TABS.has(activeTab) && activeTab !== "chat" && (
          <div className="info-banner" style={{ marginBottom: "16px" }}>
            <div className="info-banner-icon">AI</div>
            <div className="info-banner-content">
              <h2>{selectedLanguage === "tr" ? "İşlem durumu" : "Processing status"}</h2>
              <p>{formSubmitInfo}</p>
              {isSubmittingForm && (
                <div style={{ marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={handleCancelSubmit}
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {selectedLanguage === "tr" ? "Analizi İptal Et" : "Cancel analysis"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {formSubmitError && !LIBRARY_TABS.has(activeTab) && (
          <div className="info-banner" style={{ marginBottom: "16px", borderColor: "#ef4444" }}>
            <div className="info-banner-icon">!</div>
            <div className="info-banner-content">
              <h2>Gonderim Hatasi</h2>
              <p>{formSubmitError}</p>
            </div>
          </div>
        )}
        {activeTab === "form" && (
          <IncidentForm
            key={formResetKey}
            language={selectedLanguage}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmittingForm}
            activeSubmitMode={activeSubmitMode}
            seedSnapshot={formDraftSeed}
            onSeedConsumed={() => setFormDraftSeed(null)}
            onSaveDraft={handlePersistDraft}
            tokensBlocked={tokensBlocked}
            interactiveEnabled={INTERACTIVE_ANALYSIS_ENABLED}
          />
        )}
        {activeTab === "chat" && (
          <ChatInterface
            language={selectedLanguage}
            hitlSeed={hitlSeed}
            onPipelineStatusChange={setChatPipelineStatus}
            onHitlFlowComplete={handleHitlFlowComplete}
            onStartNewAnalysis={handleStartNewAnalysis}
            onAnalysisComplete={handleAnalysisComplete}
            onSaveReport={handleSaveToReports}
            onGoToReportsTab={() => setTab("reports")}
            onGoToFormTab={() => setTab("form")}
          />
        )}
        {activeTab === "reports" && (
          <SavedReportsPanel
            language={selectedLanguage}
            onEditDraft={handleLoadDraftEntry}
            onOpenReport={handleOpenReportEntry}
            onOpenGuideTab={() => setTab("guide")}
          />
        )}
        {activeTab === "guide" && <ReportGuideVideoPanel language={selectedLanguage} />}
      </main>

    </div>
  );
}
