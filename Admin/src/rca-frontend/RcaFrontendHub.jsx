import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock } from "lucide-react";
import ChatInterface from "./components/ChatInterface";
import IncidentForm from "./components/IncidentForm";
import Header from "./components/Header";
import { getTranslation } from "./utils/translations";
import {
  createIncident,
  addAssessment,
  investigateIncident,
  generateActionPlan,
} from "../services/hsg245Api";
import "./RcaFrontendHub.css";
import "./rcaEmbedLayout.css";

const TAB_KEYS = ["form", "chat"];

/**
 * Kök Neden araçları: Manuel form + Etkileşimli analiz (?tab=form|chat).
 * Eski ?tab=smart bağlantıları form sekmesine yönlendirilir.
 */
export default function RcaFrontendHub({ showAdminReturn = false }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("form");
  const [selectedLanguage, setSelectedLanguage] = useState("tr");
  const [isLightMode, setIsLightMode] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formSubmitError, setFormSubmitError] = useState("");
  const [formSubmitInfo, setFormSubmitInfo] = useState("");
  const [createdIncidentId, setCreatedIncidentId] = useState("");

  const syncTabFromUrl = useCallback(() => {
    const raw = searchParams.get("tab");
    if (raw === "smart") {
      navigate("/legislation-chatbot", { replace: true });
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

  const buildHowHappenedText = (formData) => {
    const timelineRows = (formData.timeline || [])
      .filter((row) => row?.time || row?.event)
      .map((row) => `- ${row.time || "??:??"}: ${row.event || ""}`)
      .join("\n");

    return [
      formData.incidentDescription || "",
      formData.emergencyMeasures ? `Acil Onlemler: ${formData.emergencyMeasures}` : "",
      timelineRows ? `Olay Kronolojisi:\n${timelineRows}` : "",
      formData.additionalNotes ? `Ek Notlar: ${formData.additionalNotes}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  const handleFormSubmit = async (formData) => {
    if (isSubmittingForm) return;

    setIsSubmittingForm(true);
    setFormSubmitError("");
    setFormSubmitInfo("Ajan pipeline baslatiliyor...");
    setCreatedIncidentId("");

    try {
      const description = buildHowHappenedText(formData);
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
      });

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
      });

      setFormSubmitInfo("Assessment tamamlandi. Kök neden analizi calisiyor...");

      await investigateIncident(incidentId, {
        location: `${formData.location || ""} ${formData.department ? `| ${formData.department}` : ""}`.trim(),
        who_involved: [formData.reportedBy, formData.witnessNames].filter(Boolean).join(" | "),
        how_happened: description,
        activities: [formData.workType, formData.workDuration, formData.shiftTime].filter(Boolean).join(" | "),
        working_conditions: [
          formData.weatherConditions,
          formData.lightingConditions,
          formData.noiseLevel,
          formData.temperature,
        ]
          .filter(Boolean)
          .join(" | "),
        safety_procedures: [
          `FallProtection=${formData.fallProtection || "unknown"}`,
          `Harness=${formData.safetyHarness || "unknown"}`,
          `Training=${formData.safetyTraining || "unknown"}`,
          formData.ppeUsed ? `PPE=${formData.ppeUsed}` : "",
        ]
          .filter(Boolean)
          .join(" | "),
        injuries: [
          formData.injuryType,
          formData.injurySeverity,
          formData.bodyPart,
          formData.medicalTreatment,
          formData.propertyDamage,
        ]
          .filter(Boolean)
          .join(" | "),
      });

      setFormSubmitInfo("Root cause analizi tamamlandi. Aksiyon plani uretiliyor...");

      await generateActionPlan(incidentId);

      setFormSubmitInfo(
        `Pipeline tamamlandi. Incident ID: ${incidentId}. Sonuclar icin Interactive Analysis sekmesine gecildi.`,
      );
      setTab("chat");
    } catch (error) {
      setFormSubmitError(error?.message || "Form gonderimi sirasinda bilinmeyen bir hata olustu.");
      setFormSubmitInfo("");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleThemeToggle = () => {
    setIsLightMode((prev) => !prev);
  };

  const hubClassName = `app rca-frontend-hub${showAdminReturn ? " fullscreen-mode" : ""}${isLightMode ? " light-mode" : ""}`;

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
        {formSubmitInfo && (
          <div className="info-banner" style={{ marginBottom: "16px" }}>
            <div className="info-banner-icon">AI</div>
            <div className="info-banner-content">
              <h2>Agent Pipeline</h2>
              <p>{formSubmitInfo}</p>
              {createdIncidentId && <p><strong>Incident ID:</strong> {createdIncidentId}</p>}
            </div>
          </div>
        )}
        {formSubmitError && (
          <div className="info-banner" style={{ marginBottom: "16px", borderColor: "#ef4444" }}>
            <div className="info-banner-icon">!</div>
            <div className="info-banner-content">
              <h2>Gonderim Hatasi</h2>
              <p>{formSubmitError}</p>
            </div>
          </div>
        )}
        {activeTab === "form" ? (
          <IncidentForm
            language={selectedLanguage}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmittingForm}
          />
        ) : (
          <ChatInterface language={selectedLanguage} />
        )}
      </main>

    </div>
  );
}
