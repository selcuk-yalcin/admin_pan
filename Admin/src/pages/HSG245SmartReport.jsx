/**
 * HSG245 Smart Report - AI-Powered Incident Investigation
 * 
 * Multi-step form for HSG245 incident investigation:
 * Step 1: Overview (Part 1)
 * Step 2: Assessment (Part 2)
 * Step 3: Investigation (Part 3)
 * Step 4: Action Plan & PDF Generation (Part 4)
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
  
  // Part 3: Investigation Data
  const [part3Data, setPart3Data] = useState({
    location: '',
    who_involved: '',
    how_happened: '',
    activities: '',
    working_conditions: '',
    safety_procedures: '',
    injuries: ''
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
      
      {/* ==================== HEADER ==================== */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📋 HSG245 Smart Report</h1>
          <p style={styles.subtitle}>AI-Powered Incident Investigation System</p>
        </div>
        
        <div style={styles.statusContainer}>
          <div style={styles.statusBadge}>
            Server Status: 
            <span style={serverStatus === 'online' ? styles.statusOnline : styles.statusOffline}>
              {' '}{serverStatus === 'online' ? '🟢 Online' : '🔴 Offline'}
            </span>
          </div>
          {incidentId && (
            <div style={styles.incidentIdBadge}>
              ID: {incidentId}
            </div>
          )}
        </div>
      </div>
      
      {/* ==================== PROGRESS BAR ==================== */}
      <div style={styles.progressContainer}>
        <div style={currentStep >= 1 ? styles.stepActive : styles.step}>
          <div style={styles.stepNumber}>1</div>
          <div style={styles.stepLabel}>Overview</div>
        </div>
        <div style={styles.progressLine}></div>
        <div style={currentStep >= 2 ? styles.stepActive : styles.step}>
          <div style={styles.stepNumber}>2</div>
          <div style={styles.stepLabel}>Assessment</div>
        </div>
        <div style={styles.progressLine}></div>
        <div style={currentStep >= 3 ? styles.stepActive : styles.step}>
          <div style={styles.stepNumber}>3</div>
          <div style={styles.stepLabel}>Investigation</div>
        </div>
        <div style={styles.progressLine}></div>
        <div style={currentStep >= 4 ? styles.stepActive : styles.step}>
          <div style={styles.stepNumber}>4</div>
          <div style={styles.stepLabel}>Action Plan</div>
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
      
      {/* ==================== STEP 1: OVERVIEW ==================== */}
      {currentStep === 1 && (
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>Part 1: Overview</h2>
          <p style={styles.formDescription}>
            Provide initial incident details. AI will classify the incident type and extract key information.
          </p>
          
          <form onSubmit={handlePart1Submit} style={styles.form}>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Reported by: *</label>
              <input
                type="text"
                style={styles.input}
                value={part1Data.reported_by}
                onChange={(e) => setPart1Data({...part1Data, reported_by: e.target.value})}
                placeholder="e.g., John Smith - Safety Officer"
                required
                disabled={loading || serverStatus === 'offline'}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Date/Time of Event: *</label>
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
              <label style={styles.label}>Event Category: *</label>
              <select
                style={styles.select}
                value={part1Data.event_category}
                onChange={(e) => setPart1Data({...part1Data, event_category: e.target.value})}
                required
                disabled={loading || serverStatus === 'offline'}
              >
                <option value="">-- Select Category --</option>
                <option value="Incident (Near-miss / Undesired circumstance)">Incident (Near-miss)</option>
                <option value="Injury">Injury</option>
                <option value="Ill health">Ill health</option>
                <option value="Dangerous occurrence">Dangerous occurrence</option>
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Brief Details (What, Where, When, Who): *</label>
              <textarea
                style={styles.textarea}
                value={part1Data.brief_details}
                onChange={(e) => setPart1Data({...part1Data, brief_details: e.target.value})}
                placeholder="Describe what happened, where, when, and who was involved..."
                rows={5}
                required
                disabled={loading || serverStatus === 'offline'}
              />
              <small style={styles.helpText}>
                💡 Be specific - AI will analyze this to classify the incident
              </small>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Forwarded to:</label>
              <input
                type="text"
                style={styles.input}
                value={part1Data.forwarded_to}
                onChange={(e) => setPart1Data({...part1Data, forwarded_to: e.target.value})}
                placeholder="e.g., Operations Manager, HSE Director"
                disabled={loading || serverStatus === 'offline'}
              />
            </div>
            
            <button 
              type="submit" 
              style={styles.primaryButton}
              disabled={loading || serverStatus === 'offline'}
            >
              {loading ? '⏳ AI Analyzing...' : '🤖 Analyze with AI & Continue →'}
            </button>
            
          </form>
        </div>
      )}
      
      {/* ==================== STEP 2: ASSESSMENT ==================== */}
      {currentStep === 2 && (
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>Part 2: Assessment</h2>
          <p style={styles.formDescription}>
            Assess the severity and determine investigation requirements. AI will classify RIDDOR status.
          </p>
          
          {/* Show Part 1 AI Results */}
          {results.part1 && (
            <div style={styles.aiResultsBox}>
              <h4 style={styles.aiResultsTitle}>🤖 AI Analysis - Part 1:</h4>
              <div style={styles.aiResultsGrid}>
                <div>
                  <strong>Incident Type:</strong> {results.part1.incident_type}
                </div>
                <div>
                  <strong>Reference No:</strong> {incidentId}
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
      
      {/* ==================== STEP 3: INVESTIGATION ==================== */}
      {currentStep === 3 && (
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>Part 3: Investigation</h2>
          <p style={styles.formDescription}>
            Provide detailed investigation information. AI will perform 5 Why analysis to identify root causes.
          </p>
          
          {/* Show Part 2 AI Results */}
          {results.part2 && (
            <div style={styles.aiResultsBox}>
              <h4 style={styles.aiResultsTitle}>🤖 AI Analysis - Part 2:</h4>
              <div style={styles.aiResultsGrid}>
                <div>
                  <strong>Investigation Level:</strong> {results.part2.investigation_level}
                </div>
                <div>
                  <strong>RIDDOR Status:</strong> {results.part2.riddor_reportable}
                </div>
                <div>
                  <strong>Priority:</strong> {results.part2.priority}
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handlePart3Submit} style={styles.form}>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>1. Where and when did the event happen?: *</label>
              <input
                type="text"
                style={styles.input}
                value={part3Data.location}
                onChange={(e) => setPart3Data({...part3Data, location: e.target.value})}
                placeholder="Specific location and time details"
                required
                disabled={loading}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>2. Who was injured/involved?: *</label>
              <textarea
                style={styles.textarea}
                value={part3Data.who_involved}
                onChange={(e) => setPart3Data({...part3Data, who_involved: e.target.value})}
                placeholder="Names, roles, experience level..."
                rows={2}
                required
                disabled={loading}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>3. How did the event happen? (Equipment, processes): *</label>
              <textarea
                style={styles.textarea}
                value={part3Data.how_happened}
                onChange={(e) => setPart3Data({...part3Data, how_happened: e.target.value})}
                placeholder="Detailed sequence of events, equipment involved, what went wrong..."
                rows={5}
                required
                disabled={loading}
              />
              <small style={styles.helpText}>
                💡 This is critical for AI root cause analysis - be detailed
              </small>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>4. What activities were being carried out?:</label>
              <textarea
                style={styles.textarea}
                value={part3Data.activities}
                onChange={(e) => setPart3Data({...part3Data, activities: e.target.value})}
                placeholder="Work tasks, procedures being followed..."
                rows={3}
                disabled={loading}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>5. Anything unusual about working conditions?:</label>
              <textarea
                style={styles.textarea}
                value={part3Data.working_conditions}
                onChange={(e) => setPart3Data({...part3Data, working_conditions: e.target.value})}
                placeholder="Weather, lighting, noise, time pressure, etc."
                rows={3}
                disabled={loading}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>6. Were safe working procedures followed?:</label>
              <textarea
                style={styles.textarea}
                value={part3Data.safety_procedures}
                onChange={(e) => setPart3Data({...part3Data, safety_procedures: e.target.value})}
                placeholder="Procedures in place, deviations, shortcuts taken..."
                rows={3}
                disabled={loading}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>7. What injuries/health effects were caused?:</label>
              <textarea
                style={styles.textarea}
                value={part3Data.injuries}
                onChange={(e) => setPart3Data({...part3Data, injuries: e.target.value})}
                placeholder="Description of injuries, treatment required..."
                rows={2}
                disabled={loading}
              />
            </div>
            
            <div style={styles.buttonGroup}>
              <button 
                type="button" 
                style={styles.secondaryButton}
                onClick={() => setCurrentStep(2)}
                disabled={loading}
              >
                ← Back
              </button>
              <button 
                type="submit" 
                style={styles.primaryButton}
                disabled={loading}
              >
                {loading ? '⏳ AI Analyzing Root Causes...' : '🤖 Generate Root Cause Analysis →'}
              </button>
            </div>
            
          </form>
        </div>
      )}
      
      {/* ==================== STEP 4: RESULTS & PDF ==================== */}
      {currentStep === 4 && (
        <div style={styles.resultsContainer}>
          <h2 style={styles.resultsTitle}>✅ Investigation Complete!</h2>
          <p style={styles.resultsSubtitle}>
            AI has completed the full HSG245 investigation analysis.
          </p>
          
          {/* Part 3: Root Cause Analysis Results */}
          <div style={styles.resultCard}>
            <h3 style={styles.resultCardTitle}>🔍 Part 3: Root Cause Analysis</h3>
            
            {results.part3 && (
              <>
                <div style={styles.resultSection}>
                  <h4 style={styles.resultSectionTitle}>⚡ Immediate Causes:</h4>
                  <ul style={styles.resultList}>
                    {results.part3.immediate_causes?.map((cause, i) => (
                      <li key={i} style={styles.resultListItem}>
                        {typeof cause === 'object' ? cause.cause : cause}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div style={styles.resultSection}>
                  <h4 style={styles.resultSectionTitle}>🔧 Underlying Causes:</h4>
                  <ul style={styles.resultList}>
                    {results.part3.underlying_causes?.map((cause, i) => (
                      <li key={i} style={styles.resultListItem}>
                        {typeof cause === 'object' ? cause.cause : cause}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div style={styles.resultSection}>
                  <h4 style={styles.resultSectionTitle}>🎯 Root Causes:</h4>
                  <ul style={styles.resultList}>
                    {results.part3.root_causes?.map((cause, i) => (
                      <li key={i} style={styles.resultListItem}>
                        {typeof cause === 'object' ? cause.cause : cause}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
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
  }
};
