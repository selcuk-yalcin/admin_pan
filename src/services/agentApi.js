/**
 * Agent API Service
 * Backend FastAPI sunucusu ile iletişim için
 */

const API_BASE = "http://localhost:8000/api";

/**
 * Email gönderme
 * @param {string} recipient - Alıcı email adresi
 * @param {string} subject - Email konusu
 * @param {string} body - Email içeriği
 * @param {string} template_name - Template adı (opsiyonel)
 * @returns {Promise<Object>} API yanıtı
 */
export const sendEmail = async (recipient, subject, body, template_name = "default") => {
  try {
    const res = await fetch(`${API_BASE}/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient,
        subject,
        body,
        template_name,
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Email gönderme hatası:", error);
    return {
      status: "error",
      message: error.message,
      email_id: "N/A",
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Server sağlığını kontrol et
 * @returns {Promise<Object>} Sunucu durumu
 */
export const checkHealth = async () => {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch (error) {
    console.error("Health check hatası:", error);
    return { status: "offline" };
  }
};

/**
 * Test endpoint
 * @param {string} message - Test mesajı
 * @returns {Promise<Object>} API yanıtı
 */
export const testAPI = async (message) => {
  try {
    const res = await fetch(`${API_BASE}/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    return await res.json();
  } catch (error) {
    console.error("Test hatası:", error);
    return { status: "error", message: error.message };
  }
};

export default {
  sendEmail,
  checkHealth,
  testAPI,
};
