import React, { useState, useEffect } from "react";
import { sendEmail, checkHealth } from "../services/agentApi";

/**
 * Email Automation Panel
 * Admin panelinde email gönderme işlemleri için
 */
export default function EmailPanel() {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
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
    const interval = setInterval(checkServer, 5000); // Her 5 saniyede bir kontrol et
    return () => clearInterval(interval);
  }, []);

  // Email gönder
  const handleSendEmail = async (e) => {
    e.preventDefault();

    if (!recipient || !subject || !body) {
      alert("Lütfen tüm alanları doldurunuz!");
      return;
    }

    setLoading(true);
    setResult(null);

    const data = await sendEmail(recipient, subject, body);
    setResult(data);
    setLoading(false);

    // Başarılıysa formu temizle
    if (data.status === "success") {
      setRecipient("");
      setSubject("");
      setBody("");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>📧 Email Automation Panel</h2>
        <div style={styles.statusBadge}>
          Status: <span style={styles[`status_${serverStatus}`]}>{serverStatus}</span>
        </div>
      </div>

      <form onSubmit={handleSendEmail} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="recipient" style={styles.label}>
            Alıcı Email Adresi:
          </label>
          <input
            id="recipient"
            type="email"
            placeholder="ornek@example.com"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            style={styles.input}
            disabled={loading || serverStatus === "offline"}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="subject" style={styles.label}>
            Konu:
          </label>
          <input
            id="subject"
            type="text"
            placeholder="Email konusu"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={styles.input}
            disabled={loading || serverStatus === "offline"}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="body" style={styles.label}>
            Email İçeriği:
          </label>
          <textarea
            id="body"
            placeholder="Email içeriğini yazınız..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={styles.textarea}
            disabled={loading || serverStatus === "offline"}
            rows={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading || serverStatus === "offline"}
          style={styles[loading || serverStatus === "offline" ? "buttonDisabled" : "button"]}
        >
          {loading ? "⏳ Gönderiliyor..." : "📤 Email Gönder"}
        </button>
      </form>

      {/* Sonuç Mesajı */}
      {result && (
        <div
          style={styles[result.status === "success" ? "successMessage" : "errorMessage"]}
        >
          <h3>{result.status === "success" ? "✅ Başarılı" : "❌ Hata"}</h3>
          <p>
            <strong>Mesaj:</strong> {result.message}
          </p>
          <p>
            <strong>Email ID:</strong> {result.email_id}
          </p>
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
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "2px solid #007bff",
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
    backgroundColor: "#007bff",
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
