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
      alert("Lütfen en az Olay Açıklaması, Konum ve Tarih/Saat alanlarını doldurunuz!");
      return;
    }

    setLoading(true);
    setResult(null);

    const data = await analyzeRootCause({
      incident_description: incidentDescription,
      location,
      date_time: dateTime,
      witnesses,
    });

    setResult(data);
    setLoading(false);

    // Başarılıysa formu temizle
    if (data.status === "success") {
      setIncidentDescription("");
      setLocation("");
      setDateTime("");
      setWitnesses("");
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

      {/* Sonuç Mesajı */}
      {result && (
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
};
