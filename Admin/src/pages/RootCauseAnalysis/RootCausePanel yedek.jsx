import React, { useState, useEffect } from "react";
import { analyzeRootCause, checkHealth } from "../../services/agentApi";

/**
 * Root Cause Analysis Panel
 * Admin panelinde kaza/olay kök neden analizi için
 */
export default function RootCausePanel() {
  const [incidentDescription, setIncidentDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [witnesses, setWitnesses] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState("checking");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");

  // Sunucu durumunu kontrol et
  useEffect(() => {
    const checkServer = async () => {
      const health = await checkHealth();
      setServerStatus(health.status === "healthy" ? "online" : "offline");
    };
    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, []);

  // Root Cause Analysis başlat
  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (!incidentDescription || !location || !dateTime) {
      alert("Please fill at least Incident Description, Location and Date/Time fields!");
      return;
    }

    setLoading(true);
    setResult(null);
    setAnalysisResult(null);
    setError("");

    try {
      const data = await analyzeRootCause({
        incident_description: incidentDescription,
        location,
        date_time: dateTime,
        witnesses,
      });

      setAnalysisResult(data);
      setResult(data);
      setLoading(false);

      // Clear form if successful
      if (data.status === "success") {
        setIncidentDescription("");
        setLocation("");
        setDateTime("");
        setWitnesses("");
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>🔍 Root Cause Analysis Panel</h2>
        <div style={styles.statusBadge}>
          Status: <span style={styles[`status_${serverStatus}`]}>{serverStatus}</span>
        </div>
      </div>

      <form onSubmit={handleAnalyze} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="incidentDescription" style={styles.label}>
            Olay Açıklaması: *
          </label>
          <textarea
            id="incidentDescription"
            placeholder="Kaza veya olayın detaylı açıklamasını yazınız..."
            value={incidentDescription}
            onChange={(e) => setIncidentDescription(e.target.value)}
            style={styles.textarea}
            disabled={loading || serverStatus === "offline"}
            rows={4}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="location" style={styles.label}>
            Konum: *
          </label>
          <input
            id="location"
            type="text"
            placeholder="Olayın gerçekleştiği yer"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={styles.input}
            disabled={loading || serverStatus === "offline"}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="dateTime" style={styles.label}>
            Tarih/Saat: *
          </label>
          <input
            id="dateTime"
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            style={styles.input}
            disabled={loading || serverStatus === "offline"}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="witnesses" style={styles.label}>
            Tanıklar: (Opsiyonel)
          </label>
          <textarea
            id="witnesses"
            placeholder="Tanık isimleri ve ifadeleri..."
            value={witnesses}
            onChange={(e) => setWitnesses(e.target.value)}
            style={styles.textarea}
            disabled={loading || serverStatus === "offline"}
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={loading || serverStatus === "offline"}
          style={styles[loading || serverStatus === "offline" ? "buttonDisabled" : "button"]}
        >
          {loading ? "⏳ Analiz Ediliyor..." : "🔍 Kök Neden Analizi Başlat"}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div style={styles.errorMessage}>
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && analysisResult.status === "success" && (
        <div style={styles.resultsContainer}>
          <h3 style={styles.resultsTitle}>📊 HSG245 Analysis Results</h3>
          
          {/* Part 1: Overview */}
          <div style={styles.resultSection}>
            <h4 style={styles.sectionTitle}>🔍 Part 1: Initial Overview</h4>
            <div style={styles.resultContent}>
              <p><strong>Incident Type:</strong> {analysisResult.part1_overview?.incident_type || 'N/A'}</p>
              <p><strong>Date/Time:</strong> {analysisResult.part1_overview?.date_time || 'N/A'}</p>
              <p><strong>Location:</strong> {analysisResult.part1_overview?.location || 'N/A'}</p>
              {analysisResult.part1_overview?.brief_details && (
                <div>
                  <p><strong>What:</strong> {analysisResult.part1_overview.brief_details.what}</p>
                  <p><strong>Where:</strong> {analysisResult.part1_overview.brief_details.where}</p>
                  <p><strong>Who:</strong> {analysisResult.part1_overview.brief_details.who}</p>
                </div>
              )}
            </div>
          </div>

          {/* Part 2: Assessment */}
          <div style={styles.resultSection}>
            <h4 style={styles.sectionTitle}>📊 Part 2: Assessment</h4>
            <div style={styles.resultContent}>
              <p><strong>Event Type:</strong> {analysisResult.part2_assessment?.type_of_event || 'N/A'}</p>
              <p><strong>Severity:</strong> {analysisResult.part2_assessment?.actual_potential_harm || 'N/A'}</p>
              <p><strong>RIDDOR Reportable:</strong> {analysisResult.part2_assessment?.riddor_reportable || 'N/A'}</p>
              <p><strong>Investigation Level:</strong> {analysisResult.part2_assessment?.investigation_level || 'N/A'}</p>
              <p><strong>Priority:</strong> {analysisResult.part2_assessment?.priority || 'N/A'}</p>
              {analysisResult.part2_assessment?.riddor_reasoning && (
                <p><strong>RIDDOR Reasoning:</strong> {analysisResult.part2_assessment.riddor_reasoning}</p>
              )}
            </div>
          </div>

          {/* Part 3: Investigation */}
          {analysisResult.part3_investigation && (
            <div style={styles.resultSection}>
              <h4 style={styles.sectionTitle}>🔬 Part 3: Root Cause Investigation</h4>
              <div style={styles.resultContent}>
                {analysisResult.part3_investigation.immediate_causes && (
                  <div style={styles.causesList}>
                    <strong>Immediate Causes:</strong>
                    <ul>
                      {analysisResult.part3_investigation.immediate_causes.map((cause, i) => (
                        <li key={i}>{cause}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysisResult.part3_investigation.underlying_causes && (
                  <div style={styles.causesList}>
                    <strong>Underlying Causes:</strong>
                    <ul>
                      {analysisResult.part3_investigation.underlying_causes.map((cause, i) => (
                        <li key={i}>{cause}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysisResult.part3_investigation.root_causes && (
                  <div style={styles.causesList}>
                    <strong>Root Causes:</strong>
                    <ul>
                      {analysisResult.part3_investigation.root_causes.map((cause, i) => (
                        <li key={i}>{cause}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Part 4: Recommendations */}
          {analysisResult.part4_recommendations && (
            <div style={styles.resultSection}>
              <h4 style={styles.sectionTitle}>💡 Part 4: Recommendations</h4>
              <div style={styles.resultContent}>
                {analysisResult.part4_recommendations.immediate_actions && (
                  <div style={styles.actionsList}>
                    <strong>⚡ Immediate Actions:</strong>
                    <ul>
                      {analysisResult.part4_recommendations.immediate_actions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysisResult.part4_recommendations.short_term_actions && (
                  <div style={styles.actionsList}>
                    <strong>📅 Short-term Actions:</strong>
                    <ul>
                      {analysisResult.part4_recommendations.short_term_actions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysisResult.part4_recommendations.long_term_actions && (
                  <div style={styles.actionsList}>
                    <strong>🎯 Long-term Actions:</strong>
                    <ul>
                      {analysisResult.part4_recommendations.long_term_actions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <p style={styles.timestamp}>
            <small>Analysis completed: {new Date(analysisResult.timestamp).toLocaleString()}</small>
          </p>
        </div>
      )}

      {/* Sonuç Mesajı (Legacy - eski format için) */}
      {result && !analysisResult && (
        <div
          style={styles[result.status === "success" ? "successMessage" : "errorMessage"]}
        >
          <h3>{result.status === "success" ? "✅ Analiz Tamamlandı" : "❌ Hata"}</h3>
          
          {result.status === "success" && result.analysis ? (
            <>
              <div style={styles.analysisSection}>
                <h4>📋 Rapor ID:</h4>
                <p>{result.report_id}</p>
              </div>

              <div style={styles.analysisSection}>
                <h4>🔍 Kök Nedenler:</h4>
                <p style={styles.analysisText}>{result.analysis.root_causes || "Analiz ediliyor..."}</p>
              </div>

              <div style={styles.analysisSection}>
                <h4>💡 Öneriler:</h4>
                <p style={styles.analysisText}>{result.analysis.recommendations || "Öneriler hazırlanıyor..."}</p>
              </div>

              <div style={styles.analysisSection}>
                <h4>⚡ Acil Aksiyonlar:</h4>
                <p style={styles.analysisText}>{result.analysis.immediate_actions || "Aksiyonlar belirleniyor..."}</p>
              </div>
            </>
          ) : (
            <p><strong>Mesaj:</strong> {result.message}</p>
          )}

          <p style={styles.timestamp}>
            <small>{new Date(result.timestamp).toLocaleString("tr-TR")}</small>
          </p>
        </div>
      )}

      {/* Sunucu Çevrimdışı Uyarısı */}
      {serverStatus === "offline" && (
        <div style={styles.offlineWarning}>
          <p>
            ⚠️ <strong>Sunucu çevrimdışı!</strong> Lütfen FastAPI sunucusunun çalıştığından
            emin olunuz:
          </p>
          <code style={styles.code}>python /path/to/api_server.py</code>
        </div>
      )}
    </div>
  );
}

// Stil Objesi
const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "2px solid #dc3545",
    paddingBottom: "10px",
  },
  statusBadge: {
    padding: "8px 12px",
    borderRadius: "20px",
    backgroundColor: "#f0f0f0",
    fontSize: "12px",
    fontWeight: "bold",
  },
  status_online: {
    color: "#28a745",
    marginLeft: "5px",
  },
  status_offline: {
    color: "#dc3545",
    marginLeft: "5px",
  },
  form: {
    marginBottom: "20px",
  },
  formGroup: {
    marginBottom: "15px",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ddd",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ddd",
    fontSize: "14px",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
    resize: "vertical",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  buttonDisabled: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#ccc",
    color: "#666",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "not-allowed",
  },
  successMessage: {
    padding: "15px",
    backgroundColor: "#d4edda",
    color: "#155724",
    border: "1px solid #c3e6cb",
    borderRadius: "5px",
    marginTop: "20px",
  },
  errorMessage: {
    padding: "15px",
    backgroundColor: "#f8d7da",
    color: "#721c24",
    border: "1px solid #f5c6cb",
    borderRadius: "5px",
    marginTop: "20px",
  },
  analysisSection: {
    marginTop: "15px",
    padding: "10px",
    backgroundColor: "#f8f9fa",
    borderRadius: "5px",
  },
  analysisText: {
    whiteSpace: "pre-wrap",
    lineHeight: "1.6",
  },
  timestamp: {
    color: "#666",
    marginTop: "10px",
  },
  offlineWarning: {
    padding: "15px",
    backgroundColor: "#fff3cd",
    color: "#856404",
    border: "1px solid #ffeaa7",
    borderRadius: "5px",
    marginTop: "20px",
  },
  code: {
    display: "block",
    backgroundColor: "#f0f0f0",
    padding: "10px",
    borderRadius: "3px",
    marginTop: "10px",
    fontFamily: "monospace",
    fontSize: "12px",
    overflow: "auto",
  },
  // New styles for HSG245 results
  resultsContainer: {
    marginTop: "30px",
    padding: "20px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    border: "1px solid #dee2e6",
  },
  resultsTitle: {
    color: "#2c3e50",
    marginBottom: "20px",
    paddingBottom: "10px",
    borderBottom: "2px solid #3498db",
  },
  resultSection: {
    marginBottom: "20px",
    padding: "15px",
    backgroundColor: "white",
    borderRadius: "6px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    color: "#34495e",
    marginBottom: "12px",
    fontSize: "16px",
  },
  resultContent: {
    fontSize: "14px",
    lineHeight: "1.6",
  },
  causesList: {
    marginBottom: "15px",
  },
  actionsList: {
    marginBottom: "15px",
  },
};
