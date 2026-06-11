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
  prewarmBackend,
  runPipelineJobWithPolling,
  resumePipelineJobForIncident,
  generatePDFReport,
} from "../services/hsg245Api";
import ReportProgressBanner from "./components/ReportProgressBanner";
import { buildHowHappenedText, buildInvestigationPayload } from "./utils/investigationPayload";
import { createSmoothPipelineProgress } from "./utils/pipelineProgressSmooth";
import {
  clearPipelineJob,
  loadPipelineJob,
  savePipelineJob,
} from "./utils/pipelineJobStorage";
import {
  getReportPhaseLabel,
  getStageLabel,
  mapPipelineToOverallPct,
} from "./utils/reportProgressLabels";
import { fetchUsageSummary, formatToken } from "../services/usageApi";
import "./RcaFrontendHub.css";
import "./rcaEmbedLayout.css";

const TAB_KEYS = ["form", "chat", "reports", "guide"];
const LIBRARY_TABS = new Set(["reports", "guide"]);
/** Test aşamasında etkileşimli analiz kapalı; yalnızca doğrudan rapor oluşturma. */
const INTERACTIVE_ANALYSIS_ENABLED = false;

function isResumablePipelineError(error) {
  if (error?.name === "AbortError") return false;
  const msg = String(error?.message || "").toLowerCase();
  return (
    msg.includes("504")
    || msg.includes("502")
    || msg.includes("503")
    || msg.includes("timeout")
    || msg.includes("zaman aşım")
    || msg.includes("fetch failed")
    || msg.includes("network")
    || msg.includes("failed to fetch")
  );
}

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
  const [reportProgress, setReportProgress] = useState(null);
  const smoothProgressRef = useRef(null);
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
  const pendingPipelineJobRef = useRef(null);
  const lastReportFormRef = useRef(null);
  /** React state gecikmesi olmadan HITL oturumu (setTab ?tab=chat senkron kontrolü) */
  const hitlSeedRef = useRef(null);
  const [pipelineResumeOffer, setPipelineResumeOffer] = useState(null);

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

  useEffect(() => {
    const saved = loadPipelineJob();
    if (saved?.jobId && saved?.incidentId) {
      setPipelineResumeOffer(saved);
      setCreatedIncidentId(saved.incidentId);
      setFormSubmitError(
        selectedLanguage === "tr"
          ? "Önceki analiz yarım kalmış olabilir. «Devam Et» ile kaldığınız yerden sürdürebilirsiniz."
          : "A previous analysis may still be running. Use «Continue» to resume.",
      );
    }
  }, [selectedLanguage]);
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

  const clearReportProgress = useCallback(() => {
    smoothProgressRef.current?.stop();
    smoothProgressRef.current = null;
    setReportProgress(null);
  }, []);

  const setReportProgressStep = useCallback((pct, label, stage = "") => {
    const clamped = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
    setReportProgress({ pct: clamped, label, stage });
    setFormSubmitInfo(label);
  }, []);

  const attachPipelineProgress = useCallback((controller) => {
    smoothProgressRef.current = createSmoothPipelineProgress({
      onTick: (displayPct, stage) => {
        const overall = mapPipelineToOverallPct(displayPct);
        setReportProgressStep(
          overall,
          getStageLabel(selectedLanguage, stage, overall),
          stage,
        );
      },
    });
    return {
      onUpdate: (job) => {
        smoothProgressRef.current?.update(job);
      },
      onJobStarted: (jobId, incidentId) => {
        pendingPipelineJobRef.current = { jobId, incidentId };
        savePipelineJob({ jobId, incidentId });
        setPipelineResumeOffer(null);
      },
      signal: controller.signal,
    };
  }, [selectedLanguage, setReportProgressStep]);

  const finalizeReportAfterPipeline = useCallback(async (incidentId, controller) => {
    setReportProgressStep(90, getReportPhaseLabel(selectedLanguage, "report_html", 90), "report_html");
    await generatePDFReport(incidentId, { signal: controller.signal });
    setReportProgressStep(
      100,
      getReportPhaseLabel(selectedLanguage, "report_done", 100),
      "completed",
    );
    pendingPipelineJobRef.current = null;
    clearPipelineJob();
    setPipelineResumeOffer(null);
  }, [selectedLanguage, setReportProgressStep]);

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
    setFormSubmitInfo("");
    setActiveSubmitMode(mode);
    hitlSeedRef.current = null;
    setHitlSeed(null);
    if (mode === "report") {
      clearReportProgress();
      setReportProgressStep(1, getReportPhaseLabel(selectedLanguage, "prewarm", 1), "prewarm");
      lastReportFormRef.current = formData;
      pendingPipelineJobRef.current = null;
      setPipelineResumeOffer(null);
    } else {
      clearReportProgress();
      setFormSubmitInfo(
        "Kayit hazirlaniyor (sunucu uyaniyorsa birkaç saniye surebilir)...",
      );
    }
    setCreatedIncidentId("");

    try {
      const description = buildHowHappenedText(formData, selectedLanguage);
      if (!String(description || "").trim()) {
        throw new Error(
          selectedLanguage === "tr"
            ? "Olay açıklaması zorunludur. «Olay Tanımı» bölümünü doldurun veya test senaryosu yükleyin."
            : "Incident description is required. Fill in the incident description or load a test scenario.",
        );
      }
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

      setReportProgressStep(3, getReportPhaseLabel(selectedLanguage, "prewarm", 3), "prewarm");
      await prewarmBackend({
        signal: controller.signal,
        onAttempt: (attempt, total) => {
          const pct = Math.min(10, 3 + Math.round((attempt / Math.max(total, 1)) * 7));
          setReportProgressStep(
            pct,
            selectedLanguage === "tr"
              ? `Sunucu bağlantısı kontrol ediliyor (${attempt}/${total}) (${pct}%)`
              : `Checking server connection (${attempt}/${total}) (${pct}%)`,
            "prewarm",
          );
        },
      });

      setReportProgressStep(11, getReportPhaseLabel(selectedLanguage, "bootstrap", 11), "bootstrap");
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

      setReportProgressStep(
        12,
        getReportPhaseLabel(selectedLanguage, "pipeline_start", 12),
        "queued",
      );

      const pipelineOpts = attachPipelineProgress(controller);
      const pipelineResult = await runPipelineJobWithPolling(
        incidentId,
        buildInvestigationPayload(formData, "", selectedLanguage),
        pipelineOpts,
      );

      smoothProgressRef.current?.finish(true);

      if (!pipelineResult?.data && !pipelineResult?.job?.result) {
        throw new Error("Pipeline tamamlandi ancak sonuc donmedi.");
      }

      await finalizeReportAfterPipeline(incidentId, controller);
    } catch (error) {
      const pendingJob = pendingPipelineJobRef.current;
      if (error?.name === "AbortError") {
        clearReportProgress();
        const cancelled = getReportPhaseLabel(selectedLanguage, "cancelled", 0);
        setFormSubmitInfo(cancelled);
        setFormSubmitError("");
      } else if (pendingJob?.jobId && isResumablePipelineError(error)) {
        setPipelineResumeOffer(pendingJob);
        setFormSubmitError(
          selectedLanguage === "tr"
            ? `${error?.message || "Bağlantı kesildi."} Analiz arka planda devam ediyor olabilir — «Devam Et» ile sürdürün.`
            : `${error?.message || "Connection lost."} Analysis may still be running in the background — use «Continue».`,
        );
      } else {
        clearReportProgress();
        pendingPipelineJobRef.current = null;
        clearPipelineJob();
        setPipelineResumeOffer(null);
        setFormSubmitError(error?.message || "Form gonderimi sirasinda bilinmeyen bir hata olustu.");
        setFormSubmitInfo("");
      }
    } finally {
      submitAbortRef.current = null;
      setIsSubmittingForm(false);
      setActiveSubmitMode(null);
    }
  };

  const handleResumeReport = async () => {
    const offer = pipelineResumeOffer || pendingPipelineJobRef.current || loadPipelineJob();
    if (!offer?.incidentId || isSubmittingForm) return;

    const controller = new AbortController();
    submitAbortRef.current = controller;
    setIsSubmittingForm(true);
    setFormSubmitError("");
    setActiveSubmitMode("report");
    setCreatedIncidentId(offer.incidentId);
    setReportProgressStep(
      12,
      selectedLanguage === "tr"
        ? "Analiz durumu kontrol ediliyor…"
        : "Checking analysis status…",
      "queued",
    );

    try {
      const pipelineOpts = attachPipelineProgress(controller);
      const pipelineResult = await resumePipelineJobForIncident(offer.incidentId, {
        ...pipelineOpts,
        jobId: offer.jobId,
      });

      smoothProgressRef.current?.finish(true);

      if (!pipelineResult?.data && !pipelineResult?.job?.result) {
        throw new Error("Pipeline tamamlandi ancak sonuc donmedi.");
      }

      await finalizeReportAfterPipeline(offer.incidentId, controller);
    } catch (error) {
      const pendingJob = pendingPipelineJobRef.current || offer;
      if (error?.name === "AbortError") {
        clearReportProgress();
        setFormSubmitInfo(getReportPhaseLabel(selectedLanguage, "cancelled", 0));
        setFormSubmitError("");
      } else if (pendingJob?.jobId && isResumablePipelineError(error)) {
        setPipelineResumeOffer(pendingJob);
        setFormSubmitError(
          selectedLanguage === "tr"
            ? `${error?.message || "Bağlantı kesildi."} «Devam Et» ile tekrar deneyin.`
            : `${error?.message || "Connection lost."} Try «Continue» again.`,
        );
      } else {
        clearReportProgress();
        setFormSubmitError(error?.message || "Devam islemi basarisiz oldu.");
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
    clearReportProgress();
    pendingPipelineJobRef.current = null;
    clearPipelineJob();
    setPipelineResumeOffer(null);
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
        {reportProgress && !LIBRARY_TABS.has(activeTab) && activeTab !== "chat" ? (
          <ReportProgressBanner
            progress={reportProgress}
            isSubmitting={isSubmittingForm}
            language={selectedLanguage}
            onCancel={handleCancelSubmit}
          />
        ) : formSubmitInfo && !LIBRARY_TABS.has(activeTab) && activeTab !== "chat" ? (
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
        ) : null}
        {formSubmitError && !LIBRARY_TABS.has(activeTab) && (
          <div className="info-banner" style={{ marginBottom: "16px", borderColor: "#ef4444" }}>
            <div className="info-banner-icon">!</div>
            <div className="info-banner-content">
              <h2>{selectedLanguage === "tr" ? "Gönderim Hatası" : "Submission error"}</h2>
              <p>{formSubmitError}</p>
              {pipelineResumeOffer?.incidentId && !isSubmittingForm && (
                <div style={{ marginTop: "12px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="report-progress-resume"
                    onClick={handleResumeReport}
                  >
                    {selectedLanguage === "tr" ? "Devam Et" : "Continue"}
                  </button>
                  <button
                    type="button"
                    className="report-progress-dismiss"
                    onClick={() => {
                      clearPipelineJob();
                      pendingPipelineJobRef.current = null;
                      setPipelineResumeOffer(null);
                      setFormSubmitError("");
                    }}
                  >
                    {selectedLanguage === "tr" ? "Yeni Analiz Başlat" : "Start new analysis"}
                  </button>
                </div>
              )}
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
