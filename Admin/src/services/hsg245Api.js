/**
 * HSG245 Investigation API Service
 * 
 * ⚠️ UPDATED: Now uses Vercel API Route as proxy to Railway backend
 * 
 * Architecture:
 * Admin Panel → Vercel API Route (/api/hsg245) → Railway Backend → AI Agents
 * 
 * Benefits:
 * - No CORS issues
 * - Backend URL stays private
 * - Better security
 */

// ⚠️ IMPORTANT: Use Vercel API route (NOT direct Railway URL)
// This routes through /app/api/hsg245/route.ts which proxies to Railway
const API_BASE_URL = '/api/hsg245';

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
    const response = await fetch(`${API_BASE_URL}/api/v1/health`);
    const data = await handleResponse(response);
    
    console.log('✅ Backend bağlantısı başarılı:', data);
    return data;
  } catch (error) {
    console.error('❌ Backend bağlantısı başarısız:', error.message);
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
  console.log('📋 Creating incident...', data);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/incidents/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reported_by: data.reported_by,
        description: data.description,
        injury_description: data.injury_description || '',
        forwarded_to: data.forwarded_to || '',
        event_category: data.event_category || '',
        date_time: data.date_time || new Date().toISOString()
      })
    });
    
    const result = await handleResponse(response);
    console.log('✅ Incident created:', result.data.incident_id);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to create incident:', error.message);
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
  console.log(`📊 Adding assessment for ${incidentId}...`);
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/incidents/${incidentId}/assessment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incident_id: incidentId,
          event_type: data.event_type,
          actual_harm: data.actual_harm,
          riddor_reportable: data.riddor_reportable
        })
      }
    );
    
    const result = await handleResponse(response);
    console.log('✅ Assessment completed');
    
    return result;
  } catch (error) {
    console.error('❌ Failed to add assessment:', error.message);
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
export async function investigateIncident(incidentId, data) {
  console.log(`🔍 Investigating incident ${incidentId}...`);
  console.log('⏳ This may take 10-20 seconds (AI analysis running)...');
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/incidents/${incidentId}/investigate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incident_id: incidentId,
          location: data.location,
          who_involved: data.who_involved,
          how_happened: data.how_happened,
          activities: data.activities || '',
          working_conditions: data.working_conditions || '',
          safety_procedures: data.safety_procedures || '',
          injuries: data.injuries || ''
        })
      }
    );
    
    const result = await handleResponse(response);
    console.log('✅ Investigation completed');
    console.log(`   - Immediate causes: ${result.data.immediate_causes?.length || 0}`);
    console.log(`   - Underlying causes: ${result.data.underlying_causes?.length || 0}`);
    console.log(`   - Root causes: ${result.data.root_causes?.length || 0}`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to investigate:', error.message);
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
    const response = await fetch(
      `${API_BASE_URL}/api/v1/incidents/${incidentId}/actionplan`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    const result = await handleResponse(response);
    console.log('✅ Action plan generated');
    console.log(`   - Immediate actions: ${result.data.immediate_actions?.length || 0}`);
    console.log(`   - Short-term actions: ${result.data.short_term_actions?.length || 0}`);
    console.log(`   - Long-term actions: ${result.data.long_term_actions?.length || 0}`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to generate action plan:', error.message);
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
    const response = await fetch(
      `${API_BASE_URL}/api/v1/incidents/${incidentId}`
    );
    
    const result = await handleResponse(response);
    console.log('✅ Incident data retrieved');
    
    return result;
  } catch (error) {
    console.error('❌ Failed to get incident:', error.message);
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
  console.log('📋 Fetching all incidents...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/incidents`);
    const result = await handleResponse(response);
    
    console.log(`✅ Retrieved ${result.count} incidents`);
    return result;
  } catch (error) {
    console.error('❌ Failed to list incidents:', error.message);
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
    const response = await fetch(
      `${API_BASE_URL}/api/v1/reports/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ incident_id: incidentId })
      }
    );
    
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
    
    console.log('✅ PDF report downloaded successfully');
  } catch (error) {
    console.error('❌ Failed to generate PDF:', error.message);
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
  return API_BASE_URL;
}

// Export all functions as default
export default {
  checkHealth,
  createIncident,
  addAssessment,
  investigateIncident,
  generateActionPlan,
  getIncident,
  listIncidents,
  generatePDFReport,
  getStatusLabel,
  getPriorityColor,
  getApiUrl
};
