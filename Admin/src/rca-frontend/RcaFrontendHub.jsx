import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, FolderOpen } from "lucide-react";
import ChatInterface from "./components/ChatInterface";
import IncidentForm from "./components/IncidentForm";
import SavedReportsPanel from "./components/SavedReportsPanel";
import Header from "./components/Header";
import { getTranslation } from "./utils/translations";
import { upsertDraftReport } from "./utils/draftReportsStorage";
import {
  createIncident,
  addAssessment,
  investigateIncident,
  generateActionPlan,
  generatePDFReport,
} from "../services/hsg245Api";
import { buildHowHappenedText, buildInvestigationPayload } from "./utils/investigationPayload";
import "./RcaFrontendHub.css";
import "./rcaEmbedLayout.css";

const TAB_KEYS = ["form", "chat", "reports"];

/**
 * Kök Neden araçları: Manuel form + Etkileşimli analiz (?tab=form|chat|reports).
 * Eski ?tab=smart bağlantıları form sekmesine yönlendirilir.
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
  const submitAbortRef = useRef(null);

  const syncTabFromUrl = useCallback(() => {
    const raw = searchParams.get("tab");
    if (raw === "smart") {
      setSearchParams({ tab: "form" }, { replace: true });
      return;
    }
    if (raw && TAB_KEYS.includes(raw)) {
      setActiveTab(raw);
    } else {
      setActiveTab("form");
    }
  }, [navigate, searchParams, setSearchParams]);

  useEffect(() => {
    syncTabFromUrl();
  }, [syncTabFromUrl]);

  const translate = (key) => getTranslation(selectedLanguage, key);
  const subtitleText = translate("subtitle").replace(/^HSG245 v2\.0\s*-\s*/i, "");

  const setTab = (tab) => {
    if (!TAB_KEYS.includes(tab)) return;
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

    const controller = new AbortController();
    submitAbortRef.current = controller;
    setIsSubmittingForm(true);
    setFormSubmitError("");
    setActiveSubmitMode(mode);
    setHitlSeed(null);
    setFormSubmitInfo(
      mode === "interactive"
        ? "Kayit ve degerlendirme (HITL oncesi)..."
        : "Ajan pipeline ve PDF rapor baslatiliyor...",
    );
    setCreatedIncidentId("");

    try {
      const description = buildHowHappenedText(formData, selectedLanguage);
      const dateTime = `${formData.incidentDate || ""}T${formData.incidentTime || ""}`.replace(/T$/, "");

      const part1Result = await createIncident({
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
      }, { signal: controller.signal });

      const incidentId = part1Result?.data?.incident_id;
      if (!incidentId) {
        throw new Error("Incident ID donmedi.");
      }
      setCreatedIncidentId(incidentId);
      setFormSubmitInfo(`Incident olusturuldu (${incidentId}). Assessment calisiyor...`);

      await addAssessment(incidentId, {
        event_type: mapEventCategoryToEventType(formData.eventCategory),
        actual_harm: mapInjurySeverityToActualHarm(formData.injurySeverity),
        riddor_reportable: mapInjurySeverityToRiddor(formData.injurySeverity),
      }, { signal: controller.signal });

      if (mode === "interactive") {
        setFormSubmitInfo(
          `Hazir: ${incidentId}. Etkilesimli analiz sekmesinde HITL sorulari ve kok neden akisi basliyor.`,
        );
        setChatPipelineStatus("");
        setHitlSeed({ incidentId, formData });
        setTab("chat");
        return;
      }

      setFormSubmitInfo("Assessment tamamlandi. Kök neden analizi calisiyor...");

      await investigateIncident(
        incidentId,
        buildInvestigationPayload(formData, "", selectedLanguage),
        { signal: controller.signal },
      );

      setFormSubmitInfo("Root cause analizi tamamlandi. Aksiyon plani uretiliyor...");

      await generateActionPlan(incidentId, { signal: controller.signal });

      setFormSubmitInfo("PDF rapor indiriliyor...");
      await generatePDFReport(incidentId, { signal: controller.signal });

      setFormSubmitInfo(
        `Tamamlandi. Incident ID: ${incidentId}. PDF indirildi. İsterseniz Etkilesimli Analiz sekmesinden ek soru-cevap yapabilirsiniz.`,
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
    setHitlSeed(null);
    setChatPipelineStatus("");
  };

  const handlePersistDraft = useCallback(
    (formData) => {
      const entry = upsertDraftReport(formData, "", activeDraftId);
      setActiveDraftId(entry.id);
      setFormSubmitError("");
      setFormSubmitInfo(translate("draft_saved_toast"));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("deepwhy-drafts-changed"));
      }
    },
    [activeDraftId, translate],
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

  const handleThemeToggle = () => {
    setIsLightMode((prev) => !prev);
  };

  const hubClassName = `app rca-frontend-hub${showAdminReturn ? " fullscreen-mode" : ""}${isLightMode ? " light-mode" : " theme-dark"}`;

  return (
    <div className={hubClassName}>
      <Header
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        showAdminReturn={showAdminReturn}
        onAdminReturn={() => navigate("/dashboard")}
        isLightMode={isLightMode}
        onThemeToggle={handleThemeToggle}
      />

      <div className="tab-navigation">
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
        <button
          type="button"
          className={`tab-btn ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setTab("chat")}
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
      </div>

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

      <main className="main-content">
        {formSubmitInfo && activeTab !== "reports" && (
          <div className="info-banner" style={{ marginBottom: "16px" }}>
            <div className="info-banner-icon">AI</div>
            <div className="info-banner-content">
              <h2>Agent Pipeline</h2>
              <p>{formSubmitInfo}</p>
              {activeTab === "chat" && chatPipelineStatus && <p><strong>Canli Durum:</strong> {chatPipelineStatus}</p>}
              {createdIncidentId && <p><strong>Incident ID:</strong> {createdIncidentId}</p>}
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
                    Analizi İptal Et
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {formSubmitError && activeTab !== "reports" && (
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
            language={selectedLanguage}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmittingForm}
            activeSubmitMode={activeSubmitMode}
            seedSnapshot={formDraftSeed}
            onSeedConsumed={() => setFormDraftSeed(null)}
            onSaveDraft={handlePersistDraft}
          />
        )}
        {activeTab === "chat" && (
          <ChatInterface
            language={selectedLanguage}
            hitlSeed={hitlSeed}
            onPipelineStatusChange={setChatPipelineStatus}
            onHitlFlowComplete={handleHitlFlowComplete}
          />
        )}
        {activeTab === "reports" && (
          <SavedReportsPanel
            language={selectedLanguage}
            onEditDraft={handleLoadDraftEntry}
          />
        )}
      </main>

    </div>
  );
}
