import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import ChatInterface from "./components/ChatInterface";
import IncidentForm from "./components/IncidentForm";
import SmartQuestionnaire_V2 from "./components/SmartQuestionnaire_V2";
import Header from "./components/Header";
import { getTranslation } from "./utils/translations";
import "./RcaFrontendHub.css";

const TAB_KEYS = ["chat", "form", "smart"];

/**
 * Vite frontend (App.jsx) ile aynı sekme yapısı — Kök Neden menüsünden açılır.
 * ?tab=chat|form|smart
 */
export default function RcaFrontendHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedLanguage, setSelectedLanguage] = useState("tr");

  const syncTabFromUrl = useCallback(() => {
    const raw = searchParams.get("tab");
    if (raw && TAB_KEYS.includes(raw)) {
      setActiveTab(raw);
    }
  }, [searchParams]);

  useEffect(() => {
    syncTabFromUrl();
  }, [syncTabFromUrl]);

  const translate = (key) => getTranslation(selectedLanguage, key);

  const setTab = (tab) => {
    if (!TAB_KEYS.includes(tab)) return;
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  const handleFormSubmit = (formData) => {
    console.log("Form submitted:", formData);
    setTab("chat");
  };

  const handleSmartQuestionnaireComplete = (data) => {
    console.log("Smart Questionnaire completed:", data);
    setTab("chat");
  };

  return (
    <div className="app rca-frontend-hub">
      <Header
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />

      <div className="tab-navigation">
        <button
          type="button"
          className={`tab-btn ${activeTab === "smart" ? "active" : ""}`}
          onClick={() => setTab("smart")}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{translate("smart_form_v2")}</span>
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
        <button
          type="button"
          className={`tab-btn ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setTab("chat")}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span>{translate("interactive_analysis")}</span>
        </button>
      </div>

      <div className="info-banner">
        <div className="info-banner-icon">RCA</div>
        <div className="info-banner-content">
          <h2>{translate("root_cause_analysis")}</h2>
          <p>{translate("subtitle")}</p>
        </div>
      </div>

      <main className="main-content">
        {activeTab === "smart" ? (
          <SmartQuestionnaire_V2
            language={selectedLanguage}
            onComplete={handleSmartQuestionnaireComplete}
          />
        ) : activeTab === "form" ? (
          <IncidentForm language={selectedLanguage} onSubmit={handleFormSubmit} />
        ) : (
          <ChatInterface language={selectedLanguage} />
        )}
      </main>
    </div>
  );
}
