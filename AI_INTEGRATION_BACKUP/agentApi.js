/**
 * Agent API Service
 * Connects to Vercel Serverless Functions for AI analysis
 */

// Use relative path for Vercel serverless functions
// In production: /api/analyze
// In development: http://localhost:5173/api/analyze (Vite proxy)
const API_BASE = "/api";

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

/**
 * Root Cause Analysis - HSG245
 * Performs comprehensive incident investigation using AI
 * 
 * @param {Object} incidentData - Incident information from form
 * @param {string} incidentData.incident_description - What happened
 * @param {string} incidentData.location - Where it happened
 * @param {string} incidentData.date_time - When it happened
 * @param {string} incidentData.injured_person - Who was involved
 * @param {string} incidentData.severity - Severity level
 * @param {string} incidentData.witnesses - Witness information (optional)
 * @param {string} incidentData.immediate_actions - Actions taken (optional)
 * 
 * @returns {Promise<Object>} HSG245 analysis results
 * @returns {string} return.status - 'success' or 'error'
 * @returns {Object} return.part1_overview - Initial overview
 * @returns {Object} return.part2_assessment - Risk assessment
 * @returns {Object} return.part3_investigation - Root cause analysis
 * @returns {Object} return.part4_recommendations - Action plan
 */
export const analyzeRootCause = async (incidentData) => {
  try {
    console.log('📤 Sending incident data to AI:', incidentData);
    
    const response = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(incidentData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Analysis completed:', result);
    
    return result;
    
  } catch (error) {
    console.error("❌ Root cause analysis error:", error);
    throw new Error(error.message || "Failed to perform analysis");
  }
};

/**
 * Health Check - Check if API is running
 * @returns {Promise<Object>} API health status
 */
export const checkAPIHealth = async () => {
  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error('API not responding');
    }

    const result = await response.json();
    console.log('✅ API Health:', result);
    
    return result;
    
  } catch (error) {
    console.error("❌ API health check failed:", error);
    return { 
      status: "offline",
      message: error.message 
    };
  }
};

export default {
  sendEmail,
  checkHealth,
  testAPI,
  analyzeRootCause,
  checkAPIHealth,
};
