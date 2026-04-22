/**
 * HSG245 Investigation API Service
 * 
 * UPDATED: Now uses Vercel API Route as proxy to Railway backend
 * 
 * Architecture:
 * Admin Panel -> Vercel API Route (/api/hsg245) -> Railway Backend -> AI Agents
 * 
 * Benefits:
 * - No CORS issues
 * - Backend URL stays private
 * - Better security
 */

// IMPORTANT: Use Vercel serverless gateway endpoint.
// Admin/api/hsg245.js expects { action, data } payload on POST.
const API_GATEWAY_URL = '/api/hsg245';

/**
 * API çağrılarında hata yönetimi için yardımcı fonksiyon
 */
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * ============================================================================
 * HEALTH CHECK - Sistem Durumu Kontrolü
 * ============================================================================
 * Backend'in çalışıp çalışmadığını kontrol eder.
 * Admin panel açıldığında otomatik çağrılmalı.
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_GATEWAY_URL}`, { method: 'GET' });
    const data = await handleResponse(response);
    
    console.log('[SUCCESS] Backend bağlantısı başarılı:', data);
    return data;
  } catch (error) {
    console.error('[ERROR] Backend bağlantısı başarısız:', error.message);
    return { 
      status: 'offline', 
      error: error.message,
      agents: {}
    };
  }
}

/**
 * ============================================================================
 * PART 1: CREATE INCIDENT - Incident Oluşturma
 * ============================================================================
 * Kullanıcı formu doldurduktan sonra ilk çağrılan fonksiyon.
 * Overview Agent çalıştırılır ve incident ID oluşturulur.
 * 
 * @param {Object} data - Form verisi
 * @param {string} data.reported_by - Rapor eden kişi (örn: "John Doe - Safety Officer")
 * @param {string} data.description - Olay açıklaması
 * @param {string} data.injury_description - Yaralanma detayı
 * @param {string} data.forwarded_to - Kime iletildi
 * @param {string} data.event_category - Olay kategorisi
 * 
 * @returns {Promise<Object>} - { success, data: { incident_id, part1 } }
 */
export async function createIncident(data) {
  console.log('[INFO] Creating incident...', data);
  
  try {
    const response = await fetch(`${API_GATEWAY_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create_incident',
        data: {
          reported_by: data.reported_by,
          description: data.description,
          injury_description: data.injury_description || '',
          forwarded_to: data.forwarded_to || '',
          event_category: data.event_category || '',
          date_time: data.date_time || new Date().toISOString()
        }
      })
    });
    
    const result = await handleResponse(response);
    console.log('[SUCCESS] Incident created:', result.data.incident_id);
    
    return result;
  } catch (error) {
    console.error('[ERROR] Failed to create incident:', error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * PART 2: ADD ASSESSMENT - Değerlendirme Ekleme
 * ============================================================================
 * Part 1 tamamlandıktan sonra çağrılır.
 * Assessment Agent çalıştırılır (severity, RIDDOR, investigation level).
 * 
 * @param {string} incidentId - Incident ID (örn: "INC-20260105-020328")
 * @param {Object} data - Assessment verisi
 * @param {string} data.event_type - Olay tipi ("Accident", "Incident", etc.)
 * @param {string} data.actual_harm - Zarar seviyesi ("Minor", "Serious", etc.)
 * @param {string} data.riddor_reportable - RIDDOR durumu ("Yes", "No", "Unsure")
 * 
 * @returns {Promise<Object>} - { success, data: part2_data }
 */
export async function addAssessment(incidentId, data) {
  console.log(`[INFO] Adding assessment for ${incidentId}...`);
  
  try {
    const response = await fetch(`${API_GATEWAY_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'add_assessment',
        data: {
          incident_id: incidentId,
          event_type: data.event_type,
          actual_harm: data.actual_harm,
          riddor_reportable: data.riddor_reportable
        }
      })
    });
    
    const result = await handleResponse(response);
    console.log('[SUCCESS] Assessment completed');
    
    return result;
  } catch (error) {
    console.error('[ERROR] Failed to add assessment:', error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * PART 3: INVESTIGATE INCIDENT - Root Cause Analizi
 * ============================================================================
 * Part 2 tamamlandıktan sonra çağrılır.
 * Root Cause Agent çalıştırılır (5 Why analysis).
 * 
 * @param {string} incidentId - Incident ID
 * @param {Object} data - Investigation verisi
 * @param {string} data.location - Olay yeri
 * @param {string} data.who_involved - Yaralanan/dahil olan kişiler
 * @param {string} data.how_happened - Nasıl oldu (detaylı açıklama)
 * @param {string} data.activities - Yapılan aktiviteler
 * @param {string} data.working_conditions - Çalışma koşulları
 * @param {string} data.safety_procedures - Güvenlik prosedürleri
 * @param {string} data.injuries - Yaralanmalar
 * 
 * @returns {Promise<Object>} - { success, data: part3_data with root causes }
 */
/**
 * Dinamik HITL soru batch'i (backend: disambiguation + QuestionEngine / knowledge_base).
 *
 * @param {string} incidentId
 * @param {{ how_happened?: string, root_cause_initial?: string, answered_ids?: string[], immediate_causes?: object[]|null, immediate_code?: string, why_level?: number, current_why_question?: string, previous_why_answer?: string, mode?: 'global'|'why_probe', batch_size?: number }} body
 */
export async function fetchHitlQuestions(incidentId, body) {
  const response = await fetch(`${API_GATEWAY_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'hitl_questions',
      data: {
        incident_id: incidentId,
        how_happened: body.how_happened || '',
        root_cause_initial: body.root_cause_initial || '',
        answered_ids: body.answered_ids || [],
        immediate_causes: body.immediate_causes ?? null,
        immediate_code: body.immediate_code || '',
        why_level: body.why_level ?? 0,
        current_why_question: body.current_why_question || '',
        previous_why_answer: body.previous_why_answer || '',
        mode: body.mode || 'global',
        batch_size: body.batch_size ?? 1,
      },
    }),
  });
  return handleResponse(response);
}

export async function investigateIncident(incidentId, data) {
  console.log(`🔍 Investigating incident ${incidentId}...`);
  console.log('⏳ This may take 10-20 seconds (AI analysis running)...');
  
  try {
    const response = await fetch(`${API_GATEWAY_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'investigate',
        data: {
          incident_id: incidentId,
          location: data.location,
          who_involved: data.who_involved,
          how_happened: data.how_happened,
          activities: data.activities || '',
          working_conditions: data.working_conditions || '',
          safety_procedures: data.safety_procedures || '',
          injuries: data.injuries || '',
          why_probe_answers: data.why_probe_answers || [],
        }
      })
    });
    
    const result = await handleResponse(response);
    console.log('[SUCCESS] Investigation completed');
    console.log(`   - Immediate causes: ${result.data.immediate_causes?.length || 0}`);
    console.log(`   - Underlying causes: ${result.data.underlying_causes?.length || 0}`);
    console.log(`   - Root causes: ${result.data.root_causes?.length || 0}`);
    
    return result;
  } catch (error) {
    console.error('[ERROR] Failed to investigate:', error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * PART 4: GENERATE ACTION PLAN - Aksiyon Planı Oluşturma
 * ============================================================================
 * Part 3 tamamlandıktan sonra otomatik çağrılır.
 * Action Plan Agent çalıştırılır (immediate, short-term, long-term actions).
 * 
 * @param {string} incidentId - Incident ID
 * 
 * @returns {Promise<Object>} - { success, data: part4_data with action plan }
 */
export async function generateActionPlan(incidentId) {
  console.log(`💡 Generating action plan for ${incidentId}...`);
  
  try {
    const response = await fetch(`${API_GATEWAY_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate_action_plan',
        data: { incident_id: incidentId }
      })
    });
    
    const result = await handleResponse(response);
    console.log('[SUCCESS] Action plan generated');
    console.log(`   - Immediate actions: ${result.data.immediate_actions?.length || 0}`);
    console.log(`   - Short-term actions: ${result.data.short_term_actions?.length || 0}`);
    console.log(`   - Long-term actions: ${result.data.long_term_actions?.length || 0}`);
    
    return result;
  } catch (error) {
    console.error('[ERROR] Failed to generate action plan:', error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * GET INCIDENT - Incident Detaylarını Getir
 * ============================================================================
 * Tüm incident verisini (Part 1-4) getirir.
 * Sayfa yenilendiğinde veya devam etmek için kullanılır.
 * 
 * @param {string} incidentId - Incident ID
 * 
 * @returns {Promise<Object>} - Complete incident data
 */
export async function getIncident(incidentId) {
  console.log(`📖 Fetching incident ${incidentId}...`);
  
  try {
    const response = await fetch(`${API_GATEWAY_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'get_incident',
        data: { incident_id: incidentId }
      })
    });
    
    const result = await handleResponse(response);
    console.log('[SUCCESS] Incident data retrieved');
    
    return result;
  } catch (error) {
    console.error('[ERROR] Failed to get incident:', error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * LIST INCIDENTS - Tüm Incident'leri Listele
 * ============================================================================
 * Sistemdeki tüm incident'leri getirir.
 * Dashboard/liste sayfası için kullanılır.
 * 
 * @returns {Promise<Object>} - { success, data: [...incidents], count }
 */
export async function listIncidents() {
  console.log('[INFO] Fetching all incidents...');
  
  try {
    const response = await fetch(`${API_GATEWAY_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'list_incidents',
        data: {}
      })
    });
    const result = await handleResponse(response);
    
    console.log(`✅ Retrieved ${result.count} incidents`);
    return result;
  } catch (error) {
    console.error('[ERROR] Failed to list incidents:', error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * GENERATE PDF REPORT - PDF Rapor Oluştur ve İndir
 * ============================================================================
 * Tüm 4 part tamamlandıktan sonra çağrılır.
 * PDF Report Agent çalıştırılır ve dosya indirilir.
 * 
 * @param {string} incidentId - Incident ID
 * 
 * @returns {Promise<void>} - PDF otomatik indirilir
 */
export async function generatePDFReport(incidentId) {
  console.log(`📄 Generating PDF report for ${incidentId}...`);
  
  try {
    const response = await fetch(`${API_GATEWAY_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate_pdf',
        data: { incident_id: incidentId }
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate PDF');
    }
    
    // PDF blob olarak gelir, indir
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HSG245_Report_${incidentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log('[SUCCESS] PDF report downloaded successfully');
  } catch (error) {
    console.error('[ERROR] Failed to generate PDF:', error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * HELPER FUNCTIONS - Yardımcı Fonksiyonlar
 * ============================================================================
 */

/**
 * Incident status'ü Türkçe'ye çevir
 */
export function getStatusLabel(status) {
  const labels = {
    'created': 'Oluşturuldu (Part 1)',
    'assessed': 'Değerlendirildi (Part 2)',
    'investigated': 'İncelendi (Part 3)',
    'completed': 'Tamamlandı (Part 4)',
    'error': 'Hata'
  };
  return labels[status] || status;
}

/**
 * Priority seviyesi için renk döndür
 */
export function getPriorityColor(priority) {
  const colors = {
    'High': 'red',
    'Medium': 'orange',
    'Low': 'green'
  };
  return colors[priority] || 'gray';
}

/**
 * API URL'ini kontrol et
 */
export function getApiUrl() {
  return API_GATEWAY_URL;
}

// Export all functions as default
export default {
  checkHealth,
  createIncident,
  addAssessment,
  fetchHitlQuestions,
  investigateIncident,
  generateActionPlan,
  getIncident,
  listIncidents,
  generatePDFReport,
  getStatusLabel,
  getPriorityColor,
  getApiUrl
};
