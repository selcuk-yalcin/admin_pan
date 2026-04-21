import axios from 'axios';

// NOTE:
// Interactive chat now uses the same Vercel gateway as the form flow:
// /api/hsg245  ->  Admin/api/hsg245.js  ->  Railway backend
const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function callGateway(action, data) {
  const response = await api.post('/hsg245', { action, data });
  return response.data;
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [String(value)];
}

function buildAssistantMessage({ incidentId, part3, part4, language }) {
  const immediate = toArray(part3?.immediate_causes);
  const root = toArray(part3?.root_causes);
  const actions =
    toArray(part4?.immediate_actions)
      .concat(toArray(part4?.short_term_actions))
      .concat(toArray(part4?.long_term_actions));

  const tr = (language || 'tr').toLowerCase().startsWith('tr');
  const topImmediate = immediate.slice(0, 3).map((x) => `- ${x}`).join('\n') || '- Veri yok';
  const topRoot = root.slice(0, 3).map((x) => `- ${x}`).join('\n') || '- Veri yok';
  const topActions = actions.slice(0, 3).map((x) => `- ${x}`).join('\n') || '- Veri yok';

  if (tr) {
    return [
      `Analiz tamamlandi. Incident ID: ${incidentId}`,
      '',
      'Oncelikli dogrudan nedenler:',
      topImmediate,
      '',
      'Kok nedenler:',
      topRoot,
      '',
      'Onerilen aksiyonlar:',
      topActions,
    ].join('\n');
  }

  return [
    `Analysis completed. Incident ID: ${incidentId}`,
    '',
    'Top immediate causes:',
    topImmediate,
    '',
    'Root causes:',
    topRoot,
    '',
    'Recommended actions:',
    topActions,
  ].join('\n');
}

// Send a chat message and run full RCA pipeline through /api/hsg245
export const sendMessage = async ({ message, sessionId, language }) => {
  try {
    const reporter = sessionId ? `Interactive user ${sessionId}` : 'Interactive user';

    const created = await callGateway('create_incident', {
      reported_by: reporter,
      description: message,
      injury_description: '',
      forwarded_to: '',
      event_category: 'incident',
      date_time: new Date().toISOString(),
    });

    const incidentId = created?.data?.incident_id;
    if (!incidentId) {
      throw new Error('Incident ID not returned by gateway');
    }

    await callGateway('add_assessment', {
      incident_id: incidentId,
      event_type: 'Kaza',
      actual_harm: 'Minor',
      riddor_reportable: 'Unsure',
    });

    const investigated = await callGateway('investigate', {
      incident_id: incidentId,
      location: 'Interactive analysis',
      who_involved: reporter,
      how_happened: message,
      activities: '',
      working_conditions: '',
      safety_procedures: '',
      injuries: '',
    });

    const actionPlan = await callGateway('generate_action_plan', {
      incident_id: incidentId,
    });

    const part3 = investigated?.data || {};
    const part4 = actionPlan?.data || {};

    return {
      message: buildAssistantMessage({
        incidentId,
        part3,
        part4,
        language,
      }),
      suggestions: toArray(part4?.immediate_actions).slice(0, 3),
      startFlow: false,
      flowType: null,
    };
  } catch (error) {
    const detail =
      error?.response?.data?.details ||
      error?.response?.data?.error ||
      error?.message ||
      'Unknown error';
    console.error('Error sending message:', detail);
    throw new Error(detail);
  }
};

// Legacy compatibility wrappers
export const analyzeIncident = async ({ description, language }) =>
  sendMessage({ message: description, sessionId: `batch-${Date.now()}`, language });

export const getAnalysisStatus = async () => ({ status: 'completed' });

export const getAnalysisResult = async () => ({ status: 'completed' });

export const exportReport = async () => {
  throw new Error('Export from interactive analysis is not available in this mode.');
};

export const createWebSocket = () => null;

export default api;
