/**
 * Agent API Service
 * Connects to Vercel Serverless Functions for AI analysis
 */

// Use relative path for Vercel serverless functions
// In production: /api/analyze
// In devel    const investigation = await investigationResponse.json();
    console.log('[INVESTIGATION COMPLETED]', investigation);ment: http://localhost:5173/api/analyze (Vite proxy)
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
 * UPDATED: Now uses Railway backend via Vercel proxy
 * 
 * Architecture:
 * Form -> /api/hsg245 (Vercel) -> Railway Backend -> AI Agents
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
 * @returns {Promise<Object>} HSG245 analysis results from Railway AI agents
 */
export const analyzeRootCause = async (incidentData) => {
  try {
    console.log('📤 Sending incident data to Railway AI agents:', incidentData);
    
    // Step 1: Create incident (Overview Agent)
    const createResponse = await fetch(`/api/hsg245`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: 'create_incident',
        data: {
          reported_by: incidentData.injured_person || "User",
          date_time: incidentData.date_time || new Date().toISOString(),
          event_category: "Incident",
          description: incidentData.incident_description,
          injury_description: incidentData.severity || "",
          forwarded_to: ""
        }
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create incident: ${createResponse.status}`);
    }

    const incident = await createResponse.json();
    console.log('[INCIDENT CREATED]', incident);
    
    // Railway response format: {success: true, data: {incident_id: "..."}}
    const incidentId = incident.data?.incident_id || incident.incident_id;
    
    if (!incidentId) {
      throw new Error('No incident_id received from backend');
    }
    
    console.log('[INCIDENT ID]', incidentId);

    // Step 2: Add assessment (Assessment Agent)
    const assessmentResponse = await fetch(`/api/hsg245`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: 'add_assessment',
        data: {
          incident_id: incidentId,
          event_type: "Accident",
          actual_harm: incidentData.severity || "Minor",
          riddor_reportable: "No"
        }
      }),
    });

    const assessment = await assessmentResponse.json();
    console.log('[ASSESSMENT COMPLETED]', assessment);

    // Step 3: Investigate (RootCause Agent)
    const investigateResponse = await fetch(`/api/hsg245`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: 'investigate',
        data: {
          incident_id: incidentId,
          location: incidentData.location || "Not specified",
          who_involved: incidentData.injured_person || "Not specified",
          how_happened: incidentData.incident_description,
          activities: incidentData.witnesses || "",
          working_conditions: "",
          safety_procedures: "",
          injuries: incidentData.severity || ""
        }
      }),
    });

    const investigation = await investigateResponse.json();
    console.log('✅ Investigation completed:', investigation);
    
    // Extract data from Railway response format
    const investigationData = investigation.data || investigation;

    // Step 4: Generate action plan (ActionPlan Agent)
    const actionPlanResponse = await fetch(`/api/hsg245`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: 'generate_action_plan',
        data: {
          incident_id: incidentId
        }
      }),
    });

    const actionPlan = await actionPlanResponse.json();
    console.log('[ACTION PLAN GENERATED]', actionPlan);
    
    // Extract data from Railway response format
    const actionPlanData = actionPlan.data || actionPlan;
    const assessmentData = assessment.data || assessment;

    // Return combined results in HSG245 format
    return {
      status: 'success',
      incident_id: incidentId,
      part1_overview: {
        incident_type: incident.data?.part1?.incident_type || incident.incident_type || "Incident",
        date_time: incidentData.date_time,
        location: incidentData.location,
        brief_details: {
          what: incidentData.incident_description,
          where: incidentData.location,
          who: incidentData.injured_person
        }
      },
      part2_assessment: {
        type_of_event: assessmentData.type_of_event || "Accident",
        actual_potential_harm: assessmentData.actual_potential_harm || incidentData.severity,
        riddor_reportable: "N",
        investigation_level: assessmentData.investigation_level || "Medium level"
      },
      part3_investigation: {
        immediate_causes: investigationData.immediate_causes || [],
        underlying_causes: investigationData.underlying_causes || [],
        root_causes: investigationData.root_causes || []
      },
      part4_recommendations: {
        action_plan: actionPlanData.action_plan || []
      }
    };
    
  } catch (error) {
    console.error("[ERROR] Railway AI analysis error:", error);
    throw new Error(error.message || "Failed to perform analysis via Railway");
  }
};

/**
 * Health Check - Check if Railway backend is running
 * @returns {Promise<Object>} Railway backend health status
 */
export const checkAPIHealth = async () => {
  try {
    const response = await fetch(`/api/hsg245`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error('Railway backend not responding');
    }

    const result = await response.json();
    console.log('[RAILWAY BACKEND HEALTH]', result);
    
    return result;
    
  } catch (error) {
    console.error("[ERROR] Railway backend health check failed:", error);
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
