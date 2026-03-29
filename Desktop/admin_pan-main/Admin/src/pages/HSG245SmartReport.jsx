/** !!!bu dosyayi kullaniyoruz. digerlerini ele!!!!
 * İSG Akıllı Rapor - Yapay Zeka Destekli Olay İncelemesi
 * 
 * HSG245 olay incelemesi için çok adımlı form:
 * Adım 1: Genel Bakış (Bölüm 1)
 * Adım 2: Değerlendirme (Bölüm 2)
 * Adım 3: İnceleme (Bölüm 3)
 * Adım 4: Eylem Planı & PDF Oluşturma (Bölüm 4)
 */

import React, { useState, useEffect } from 'react';
import {
  checkHealth,
  createIncident,
  addAssessment,
  investigateIncident,
  generateActionPlan,
  getIncident,
  generatePDFReport
} from '../services/hsg245Api';

export default function HSG245SmartReport() {
  // ==================== STATE MANAGEMENT ====================
  
  // Multi-step form progress
  const [currentStep, setCurrentStep] = useState(1);
  const [incidentId, setIncidentId] = useState(null);
  
  // Server connection status
  const [serverStatus, setServerStatus] = useState('checking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Part 1: Overview Data
  const [part1Data, setPart1Data] = useState({
    reported_by: '',
    date_time: '',
    event_category: '',
    brief_details: '',
    forwarded_to: ''
  });
  
  // Part 2: Assessment Data
  const [part2Data, setPart2Data] = useState({
    event_type: '',
    actual_harm: '',
    riddor_reportable: ''
  });
  
  // Part 3: Investigation Data (Simplified - only detailed description needed)
  const [part3Data, setPart3Data] = useState({
    how_happened: ''
  });
  
  // AI Results from backend
  const [results, setResults] = useState({
    part1: null,
    part2: null,
    part3: null,
    part4: null
  });
  
  // ==================== EFFECTS ====================
  
  // Check server health on mount and periodically
  useEffect(() => {
    const checkServerHealth = async () => {
      const health = await checkHealth();
      setServerStatus(health.status === 'healthy' ? 'online' : 'offline');
    };
    
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // ==================== FORM HANDLERS ====================
  
  /**
   * Step 1: Create Incident (Part 1)
   * Sends initial incident data to Overview Agent
   */
  const handlePart1Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      console.log('📋 Submitting Part 1 data to Overview Agent...');
      
      const response = await createIncident(part1Data);
      
      console.log('✅ Part 1 response:', response);
      
      // Save incident ID and Part 1 results
      setIncidentId(response.data.incident_id);
      setResults(prev => ({ ...prev, part1: response.data.part1 }));
      
      setSuccessMessage('✅ Part 1 completed! AI has classified the incident.');
      
      // Move to next step after 1 second
      setTimeout(() => {
        setCurrentStep(2);
        setSuccessMessage('');
      }, 1500);
      
    } catch (err) {
      console.error('❌ Part 1 error:', err);
      setError(err.message || 'Failed to process Part 1');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Step 2: Add Assessment (Part 2)
   * Sends assessment data to Assessment Agent
   */
  const handlePart2Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      console.log('📊 Submitting Part 2 data to Assessment Agent...');
      
      const response = await addAssessment(incidentId, part2Data);
      
      console.log('✅ Part 2 response:', response);
      
      // Save Part 2 results
      setResults(prev => ({ ...prev, part2: response.data }));
      
      setSuccessMessage('✅ Part 2 completed! Severity and investigation level determined.');
      
      // Move to next step
      setTimeout(() => {
        setCurrentStep(3);
        setSuccessMessage('');
      }, 1500);
      
    } catch (err) {
      console.error('❌ Part 2 error:', err);
      setError(err.message || 'Failed to process Part 2');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Step 3: Investigate Incident (Part 3)
   * Sends investigation details to Root Cause Agent
   * Then automatically generates Action Plan (Part 4)
   */
  const handlePart3Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      console.log('🔍 Submitting Part 3 data to Root Cause Agent...');
      
      // Part 3: Root Cause Analysis
      const response = await investigateIncident(incidentId, part3Data);
      
      console.log('✅ Part 3 response:', response);
      setResults(prev => ({ ...prev, part3: response.data }));
      
      setSuccessMessage('✅ Root cause analysis complete! Generating action plan...');
      
      // Wait 1 second, then generate action plan
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('💡 Generating Part 4 - Action Plan...');
      
      // Part 4: Action Plan
      const actionPlanResponse = await generateActionPlan(incidentId);
      
      console.log('✅ Part 4 response:', actionPlanResponse);
      setResults(prev => ({ ...prev, part4: actionPlanResponse.data }));
      
      setSuccessMessage('✅ Investigation complete! All parts finished.');
      
      // Move to results page
      setTimeout(() => {
        setCurrentStep(4);
        setSuccessMessage('');
      }, 1500);
      
    } catch (err) {
      console.error('❌ Part 3/4 error:', err);
      setError(err.message || 'Failed to complete investigation');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Generate PDF Report
   * Downloads the complete HSG245 report
   */
  const handleGeneratePDF = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('📄 Generating PDF report...');
      
      await generatePDFReport(incidentId);
      
      setSuccessMessage('✅ PDF report downloaded successfully!');
      
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('❌ PDF generation error:', err);
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };
  
  // ==================== RENDER ====================
  
  return (
    <div style={styles.container}>
      
      {/* ==================== BAŞLIK ==================== */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📋 İSG Akıllı Rapor Sistemi</h1>
          <p style={styles.subtitle}>Yapay Zeka Destekli Olay İnceleme ve Kök Neden Analizi</p>
        </div>
        
        <div style={styles.statusContainer}>
          <div style={styles.statusBadge}>
            Sunucu Durumu: 
            <span style={serverStatus === 'online' ? styles.statusOnline : styles.statusOffline}>
              {' '}{serverStatus === 'online' ? '🟢 Çevrimiçi' : '🔴 Çevrimdışı'}
            </span>
          </div>
          {incidentId && (
            <div style={styles.incidentIdBadge}>
              ID: {incidentId}
            </div>
          )}
        </div>
      </div>
      
      {/* ==================== İLERLEME ÇUBUĞU ==================== */}
      <div style={styles.progressContainer}>
        <div style={currentStep >= 1 ? styles.stepActive : styles.step}>
          <div style={styles.stepNumber}>1</div>
          <div style={styles.stepLabel}>Genel Bakış</div>
        </div>
        <div style={styles.progressLine}></div>
        <div style={currentStep >= 2 ? styles.stepActive : styles.step}>
          <div style={styles.stepNumber}>2</div>
          <div style={styles.stepLabel}>Değerlendirme</div>
        </div>
        <div style={styles.progressLine}></div>
        <div style={currentStep >= 3 ? styles.stepActive : styles.step}>
          <div style={styles.stepNumber}>3</div>
          <div style={styles.stepLabel}>Kök Neden</div>
        </div>
        <div style={styles.progressLine}></div>
        <div style={currentStep >= 4 ? styles.stepActive : styles.step}>
          <div style={styles.stepNumber}>4</div>
          <div style={styles.stepLabel}>Eylem Planı</div>
        </div>
      </div>
      
      {/* ==================== MESSAGES ==================== */}
      {error && (
        <div style={styles.errorMessage}>
          ⚠️ {error}
        </div>
      )}
      
      {successMessage && (
        <div style={styles.successMessage}>
          {successMessage}
        </div>
      )}
      
      {/* ==================== ADIM 1: GENEL BAKIŞ ==================== */}
      {currentStep === 1 && (
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>Bölüm 1: Genel Bakış</h2>
          <p style={styles.formDescription}>
            Olay hakkında başlangıç bilgilerini giriniz. Yapay zeka olay tipini sınıflandıracak ve önemli bilgileri çıkaracaktır.
          </p>
          
          <form onSubmit={handlePart1Submit} style={styles.form}>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Raporlayan Kişi: *</label>
              <input
                type="text"
                style={styles.input}
                value={part1Data.reported_by}
                onChange={(e) => setPart1Data({...part1Data, reported_by: e.target.value})}
                placeholder="Örn: Ahmet Yılmaz - İSG Uzmanı"
                required
                disabled={loading || serverStatus === 'offline'}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Olay Tarihi/Saati: *</label>
              <input
                type="datetime-local"
                style={styles.input}
                value={part1Data.date_time}
                onChange={(e) => setPart1Data({...part1Data, date_time: e.target.value})}
                required
                disabled={loading || serverStatus === 'offline'}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Olay Kategorisi: *</label>
              <select
                style={styles.select}
                value={part1Data.event_category}
                onChange={(e) => setPart1Data({...part1Data, event_category: e.target.value})}
                required
                disabled={loading || serverStatus === 'offline'}
              >
                <option value="">-- Kategori Seçiniz --</option>
                <option value="Incident (Near-miss / Undesired circumstance)">Ramak Kala Olay</option>
                <option value="Injury">Yaralanma</option>
                <option value="Ill health">Meslek Hastalığı</option>
                <option value="Dangerous occurrence">Tehlikeli Olay</option>
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Olay Özeti (Ne, Nerede, Ne Zaman, Kim): *</label>
              <textarea
                style={styles.textarea}
                value={part1Data.brief_details}
                onChange={(e) => setPart1Data({...part1Data, brief_details: e.target.value})}
                placeholder="Ne olduğunu, nerede olduğunu, ne zaman olduğunu ve kimlerin dahil olduğunu açıklayınız..."
                rows={5}
                required
                disabled={loading || serverStatus === 'offline'}
              />
              <small style={styles.helpText}>
                💡 Detaylı yazınız - Yapay zeka bu bilgileri analiz edecektir
              </small>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>İletilen Kişi/Birim:</label>
              <input
                type="text"
                style={styles.input}
                value={part1Data.forwarded_to}
                onChange={(e) => setPart1Data({...part1Data, forwarded_to: e.target.value})}
                placeholder="Örn: Operasyon Müdürü, İSG Direktörü"
                disabled={loading || serverStatus === 'offline'}
              />
            </div>
            
            <button 
              type="submit" 
              style={styles.primaryButton}
              disabled={loading || serverStatus === 'offline'}
            >
              {loading ? '⏳ Yapay Zeka Analiz Ediyor...' : '🤖 Yapay Zeka ile Analiz Et & Devam →'}
            </button>
            
          </form>
        </div>
      )}
      
      {/* ==================== ADIM 2: DEĞERLENDİRME ==================== */}
      {currentStep === 2 && (
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>Bölüm 2: Değerlendirme</h2>
          <p style={styles.formDescription}>
            Olayın ciddiyetini değerlendiriniz. Yapay zeka RIDDOR durumunu belirleyecektir.
          </p>
          
          {/* Show Part 1 AI Results */}
          {results.part1 && (
            <div style={styles.aiResultsBox}>
              <h4 style={styles.aiResultsTitle}>🤖 Yapay Zeka Analizi - Bölüm 1:</h4>
              <div style={styles.aiResultsGrid}>
                <div>
                  <strong>Olay Tipi:</strong> {results.part1.incident_type}
                </div>
                <div>
                  <strong>Referans No:</strong> {incidentId}
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handlePart2Submit} style={styles.form}>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Type of Event: *</label>
              <select
                style={styles.select}
                value={part2Data.event_type}
                onChange={(e) => setPart2Data({...part2Data, event_type: e.target.value})}
                required
                disabled={loading}
              >
                <option value="">-- Select Type --</option>
                <option value="Accident">Accident</option>
                <option value="Incident">Incident</option>
                <option value="Near miss">Near miss</option>
                <option value="Dangerous occurrence">Dangerous occurrence</option>
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Actual/Potential Harm Level: *</label>
              <select
                style={styles.select}
                value={part2Data.actual_harm}
                onChange={(e) => setPart2Data({...part2Data, actual_harm: e.target.value})}
                required
                disabled={loading}
              >
                <option value="">-- Select Severity --</option>
                <option value="Damage only">Damage only</option>
                <option value="Minor">Minor</option>
                <option value="Serious">Serious</option>
                <option value="Major">Major</option>
                <option value="Fatality">Fatality</option>
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>RIDDOR Reportable?: *</label>
              <select
                style={styles.select}
                value={part2Data.riddor_reportable}
                onChange={(e) => setPart2Data({...part2Data, riddor_reportable: e.target.value})}
                required
                disabled={loading}
              >
                <option value="">-- Select --</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Unsure">Unsure - Let AI Determine</option>
              </select>
              <small style={styles.helpText}>
                💡 If unsure, AI will analyze RIDDOR requirements
              </small>
            </div>
            
            <div style={styles.buttonGroup}>
              <button 
                type="button" 
                style={styles.secondaryButton}
                onClick={() => setCurrentStep(1)}
                disabled={loading}
              >
                ← Back
              </button>
              <button 
                type="submit" 
                style={styles.primaryButton}
                disabled={loading}
              >
                {loading ? '⏳ AI Analyzing...' : '🤖 Analyze & Continue →'}
              </button>
            </div>
            
          </form>
        </div>
      )}
      
      {/* ==================== ADIM 3: KOK NEDEN INCELEMESI ==================== */}
      {currentStep === 3 && (
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>Bolum 3: Kok Neden Incelemesi</h2>
          <p style={styles.formDescription}>
            Detayli olay bilgilerini giriniz. Yapay zeka 5 Neden analizi yaparak kok nedenleri belirleyecektir.
          </p>
          
          {/* Show Part 2 AI Results */}
          {results.part2 && (
            <div style={styles.aiResultsBox}>
              <h4 style={styles.aiResultsTitle}>🤖 Yapay Zeka Analizi - Bolum 2:</h4>
              <div style={styles.aiResultsGrid}>
                <div>
                  <strong>Inceleme Seviyesi:</strong> {results.part2.investigation_level}
                </div>
                <div>
                  <strong>RIDDOR Durumu:</strong> {results.part2.riddor_reportable}
                </div>
                <div>
                  <strong>Oncelik:</strong> {results.part2.priority}
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handlePart3Submit} style={styles.form}>
            
            {/* AI Analysis Progress Box */}
            <div style={styles.aiProgressContainer}>
              <div style={styles.aiProgressHeader}>
                <div style={styles.aiProgressIcon}>🤖</div>
                <div>
                  <h3 style={styles.aiProgressTitle}>Yapay Zeka Analiz Sureci</h3>
                  <p style={styles.aiProgressSubtitle}>
                    {loading ? '⏳ Analiz Devam Ediyor...' : '✅ Analiz Tamamlandi'}
                  </p>
                </div>
              </div>
              
              <div style={styles.aiStepsContainer}>
                <div style={styles.aiStep}>
                  <div style={styles.aiStepIconComplete}>📄</div>
                  <div style={styles.aiStepContent}>
                    <h4 style={styles.aiStepTitle}>Rapor Metni Okunuyor...</h4>
                    <p style={styles.aiStepDescription}>Aciklama netligi ve eksiksizligi icin taranıyor.</p>
                  </div>
                </div>
                
                <div style={styles.aiStep}>
                  <div style={styles.aiStepIconComplete}>🔧</div>
                  <div style={styles.aiStepContent}>
                    <h4 style={styles.aiStepTitle}>Ekipman Tanimlandi</h4>
                    <p style={styles.aiStepDescription}>
                      Bahsettiginiz ekipmanlari tespit ettim. Detayli analiz icin kullanilacak.
                    </p>
                  </div>
                </div>
                
                <div style={styles.aiStep}>
                  <div style={styles.aiStepIconWarning}>⚠️</div>
                  <div style={styles.aiStepContent}>
                    <h4 style={styles.aiStepTitle}>Guvenlik Endisesi Tespit Edildi</h4>
                    <p style={styles.aiStepDescription}>
                      Belirttiginiz kritik risk faktorleri kok neden analizinde dikkate alinacak.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Olay Detaylari (Ne oldu, Nasil oldu, Neyin yanlis gittigi): *</label>
              <textarea
                style={styles.textarea}
                value={part3Data.how_happened}
                onChange={(e) => setPart3Data({...part3Data, how_happened: e.target.value})}
                placeholder="Olaylarin detayli aciklamasi, kullanilan ekipman, neyin yanlis gittigini yaziniz..."
                rows={8}
                required
                disabled={loading}
              />
              <small style={styles.helpText}>
                💡 Bu bilgi yapay zeka kok neden analizi icin kritiktir - lutfen detayli yaziniz
              </small>
            </div>
            
            <div style={styles.buttonGroup}>
              <button 
                type="button" 
                style={styles.secondaryButton}
                onClick={() => setCurrentStep(2)}
                disabled={loading}
              >
                ← Geri
              </button>
              <button 
                type="submit" 
                style={styles.primaryButton}
                disabled={loading}
              >
                {loading ? '⏳ Yapay Zeka Analiz Ediyor...' : '🤖 Kok Neden Analizini Baslat →'}
              </button>
            </div>
            
          </form>
        </div>
      )}
      
      {/* ==================== ADIM 4: SONUCLAR & PDF ==================== */}
      {currentStep === 4 && (
        <div style={styles.resultsContainer}>
          <h2 style={styles.resultsTitle}>✅ Inceleme Tamamlandi!</h2>
          <p style={styles.resultsSubtitle}>
            Yapay zeka tam HSG245 inceleme analizini tamamladi.
          </p>
          
          {/* Part 3: Root Cause Analysis Results */}
          <div style={styles.resultCard}>
            <h3 style={styles.resultCardTitle}>🔍 Bolum 3: Kok Neden Analizi</h3>
            
            {results.part3 && results.part3.immediate_causes && results.part3.immediate_causes.length > 0 ? (
              <>
                <div style={styles.resultSection}>
                  <h4 style={styles.resultSectionTitle}>⚡ Immediate Causes:</h4>
                  <ul style={styles.resultList}>
                    {results.part3.immediate_causes.map((cause, i) => (
                      <li key={i} style={styles.resultListItem}>
                        {typeof cause === 'object' ? (cause.cause_tr || cause.cause) : cause}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div style={styles.resultSection}>
                  <h4 style={styles.resultSectionTitle}>🔧 Underlying Causes:</h4>
                  <ul style={styles.resultList}>
                    {results.part3.underlying_causes?.map((cause, i) => (
                      <li key={i} style={styles.resultListItem}>
                        {typeof cause === 'object' ? (cause.cause_tr || cause.cause) : cause}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div style={styles.resultSection}>
                  <h4 style={styles.resultSectionTitle}>🎯 Root Causes:</h4>
                  <ul style={styles.resultList}>
                    {results.part3.root_causes?.map((cause, i) => (
                      <li key={i} style={styles.resultListItem}>
                        {typeof cause === 'object' ? (cause.cause_tr || cause.cause) : cause}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p style={{ color: '#888', fontStyle: 'italic', padding: '20px' }}>
                ⏳ Root cause analysis not completed yet. Please submit Part 3 investigation data.
              </p>
            )}
          </div>
          
          {/* Part 4: Action Plan Results */}
          <div style={styles.resultCard}>
            <h3 style={styles.resultCardTitle}>💡 Part 4: Risk Control Action Plan</h3>
            
            {results.part4 && (
              <>
                <div style={styles.resultSection}>
                  <h4 style={styles.resultSectionTitle}>⚡ Immediate Actions (24-48 hours):</h4>
                  <table style={styles.actionTable}>
                    <thead>
                      <tr>
                        <th style={styles.tableHeader}>Action</th>
                        <th style={styles.tableHeader}>Responsible</th>
                        <th style={styles.tableHeader}>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.part4.control_measures
                        ?.filter(m => m.category === 'immediate')
                        .map((action, i) => (
                          <tr key={i}>
                            <td style={styles.tableCell}>{action.measure}</td>
                            <td style={styles.tableCell}>{action.responsible}</td>
                            <td style={styles.tableCell}>{action.target_date}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
                
                <div style={styles.resultSection}>
                  <h4 style={styles.resultSectionTitle}>📅 Short-term Actions (1-3 months):</h4>
                  <table style={styles.actionTable}>
                    <thead>
                      <tr>
                        <th style={styles.tableHeader}>Action</th>
                        <th style={styles.tableHeader}>Responsible</th>
                        <th style={styles.tableHeader}>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.part4.control_measures
                        ?.filter(m => m.category === 'short_term')
                        .map((action, i) => (
                          <tr key={i}>
                            <td style={styles.tableCell}>{action.measure}</td>
                            <td style={styles.tableCell}>{action.responsible}</td>
                            <td style={styles.tableCell}>{action.target_date}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
                
                <div style={styles.resultSection}>
                  <h4 style={styles.resultSectionTitle}>🎯 Long-term Actions (3-12 months):</h4>
                  <table style={styles.actionTable}>
                    <thead>
                      <tr>
                        <th style={styles.tableHeader}>Action</th>
                        <th style={styles.tableHeader}>Responsible</th>
                        <th style={styles.tableHeader}>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.part4.control_measures
                        ?.filter(m => m.category === 'long_term')
                        .map((action, i) => (
                          <tr key={i}>
                            <td style={styles.tableCell}>{action.measure}</td>
                            <td style={styles.tableCell}>{action.responsible}</td>
                            <td style={styles.tableCell}>{action.target_date}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
          
          {/* Action Buttons */}
          <div style={styles.finalButtonGroup}>
            <button 
              type="button" 
              style={styles.secondaryButton}
              onClick={() => setCurrentStep(3)}
              disabled={loading}
            >
              ← Back to Investigation
            </button>
            
            <button 
              type="button" 
              style={styles.pdfButton}
              onClick={handleGeneratePDF}
              disabled={loading}
            >
              {loading ? '⏳ Generating PDF...' : '📄 Generate PDF Report'}
            </button>
          </div>
          
          <p style={styles.incidentIdFooter}>
            Incident Reference: <strong>{incidentId}</strong>
          </p>
        </div>
      )}
      
    </div>
  );
}

// ==================== STYLES ====================

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#f5f7fa',
    minHeight: '100vh'
  },
  
  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  title: {
    margin: '0 0 5px 0',
    color: '#2c3e50',
    fontSize: '28px'
  },
  subtitle: {
    margin: 0,
    color: '#7f8c8d',
    fontSize: '14px'
  },
  statusContainer: {
    textAlign: 'right'
  },
  statusBadge: {
    padding: '8px 15px',
    borderRadius: '20px',
    backgroundColor: '#ecf0f1',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  statusOnline: {
    color: '#27ae60'
  },
  statusOffline: {
    color: '#e74c3c'
  },
  incidentIdBadge: {
    padding: '5px 12px',
    borderRadius: '15px',
    backgroundColor: '#3498db',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  
  // Progress Bar
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '30px',
    padding: '0 20px'
  },
  step: {
    textAlign: 'center',
    flex: '0 0 auto'
  },
  stepActive: {
    textAlign: 'center',
    flex: '0 0 auto'
  },
  stepNumber: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#ecf0f1',
    color: '#95a5a6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 5px',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  stepLabel: {
    fontSize: '12px',
    color: '#7f8c8d'
  },
  progressLine: {
    flex: '1 1 auto',
    height: '2px',
    backgroundColor: '#ecf0f1',
    margin: '0 10px'
  },
  
  // Messages
  errorMessage: {
    backgroundColor: '#fadbd8',
    color: '#922b21',
    padding: '15px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #e74c3c',
    fontSize: '14px'
  },
  successMessage: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '15px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #27ae60',
    fontSize: '14px'
  },
  
  // Form Container
  formContainer: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  formTitle: {
    margin: '0 0 10px 0',
    color: '#2c3e50',
    fontSize: '24px'
  },
  formDescription: {
    margin: '0 0 25px 0',
    color: '#7f8c8d',
    fontSize: '14px',
    lineHeight: '1.5'
  },
  
  // AI Results Box
  aiResultsBox: {
    backgroundColor: '#e8f4f8',
    padding: '15px 20px',
    borderRadius: '8px',
    marginBottom: '25px',
    border: '2px solid #3498db'
  },
  aiResultsTitle: {
    margin: '0 0 10px 0',
    color: '#2c3e50',
    fontSize: '16px'
  },
  aiResultsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
    fontSize: '14px'
  },
  
  // Form
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontWeight: 'bold',
    color: '#2c3e50',
    fontSize: '14px'
  },
  input: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #dfe6e9',
    fontSize: '14px',
    transition: 'border-color 0.2s'
  },
  select: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #dfe6e9',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #dfe6e9',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  helpText: {
    color: '#95a5a6',
    fontSize: '12px',
    fontStyle: 'italic'
  },
  
  // Buttons
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  primaryButton: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  secondaryButton: {
    padding: '12px 24px',
    backgroundColor: '#ecf0f1',
    color: '#2c3e50',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  pdfButton: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  
  // Results Page
  resultsContainer: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  resultsTitle: {
    margin: '0 0 10px 0',
    color: '#27ae60',
    fontSize: '28px'
  },
  resultsSubtitle: {
    margin: '0 0 30px 0',
    color: '#7f8c8d',
    fontSize: '14px'
  },
  resultCard: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  resultCardTitle: {
    margin: '0 0 15px 0',
    color: '#2c3e50',
    fontSize: '20px',
    borderBottom: '2px solid #3498db',
    paddingBottom: '10px'
  },
  resultSection: {
    marginBottom: '20px'
  },
  resultSectionTitle: {
    margin: '0 0 10px 0',
    color: '#2c3e50',
    fontSize: '16px'
  },
  resultList: {
    margin: '0',
    paddingLeft: '20px'
  },
  resultListItem: {
    marginBottom: '8px',
    lineHeight: '1.5',
    color: '#34495e'
  },
  actionTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  tableHeader: {
    backgroundColor: '#ecf0f1',
    padding: '10px',
    textAlign: 'left',
    fontWeight: 'bold',
    color: '#2c3e50',
    border: '1px solid #dfe6e9'
  },
  tableCell: {
    padding: '10px',
    border: '1px solid #dfe6e9',
    color: '#34495e'
  },
  finalButtonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '30px'
  },
  incidentIdFooter: {
    textAlign: 'center',
    marginTop: '25px',
    color: '#7f8c8d',
    fontSize: '14px'
  },
  
  // AI Progress Styles
  aiProgressContainer: {
    backgroundColor: '#f8f9fa',
    border: '2px solid #e9ecef',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '25px'
  },
  aiProgressHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '15px'
  },
  aiProgressIcon: {
    fontSize: '32px'
  },
  aiProgressTitle: {
    margin: '0 0 5px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  aiProgressSubtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#7f8c8d'
  },
  aiStepsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  aiStep: {
    display: 'flex',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
    gap: '15px'
  },
  aiStepIconComplete: {
    fontSize: '24px',
    minWidth: '30px',
    textAlign: 'center'
  },
  aiStepIconWarning: {
    fontSize: '24px',
    minWidth: '30px',
    textAlign: 'center',
    filter: 'drop-shadow(0 0 3px rgba(255, 193, 7, 0.5))'
  },
  aiStepContent: {
    flex: 1
  },
  aiStepTitle: {
    margin: '0 0 5px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50'
  },
  aiStepDescription: {
    margin: 0,
    fontSize: '13px',
    color: '#6c757d',
    lineHeight: '1.5'
  }
};
