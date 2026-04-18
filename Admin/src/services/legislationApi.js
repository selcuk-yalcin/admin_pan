/**
 * Legislation RAG API Service
 * Handles communication with the Legislation RAG backend
 */

// Railway Production URL
const LEGISLATION_API_URL = import.meta.env.VITE_LEGISLATION_API_URL || 'https://legislationrag-production.up.railway.app';

console.log('🔗 Legislation API URL:', LEGISLATION_API_URL);

/**
 * Ask a question to the Legislation RAG system
 * @param {string} question - The question to ask
 * @param {Array} conversation_history - Previous conversation history (optional)
 * @returns {Promise<{answer: string, status: string, sources: Array}>}
 */
export const askLegislationQuestion = async (question, conversation_history = []) => {
  try {
    const response = await fetch(`${LEGISLATION_API_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        question,
        conversation_history 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || 'API request failed');
    }

    const data = await response.json();
    return {
      status: 'success',
      ...data
    };
  } catch (error) {
    console.error('Legislation API Error:', error);
    return {
      status: 'error',
      answer: 'Üzgünüm, şu anda mevzuat veritabanına erişimde bir sorun var. Lütfen daha sonra tekrar deneyin.',
      sources: [],
      message: error.message
    };
  }
};

/**
 * Reset the conversation history
 * @returns {Promise<{message: string, status: string}>}
 */
export const resetLegislationConversation = async () => {
  try {
    const response = await fetch(`${LEGISLATION_API_URL}/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Legislation API Reset Error:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
};

/**
 * Check if the Legislation RAG API is healthy
 * @returns {Promise<{status: string, message: string}>}
 */
export const checkLegislationHealth = async () => {
  try {
    const response = await fetch(`${LEGISLATION_API_URL}/health`);
    
    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Legislation Health Check Error:', error);
    return {
      status: 'offline',
      message: error.message
    };
  }
};

/**
 * Get database statistics
 * @returns {Promise<{total_documents: number, total_chunks: number}>}
 */
export const getLegislationStats = async () => {
  try {
    const response = await fetch(`${LEGISLATION_API_URL}/stats`);
    
    if (!response.ok) {
      throw new Error('Stats request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Legislation Stats Error:', error);
    return {
      status: 'error',
      message: error.message,
      total_documents: 0,
      total_chunks: 0
    };
  }
};

/**
 * Format legislation sources from the response
 * @param {string} answer - The answer from the RAG system
 * @returns {Array<{file: string, content: string}>}
 */
export const extractSources = (answer) => {
  // Extract sources from the answer
  // This is a simple implementation, adjust based on your actual format
  const sources = [];
  const sourceRegex = /📄\s*(.+?)\s*\(Sayfa\s*(\d+)\)/g;
  
  let match;
  while ((match = sourceRegex.exec(answer)) !== null) {
    sources.push({
      file: match[1],
      page: match[2],
    });
  }
  
  return sources;
};

/**
 * Submit user feedback (thumbs up/down) for a bot response
 * @param {string} messageId - The message ID
 * @param {string} question - The original question
 * @param {string} answer - The bot's answer
 * @param {string} feedback - "up" or "down"
 * @param {string} comment - Optional user comment for dislike feedback
 * @returns {Promise<{status: string}>}
 */
export const submitFeedback = async (messageId, question, answer, feedback, comment = '') => {
  try {
    const response = await fetch(`${LEGISLATION_API_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message_id: String(messageId),
        question,
        answer,
        feedback, // "up" or "down"
        comment,  // user's feedback comment (dislike only)
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Feedback request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Feedback API Error:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
};

export default {
  askLegislationQuestion,
  resetLegislationConversation,
  checkLegislationHealth,
  getLegislationStats,
  extractSources,
  submitFeedback,
};
