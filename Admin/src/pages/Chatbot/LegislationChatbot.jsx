import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Input,
} from "reactstrap";
import { 
  askLegislationQuestion, 
  resetLegislationConversation, 
  checkLegislationHealth,
  submitFeedback,
} from "../../services/legislationApi";

/* ─── Thinking Steps Config ─── */
const THINKING_STEPS = [
  { id: "analyze", label: "Sorgu analiz ediliyor", detail: "Anahtar kelimeler ve bağlam çıkarılıyor..." },
  { id: "search", label: "Mevzuat taranıyor", detail: "6331 sayılı Kanun ve ilgili yönetmelikler aranıyor..." },
  { id: "match", label: "İlgili maddeler eşleştiriliyor", detail: "En alakalı kanun maddeleri seçiliyor..." },
  { id: "rank", label: "Sonuçlar değerlendiriliyor", detail: "Güvenilirlik skoru hesaplanıyor..." },
  { id: "compose", label: "Yanıt hazırlanıyor", detail: "Kaynaklar ile cevap oluşturuluyor..." },
];

const STEP_INTERVAL = 1800; // ms between each step appearing
const STREAM_SPEED = 12;    // ms per character for typewriter

/* ─── Parse answer text: separate main answer from embedded sources ─── */
const SOURCE_SEPARATOR = /\n?\n?═{5,}/;
const parseAnswer = (rawText) => {
  // Split at the first "═══════" line which starts the sources section
  const parts = rawText.split(SOURCE_SEPARATOR);
  const mainAnswer = (parts[0] || '').trim();
  
  // Parse embedded source blocks from the raw text
  const parsedSources = [];
  const sourceBlockRegex = /📄\s*Kaynak\s*(\d+):\s*(.+?)(?:\n─+\n|\n)([\s\S]*?)(?=📄\s*Kaynak\s*\d+:|═{5,}|💡|$)/g;
  let match;
  while ((match = sourceBlockRegex.exec(rawText)) !== null) {
    const block = match[3];
    const excerptMatch = block.match(/💬\s*Alıntı:\s*"([\s\S]+?)(?:"{1,3}\s*$|"?\s*$)/m);
    parsedSources.push({
      name: match[2].trim(),
      excerpt: excerptMatch ? excerptMatch[1].trim() : '',
    });
  }
  return { mainAnswer, parsedSources };
};

/* ─── Determine source type from API method ─── */
const getSourceType = (method) => {
  if (!method) return { type: 'rag', label: 'Mevzuat' };
  
  switch (method) {
    case 'primary_rag':
    case 'basic_rag':
      return { type: 'rag', label: 'Mevzuat' };
    case 'primary_rag_enriched':
      return { type: 'enriched', label: 'İlgili Düzenlemeler' };
    case 'web_fallback':
      return { type: 'web', label: 'Güncel Mevzuat' };
    case 'enhanced_fallback':
      return { type: 'fallback', label: 'Tahmini Yanıt' };
    case 'gemini_fallback':
    case 'gemini_fallback_openrouter':
    case 'gemini_multi_regulation':
      return { type: 'fallback', label: 'Tahmini Yanıt' };
    case 'guidance':
      return { type: 'fallback', label: 'Yönlendirme' };
    default:
      return { type: 'rag', label: 'Mevzuat' };
  }
};

/* ─── Format markdown text for display ─── */
const cleanSourceName = (name) => {
  let clean = name
    .replace(/\.pdf/gi, '')                    // Remove .pdf anywhere
    .replace(/[,;]\s*MADDE\s*\d+[^]*/gi, '')  // Remove ", MADDE 5..." etc
    .replace(/MADDE\s*\d+/gi, '')              // Remove standalone "MADDE 5"
    .replace(/_/g, ' ')                        // Underscores to spaces
    .replace(/\s{2,}/g, ' ')                   // Multiple spaces to single
    .trim();
  
  // Title case with Turkish locale
  clean = clean
    .toLocaleLowerCase('tr-TR')
    .split(' ')
    .map(w => w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1))
    .join(' ');
  
  // Fix common words
  clean = clean
    .replace(/\bİsg\b/g, 'İSG')
    .replace(/\bSgk\b/g, 'SGK')
    .replace(/\bVe\b/g, 've')
    .replace(/\bDe\b/g, 'de')
    .replace(/\bDa\b/g, 'da')
    .replace(/\bİle\b/g, 'ile')
    .replace(/\bBir\b/g, 'bir')
    .replace(/\bİçin\b/g, 'için');
    
  return clean;
};

const formatMarkdownText = (text, msgSources, onSourceClick) => {
  if (!text) return null;
  
  // Cevap metninden [1] [2] gibi kaynak numaralarını temizle
  let cleanText = text.replace(/\s*\[\d+\]\s*/g, ' ').replace(/\s{2,}/g, ' ');
  
  // (İSGK, md. XX) veya (md. XX) gibi parantez içi referansları temizle
  cleanText = cleanText.replace(/\s*\([^)]*md\.\s*\d+[^)]*\)/gi, '');
  
  // Split by lines
  const lines = cleanText.split('\n');
  const elements = [];
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    
    // Boş satırlar için spacer
    if (!trimmed) {
      elements.push(<div key={`sp-${idx}`} style={{ height: '12px' }} />);
      return;
    }
    
    // Bold formatting
    const parts = [];
    let lastIndex = 0;
    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;
    
    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      parts.push(<strong key={`bold-${idx}-${match.index}`}>{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }
    
    if (parts.length === 0) {
      parts.push(line);
    }
    
    // Bullet point satırı mı? Başlık mı?
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-');
    const isHeading = trimmed.endsWith(':') && !isBullet;
    
    elements.push(
      <div 
        key={idx} 
        className={isBullet ? 'lc-bullet-line' : isHeading ? 'lc-heading-line' : 'lc-text-line'}
        style={isHeading ? { marginTop: idx > 0 ? '20px' : '0' } : {}}
      >
        {parts}
      </div>
    );
  });
  
  return elements;
};

const AIAssistantPanel = () => {
  document.title = "Mevzuat Botu | HSE AgenticAI";
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingMsgId, setStreamingMsgId] = useState(null);
  const [activeThinkingStep, setActiveThinkingStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [thinkingPhase, setThinkingPhase] = useState(false); // true = thinking, false = done
  const [apiStatus, setApiStatus] = useState("checking");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [collapsedThinking, setCollapsedThinking] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [sourcesModal, setSourcesModal] = useState({ isOpen: false, sources: [] });
  const [expandedSource, setExpandedSource] = useState(null);
  const [feedbackState, setFeedbackState] = useState({}); // { [msgId]: "up" | "down" }
  const [feedbackPopup, setFeedbackPopup] = useState({ isOpen: false, message: null }); // dislike comment popup
  const [feedbackComment, setFeedbackComment] = useState('');
  const [sourcePopup, setSourcePopup] = useState({ isOpen: false, rawName: '', cleanName: '', source: null, msgSources: [] });
  const messagesEndRef = useRef(null);
  const streamAbortRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, activeThinkingStep, scrollToBottom]);

  useEffect(() => {
    const checkAPI = async () => {
      const health = await checkLegislationHealth();
      setApiStatus(health.status === "healthy" || health.status === "ok" ? "online" : "offline");
    };
    checkAPI();
    const interval = setInterval(checkAPI, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ─── Typewriter streaming ─── */
  const streamText = useCallback((fullText, msgId, callback) => {
    let idx = 0;
    setIsStreaming(true);
    setStreamingMsgId(msgId);
    setStreamingText("");
    streamAbortRef.current = false;

    const tick = () => {
      if (streamAbortRef.current) {
        // When stopped, show full text immediately
        setStreamingText(fullText);
        setIsStreaming(false);
        setStreamingMsgId(null);
        setStreamingText("");
        if (callback) callback();
        return;
      }
      if (idx < fullText.length) {
        const chunkSize = Math.floor(Math.random() * 4) + 2;
        const nextIdx = Math.min(idx + chunkSize, fullText.length);
        setStreamingText(fullText.slice(0, nextIdx));
        idx = nextIdx;
        const delay = fullText[idx - 1] === '\n' ? STREAM_SPEED * 8 
                    : fullText[idx - 1] === '.' ? STREAM_SPEED * 4 
                    : STREAM_SPEED;
        setTimeout(tick, delay);
      } else {
        setIsStreaming(false);
        setStreamingMsgId(null);
        setStreamingText("");
        if (callback) callback();
      }
    };
    tick();
  }, []);

  /* ─── Run thinking steps ─── */
  const runThinkingSteps = useCallback(() => {
    return new Promise((resolve) => {
      setThinkingPhase(true);
      setActiveThinkingStep(0);
      setCompletedSteps([]);

      let step = 0;
      const advanceStep = () => {
        if (step < THINKING_STEPS.length - 1) {
          setCompletedSteps(prev => [...prev, THINKING_STEPS[step].id]);
          step++;
          setActiveThinkingStep(step);
          setTimeout(advanceStep, STEP_INTERVAL);
        } else {
          // Mark last step completed too
          setCompletedSteps(prev => [...prev, THINKING_STEPS[step].id]);
          resolve();
        }
      };
      setTimeout(advanceStep, STEP_INTERVAL);
    });
  }, []);

  const handleSendMessage = async (questionOverride) => {
    const question = questionOverride || inputMessage;
    if (!question.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const newHistory = [...conversationHistory, { role: "user", content: question }];
    setInputMessage("");
    setIsTyping(true);

    // Start thinking steps + API call in parallel
    const thinkingPromise = runThinkingSteps();
    const apiPromise = askLegislationQuestion(question, newHistory);

    // Wait for BOTH to finish (thinking animation must complete even if API is faster)
    const [, response] = await Promise.all([thinkingPromise, apiPromise]);

    // Small pause after thinking completes
    await new Promise(r => setTimeout(r, 400));
    setThinkingPhase(false);

    const rawAnswer = response.answer || response.message || "Üzgünüm, bir hata oluştu.";
    const { mainAnswer } = parseAnswer(rawAnswer);
    const msgId = Date.now() + 1;
    const responseMethod = response.method || 'basic_rag';

    // API'den gelen sources'ı doğrudan kullan (full_text, source_type, source_url dahil)
    const finalSources = (response.sources || []).map(src => ({
      id: src.id,
      name: src.name || src.title || src.file || 'Kaynak',
      title: src.title || src.name || src.file || 'Kaynak',
      excerpt: src.excerpt || src.text || src.content || '',
      full_text: src.full_text || src.content || '',
      source_type: src.source_type || 'document',
      source_url: src.source_url || '',
      madde_number: src.madde_number || '',
      score: src.score || 0,
    }));
    
    console.log('[DEBUG Frontend] API returned', response.sources?.length || 0, 'sources');
    console.log('[DEBUG Frontend] finalSources length:', finalSources.length);

    const aiResponse = {
      id: msgId,
      type: "assistant",
      text: mainAnswer,
      timestamp: new Date(),
      embeddedSources: finalSources,
      thinkingSteps: [...THINKING_STEPS],
      method: responseMethod,
      sourceType: getSourceType(responseMethod),
    };

    setMessages(prev => [...prev, aiResponse]);
    setConversationHistory([...newHistory, { role: "assistant", content: mainAnswer }]);

    // Save to chat history
    const chatTitle = question.length > 50 ? question.substring(0, 50) + "..." : question;
    const chatId = activeChatId || Date.now();
    
    if (!activeChatId) {
      setActiveChatId(chatId);
      setChatHistory(prev => [
        { 
          id: chatId, 
          title: chatTitle, 
          timestamp: new Date(),
          preview: mainAnswer.substring(0, 60) + "..."
        },
        ...prev
      ]);
    } else {
      // Update existing chat
      setChatHistory(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, timestamp: new Date() }
          : chat
      ));
    }

    // Stream only the main answer (not sources)
    streamText(mainAnswer, msgId, () => {
      setIsTyping(false);
    });
  };

  const handleQuestionClick = (question) => {
    handleSendMessage(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = async () => {
    streamAbortRef.current = true;
    await resetLegislationConversation();
    setMessages([]);
    setConversationHistory([]);
    setIsTyping(false);
    setIsStreaming(false);
    setThinkingPhase(false);
    setActiveThinkingStep(-1);
    setCompletedSteps([]);
    setCollapsedThinking({});
    setActiveChatId(null);
  };

  const toggleThinking = (msgId) => {
    setCollapsedThinking(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleStop = () => {
    streamAbortRef.current = true;
    setIsStreaming(false);
    setIsTyping(false);
    setThinkingPhase(false);
    setStreamingMsgId(null);
    setStreamingText("");
  };

  const handleFeedback = async (message, type) => {
    // If already selected same type, unselect it
    if (feedbackState[message.id] === type) {
      setFeedbackState(prev => {
        const newState = { ...prev };
        delete newState[message.id];
        return newState;
      });
      return;
    }
    
    // If dislike, open feedback comment popup first
    if (type === 'down') {
      setFeedbackPopup({ isOpen: true, message });
      setFeedbackComment('');
      return;
    }

    // For "up" - send immediately
    setFeedbackState(prev => ({ ...prev, [message.id]: type }));
    
    // Find the user question for this assistant message
    const msgIndex = messages.findIndex(m => m.id === message.id);
    const userQuestion = msgIndex > 0 ? messages[msgIndex - 1]?.text || "" : "";
    
    // Send to backend
    await submitFeedback(message.id, userQuestion, message.text, type);
  };

  const handleFeedbackSubmit = async (withComment = true) => {
    const message = feedbackPopup.message;
    if (!message) return;

    setFeedbackState(prev => ({ ...prev, [message.id]: 'down' }));
    setFeedbackPopup({ isOpen: false, message: null });

    const msgIndex = messages.findIndex(m => m.id === message.id);
    const userQuestion = msgIndex > 0 ? messages[msgIndex - 1]?.text || "" : "";

    await submitFeedback(message.id, userQuestion, message.text, 'down', withComment ? feedbackComment : '');
    setFeedbackComment('');
  };

  const isWelcome = messages.length === 0;

  /* ─── Handle source badge click ─── */
  const handleBadgeClick = useCallback((rawName, cleanName, msgSources) => {
    // Find matching source from the message's embedded sources
    const matchedSource = (msgSources || []).find(src => {
      const srcClean = cleanSourceName(src.name || '');
      return srcClean === cleanName || 
             (src.name || '').toLowerCase().includes(rawName.toLowerCase().replace(/\.pdf/i, '')) ||
             rawName.toLowerCase().includes((src.name || '').toLowerCase().replace(/\.pdf/i, ''));
    });
    
    setSourcePopup({
      isOpen: true,
      rawName,
      cleanName,
      source: matchedSource || null,
      msgSources: msgSources || []
    });
  }, []);

  const BotIcon = ({ size = 52 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="9" cy="16" r="1" fill="#6366f1" />
      <circle cx="15" cy="16" r="1" fill="#6366f1" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <line x1="12" y1="4" x2="12" y2="2" />
      <circle cx="12" cy="2" r="0.5" fill="#6366f1" />
    </svg>
  );

  /* ─── Thinking Steps Component (live) - Simple thinking bar ─── */
  const LiveThinkingSteps = () => (
    <div className="lc-think-box">
      <div className="lc-think-title">
        <div className="lc-think-spinner" />
        <span>Mevzuatlar taranıyor...</span>
      </div>
      <div className="lc-think-progress">
        <div className="lc-think-progress-bar" />
      </div>
      <div className="lc-think-steps">
        {THINKING_STEPS.map((step, idx) => {
          const isActive = idx === activeThinkingStep;
          const isCompleted = completedSteps.includes(step.id);
          const isVisible = idx <= activeThinkingStep;
          if (!isVisible) return null;
          return (
            <div key={step.id} className={`lc-think-step ${isActive ? 'lc-think-step--active' : ''} ${isCompleted ? 'lc-think-step--done' : ''}`}>
              <div className="lc-think-step-icon">
                {isCompleted ? (
                  <div className="lc-step-dot lc-step-dot--done"></div>
                ) : (
                  <div className="lc-step-dot"></div>
                )}
              </div>
              <span className="lc-think-step-label">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ─── Collapsed Thinking (after answer) - simple toggle ─── */
  const CollapsedThinking = ({ msgId, steps }) => {
    const isOpen = !!collapsedThinking[msgId]; // default collapsed
    return (
      <div className="lc-think-collapsed">
        <button className="lc-think-toggle" onClick={() => toggleThinking(msgId)}>
          <div className="lc-think-toggle-dot" />
          <span>Arama süreci</span>
          <svg className={`lc-think-chevron ${isOpen ? 'lc-think-chevron--open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {isOpen && (
          <div className="lc-think-detail-list">
            {steps.map((step) => (
              <div key={step.id} className="lc-think-detail-row">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span>{step.icon} {step.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <React.Fragment>
      <div className="lc-root">
        {/* ═══════ SIDEBAR ═══════ */}
        <div className={`lc-sidebar ${sidebarOpen ? 'lc-sidebar--open' : ''}`}>
          <div className="lc-sidebar-header">
            <button className="lc-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {sidebarOpen ? (
                  <><path d="M15 18l-6-6 6-6"/></>
                ) : (
                  <><path d="M9 18l6-6-6-6"/></>
                )}
              </svg>
            </button>
            {sidebarOpen && (
              <>
                <h3 className="lc-sidebar-title">Sohbet Geçmişi</h3>
                <button className="lc-new-chat-btn" onClick={handleReset}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
              </>
            )}
          </div>
          
          {sidebarOpen && (
            <div className="lc-sidebar-content">
              {chatHistory.length === 0 ? (
                <div className="lc-sidebar-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <p>Henüz sohbet yok</p>
                  <small>Yeni bir soru sorun</small>
                </div>
              ) : (
                <>
                  <div className="lc-sidebar-section">
                    <h4 className="lc-sidebar-section-title">BUGÜN</h4>
                    {chatHistory.filter(chat => {
                      const today = new Date();
                      const chatDate = new Date(chat.timestamp);
                      return chatDate.toDateString() === today.toDateString();
                    }).map(chat => (
                      <div 
                        key={chat.id} 
                        className={`lc-chat-item ${activeChatId === chat.id ? 'lc-chat-item--active' : ''}`}
                        onClick={() => setActiveChatId(chat.id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <div className="lc-chat-item-content">
                          <span className="lc-chat-item-title">{chat.title}</span>
                          <span className="lc-chat-item-preview">{chat.preview}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {chatHistory.filter(chat => {
                    const today = new Date();
                    const chatDate = new Date(chat.timestamp);
                    return chatDate.toDateString() !== today.toDateString();
                  }).length > 0 && (
                    <div className="lc-sidebar-section">
                      <h4 className="lc-sidebar-section-title">ÖNCEKİ</h4>
                      {chatHistory.filter(chat => {
                        const today = new Date();
                        const chatDate = new Date(chat.timestamp);
                        return chatDate.toDateString() !== today.toDateString();
                      }).map(chat => (
                        <div 
                          key={chat.id} 
                          className={`lc-chat-item ${activeChatId === chat.id ? 'lc-chat-item--active' : ''}`}
                          onClick={() => setActiveChatId(chat.id)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                          <div className="lc-chat-item-content">
                            <span className="lc-chat-item-title">{chat.title}</span>
                            <span className="lc-chat-item-preview">{chat.preview}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {sidebarOpen && (
            <div className="lc-sidebar-footer">
              <button className="lc-admin-btn" onClick={() => navigate('/dashboard')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                Admin Panel
              </button>
            </div>
          )}
        </div>        <div className="lc-container">

          {/* Floating sidebar toggle - only when sidebar is closed */}
          {!sidebarOpen && (
            <button className="lc-sidebar-float-toggle" onClick={() => setSidebarOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          )}
          {isWelcome && (
            <div className="lc-welcome">
              <div className="lc-welcome-icon">
                <BotIcon size={52} />
                <span className="lc-status-dot" data-status={apiStatus} />
              </div>
              <h1 className="lc-welcome-title">Mevzuat Botu <span className="lc-beta-badge">BETA</span></h1>
              <p className="lc-welcome-desc">
                Yapay zeka ile 6331 sayılı Kanun ve ilgili yönetmelikleri saniyeler<br/>içinde tarayın ve analiz edin.
              </p>
              <div className="lc-welcome-input-wrap">
                <div className="lc-welcome-input-box">
                  <Input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Mevzuat hakkında bir soru sorun..."
                    className="lc-welcome-input"
                  />
                  <button
                    className="lc-welcome-send"
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isTyping}
                    data-active={String(!!inputMessage.trim())}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                  </button>
                </div>
                <p className="lc-welcome-disclaimer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,verticalAlign:-2,opacity:.5}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  Yapay zeka hata yapabilir. Lütfen çıktıları Resmi Gazete'den kontrol ediniz.
                </p>
              </div>
              <div className="lc-quick-buttons">
                {[
                  { label: "Acil Durum Planı", q: "Acil durum planı nasıl hazırlanır?" },
                  { label: "Gece Çalışması", q: "Gece çalışması şartları nelerdir?" },
                  { label: "Risk Değerlendirmesi", q: "Risk değerlendirmesi nasıl yapılır?" },
                ].map((item, idx) => (
                  <button key={idx} className="lc-quick-btn" onClick={() => handleQuestionClick(item.q)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ═══════ CHAT SCREEN ═══════ */}
          {!isWelcome && (
            <div className="lc-chat-screen">
              <div className="lc-chat-header">
                <div className="lc-chat-header-left">
                  <div className="lc-chat-header-icon">
                    <BotIcon size={22} />
                    <span className="lc-header-status" data-status={apiStatus} />
                  </div>
                  <span className="lc-chat-header-title">Mevzuat Botu</span>
                </div>
                <div className="lc-chat-header-beta-info" title="Bu uygulama geliştirme aşamasındadır. Beğenmediğiniz veya eksik bulduğunuz yanıtları 👎 butonuna tıklayarak bildirebilirsiniz.">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,flexShrink:0}}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span style={{fontSize:11,color:'#94a3b8',lineHeight:1.3}}>Beta surumdur. Onerilerinizi 👎 ile paylasabilirsiniz.</span>
                </div>
              </div>

              <div className="lc-chat-messages">
                <div className="lc-chat-messages-inner">
                  {messages.map((message) => (
                    <div key={message.id} className={`lc-msg lc-msg--${message.type}`}>
                      {message.type === "assistant" && (
                        <div className="lc-msg-avatar"><BotIcon size={20} /></div>
                      )}
                      <div className={`lc-msg-content-wrap lc-msg-content-wrap--${message.type}`}>
                        
                        {/* Collapsed thinking for completed assistant messages */}
                        {message.type === "assistant" && message.thinkingSteps && (
                          <CollapsedThinking 
                            msgId={message.id} 
                            steps={message.thinkingSteps} 
                          />
                        )}

                        <div className={`lc-msg-bubble lc-msg-bubble--${message.type}${message.sourceType ? ` lc-msg-bubble--${message.sourceType.type}` : ''}`}>
                          {/* Source type label removed - users see source from badges */}
                          <div className="lc-msg-text">
                            {/* Show streaming text or final text */}
                            {streamingMsgId === message.id ? (
                              <>
                                {streamingText}
                                <span className="lc-cursor" />
                              </>
                            ) : (
                              // Format markdown for assistant messages with Perplexity-style citations
                              message.type === "assistant" 
                                ? formatMarkdownText(message.text, message.embeddedSources, setSourcePopup)
                                : message.text
                            )}
                          </div>
                        </div>

                        {/* References - show as button that opens modal */}
                        {message.type === "assistant" && streamingMsgId !== message.id && message.embeddedSources && message.embeddedSources.length > 0 && (
                          <button 
                            className="lc-sources-btn"
                            onClick={() => { setExpandedSource(null); setSourcesModal({ isOpen: true, sources: message.embeddedSources }); }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                            </svg>
                            <span>{message.embeddedSources.length} Kaynak</span>
                          </button>
                        )}

                        {/* Actions - only show when done */}
                        {message.type === "assistant" && streamingMsgId !== message.id && (
                          <>
                            <div className="lc-msg-actions">
                              <button className="lc-action-btn" onClick={() => navigator.clipboard.writeText(message.text)} title="Kopyala">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                              </button>
                              <button 
                                className={`lc-action-btn ${feedbackState[message.id] === 'up' ? 'lc-action-btn--active-up' : ''}`} 
                                onClick={() => handleFeedback(message, 'up')} 
                                title="Beğen"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill={feedbackState[message.id] === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                              </button>
                              <button 
                                className={`lc-action-btn ${feedbackState[message.id] === 'down' ? 'lc-action-btn--active-down' : ''}`} 
                                onClick={() => handleFeedback(message, 'down')} 
                                title="Beğenme"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill={feedbackState[message.id] === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                              </button>
                            </div>
                            <p className="lc-feedback-hint">
                              Beğendiniz mi? Geri bildiriminiz sistemin gelişimine yardımcı olur.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Live thinking indicator */}
                  {thinkingPhase && (
                    <div className="lc-msg lc-msg--assistant">
                      <div className="lc-msg-avatar"><BotIcon size={20} /></div>
                      <div className="lc-msg-content-wrap lc-msg-content-wrap--assistant">
                        <LiveThinkingSteps />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="lc-chat-input-area">
                {/* Stop button - show while typing/streaming */}
                {(isTyping || isStreaming) && (
                  <div className="lc-stop-wrap">
                    <button className="lc-stop-btn" onClick={handleStop}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                      <span>Durdur</span>
                    </button>
                  </div>
                )}
                <div className="lc-chat-input-box">
                  <Input
                    type="textarea"
                    rows="1"
                    placeholder="Mevzuat hakkında bir soru sorun..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="lc-chat-input"
                    disabled={isTyping}
                  />
                  <button
                    className="lc-chat-send"
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isTyping}
                    data-active={String(!!inputMessage.trim() && !isTyping)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                  </button>
                </div>
                <p className="lc-chat-disclaimer">
                  Yapay zeka hata yapabilir. Lütfen çıktıları Resmi Gazete'den kontrol ediniz.
                </p>
                <p className="lc-chat-footer">Design & Develop by InferaWorld</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sources Modal */}
      {sourcesModal.isOpen && (
        <div className="lc-modal-overlay" onClick={() => setSourcesModal({ isOpen: false, sources: [] })}>
          <div className="lc-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="lc-modal-header">
              <h3 className="lc-modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:8,verticalAlign:-3}}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                Kaynaklar
              </h3>
              <button 
                className="lc-modal-close"
                onClick={() => setSourcesModal({ isOpen: false, sources: [] })}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="lc-modal-body">
              {sourcesModal.sources.map((src, idx) => {
                const displayName = cleanSourceName(src.name || src.title || 'Kaynak');
                const excerpt = src.excerpt || '';
                const fullText = src.full_text || src.content || excerpt || '';
                const sourceType = src.source_type || 'document';
                const isExpanded = expandedSource === idx;
                const previewText = excerpt.length > 100 ? excerpt.slice(0, 100) + '…' : excerpt;
                return (
                  <div
                    key={idx}
                    className={`lc-modal-source-item ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => setExpandedSource(isExpanded ? null : idx)}
                  >
                    <div className="lc-modal-source-header">
                      <span className={`lc-modal-source-number ${sourceType === 'guide' ? 'lc-source-guide' : ''}`}>{idx + 1}</span>
                      <div className="lc-modal-source-info">
                        <h4 className="lc-modal-source-name">
                          {displayName}
                        </h4>
                        {!isExpanded && previewText && (
                          <p className="lc-modal-source-preview">{previewText}</p>
                        )}
                      </div>
                      <span className={`lc-modal-chevron ${isExpanded ? 'open' : ''}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </span>
                    </div>
                    {isExpanded && fullText && (
                      <div className="lc-modal-source-excerpt">
                        {fullText}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ SOURCE POPUP (Citation Badge Click) ═══════ */}
      {sourcePopup.isOpen && sourcePopup.source && (
        <div className="lc-modal-overlay" onClick={() => setSourcePopup({ isOpen: false, source: null, msgSources: [] })}>
          <div className="lc-popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="lc-popup-header">
              <div className="lc-popup-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div className="lc-popup-title-wrap">
                <h3 className="lc-popup-title">{cleanSourceName(sourcePopup.source.name || sourcePopup.source.title || 'Kaynak')}</h3>
                <span className="lc-popup-subtitle">
                  {sourcePopup.source.source_type === 'guide' ? 'Rehber Dokümanı' : 'Mevzuat Kaynağı'}
                </span>
              </div>
              <button 
                className="lc-modal-close"
                onClick={() => setSourcePopup({ isOpen: false, source: null, msgSources: [] })}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="lc-popup-body">
              {sourcePopup.source.full_text && (
                <div className="lc-popup-excerpt-full">
                  <div className="lc-popup-excerpt-text-full">
                    {sourcePopup.source.full_text}
                  </div>
                </div>
              )}
              {sourcePopup.source.source_url && (
                <div className="lc-popup-link-section">
                  <a 
                    href={sourcePopup.source.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="lc-popup-link"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Resmi Gazete'de Görüntüle
                  </a>
                </div>
              )}
            </div>
            <div className="lc-popup-footer">
              <span className="lc-popup-footer-text">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,verticalAlign:-1}}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                Bu metin, RAG sistemi tarafından otomatik olarak alınmıştır
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ FEEDBACK COMMENT POPUP (Dislike) ═══════ */}
      {feedbackPopup.isOpen && (
        <div className="lc-modal-overlay" onClick={() => { setFeedbackPopup({ isOpen: false, message: null }); setFeedbackComment(''); }}>
          <div className="lc-feedback-popup" onClick={(e) => e.stopPropagation()}>
            <div className="lc-feedback-popup-header">
              <div className="lc-feedback-popup-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                </svg>
              </div>
              <div className="lc-feedback-popup-title-wrap">
                <h3 className="lc-feedback-popup-title">Geri Bildirim</h3>
                <span className="lc-feedback-popup-subtitle">Bu yanıtta neyi eksik buldunuz?</span>
              </div>
              <button 
                className="lc-modal-close"
                onClick={() => { setFeedbackPopup({ isOpen: false, message: null }); setFeedbackComment(''); }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="lc-feedback-popup-body">
              <textarea
                className="lc-feedback-textarea"
                placeholder="Yanıtla ilgili görüşlerinizi buraya yazabilirsiniz... (ör: Yanlış bilgi içeriyor, eksik kaynak, ilgisiz cevap vb.)"
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                rows={4}
                autoFocus
              />
            </div>
            <div className="lc-feedback-popup-actions">
              <button 
                className="lc-feedback-btn lc-feedback-btn--skip"
                onClick={() => handleFeedbackSubmit(false)}
              >
                Yorum Yazmadan Gönder
              </button>
              <button 
                className="lc-feedback-btn lc-feedback-btn--send"
                onClick={() => handleFeedbackSubmit(true)}
                disabled={!feedbackComment.trim()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .lc-root{
          position:fixed;top:0;left:0;right:0;bottom:0;
          background:#f0f2f5;overflow:hidden;
          font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;
          display:flex;z-index:1000;
        }
        
        /* ══════ SIDEBAR ══════ */
        .lc-sidebar{
          width:280px;background:#fff;border-right:1px solid #e2e8f0;
          display:flex;flex-direction:column;transition:all .3s;flex-shrink:0;
          overflow:hidden;
        }
        .lc-sidebar:not(.lc-sidebar--open){width:0;border-right:none;min-width:0}
        .lc-sidebar-header{
          display:flex;align-items:center;gap:12px;padding:16px;
          border-bottom:1px solid #f1f5f9;flex-shrink:0;
        }
        .lc-sidebar-toggle{
          width:32px;height:32px;border-radius:8px;border:none;
          background:#f8fafc;color:#64748b;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          transition:all .15s;flex-shrink:0;
        }
        .lc-sidebar-toggle:hover{background:#f1f5f9;color:#334155}
        .lc-sidebar-title{
          font-size:14px;font-weight:700;color:#0f172a;margin:0;flex:1;
        }
        .lc-new-chat-btn{
          width:32px;height:32px;border-radius:8px;border:none;
          background:#6366f1;color:#fff;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          transition:all .15s;flex-shrink:0;
        }
        .lc-new-chat-btn:hover{background:#4f46e5;transform:scale(1.05)}
        
        .lc-sidebar-footer{
          padding:12px;border-top:1px solid #f1f5f9;flex-shrink:0;
        }
        .lc-admin-btn{
          width:100%;display:flex;align-items:center;justify-content:center;
          gap:8px;padding:10px 16px;border-radius:10px;border:1px solid #e2e8f0;
          background:#f8fafc;color:#475569;font-size:13px;font-weight:600;
          cursor:pointer;transition:all .15s;
        }
        .lc-admin-btn:hover{background:#eef2ff;color:#6366f1;border-color:#c7d2fe}
        
        .lc-sidebar-content{
          flex:1;overflow-y:auto;padding:12px 8px;
        }
        .lc-sidebar-empty{
          display:flex;flex-direction:column;align-items:center;
          justify-content:center;padding:40px 20px;text-align:center;
          opacity:.5;
        }
        .lc-sidebar-empty p{
          font-size:14px;font-weight:600;color:#64748b;margin:12px 0 4px;
        }
        .lc-sidebar-empty small{font-size:12px;color:#94a3b8}
        
        .lc-sidebar-section{margin-bottom:24px}
        .lc-sidebar-section-title{
          font-size:11px;font-weight:700;letter-spacing:1px;
          color:#94a3b8;padding:8px 12px 6px;margin:0;
        }
        
        .lc-chat-item{
          display:flex;align-items:start;gap:10px;padding:10px 12px;
          border-radius:10px;cursor:pointer;transition:all .15s;
          margin-bottom:4px;
        }
        .lc-chat-item:hover{background:#f8fafc}
        .lc-chat-item--active{background:#ede9fe}
        .lc-chat-item svg{flex-shrink:0;margin-top:2px;color:#64748b}
        .lc-chat-item--active svg{color:#7c3aed}
        .lc-chat-item-content{
          flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;
        }
        .lc-chat-item-title{
          font-size:13px;font-weight:500;color:#334155;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
        }
        .lc-chat-item--active .lc-chat-item-title{color:#7c3aed}
        .lc-chat-item-preview{
          font-size:11px;color:#94a3b8;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
        }
        
        .lc-container{width:100%;height:100%;display:flex;flex-direction:column;position:relative}
        
        .lc-sidebar-float-toggle{
          position:absolute;top:16px;left:16px;z-index:10;
          width:38px;height:38px;border-radius:10px;border:1px solid #e2e8f0;
          background:#fff;color:#64748b;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 8px rgba(0,0,0,.08);
          transition:all .2s;
        }
        .lc-sidebar-float-toggle:hover{
          background:#f8fafc;color:#6366f1;border-color:#c7d2fe;
          box-shadow:0 4px 12px rgba(99,102,241,.12);
        }

        /* ── Welcome ── */
        .lc-welcome{
          flex:1;display:flex;flex-direction:column;
          align-items:center;justify-content:center;padding:20px 24px 24px;
        }
        .lc-welcome-icon{
          position:relative;width:88px;height:88px;background:#fff;border-radius:22px;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 24px rgba(0,0,0,.06);margin-bottom:20px;
        }
        .lc-status-dot{
          position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;
          border-radius:50%;border:3px solid #f0f2f5;
        }
        .lc-status-dot[data-status="online"]{background:#10b981}
        .lc-status-dot[data-status="offline"],.lc-status-dot[data-status="checking"]{background:#94a3b8}
        .lc-welcome-title{font-size:34px;font-weight:800;color:#0f172a;margin:0 0 10px;letter-spacing:-.5px}
        .lc-beta-badge{
          display:inline-block;font-size:11px;font-weight:700;
          background:#f1f5f9;color:#64748b;padding:4px 10px;
          border-radius:6px;margin-left:12px;letter-spacing:.5px;
          vertical-align:middle;
        }
        .lc-welcome-desc{font-size:16px;color:#64748b;line-height:1.7;text-align:center;margin:0 0 28px;max-width:600px}
        .lc-welcome-input-wrap{width:100%;max-width:680px;margin-bottom:20px}
        .lc-welcome-input-box{
          background:#fff;border-radius:28px;box-shadow:0 2px 20px rgba(0,0,0,.06);
          border:1.5px solid #e2e8f0;display:flex;align-items:center;
          padding:6px 6px 6px 24px;transition:all .2s;
        }
        .lc-welcome-input-box:focus-within{border-color:#6366f1;box-shadow:0 4px 28px rgba(99,102,241,.12)}
        .lc-welcome-input{
          border:none!important;box-shadow:none!important;background:transparent!important;
          font-size:16px;color:#0f172a;padding:14px 0!important;flex:1;
        }
        .lc-welcome-input::placeholder{color:#94a3b8}
        .lc-welcome-send{
          width:48px;height:48px;border-radius:50%;border:none;
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;transition:all .15s;flex-shrink:0;color:#fff;background:#1e293b;
        }
        .lc-welcome-send[data-active="false"]{background:#e2e8f0;color:#94a3b8;cursor:default}
        .lc-welcome-send:hover:not(:disabled){transform:scale(1.05)}
        .lc-welcome-disclaimer{text-align:center;font-size:13px;color:#94a3b8;margin-top:14px;margin-bottom:0}
        .lc-quick-buttons{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
        .lc-quick-btn{
          background:#fff;border:1px solid #e2e8f0;border-radius:24px;
          padding:10px 22px;font-size:14px;font-weight:500;color:#334155;
          cursor:pointer;transition:all .15s;white-space:nowrap;
        }
        .lc-quick-btn:hover{border-color:#6366f1;color:#6366f1;transform:translateY(-1px);box-shadow:0 4px 12px rgba(99,102,241,.1)}

        /* ── Chat ── */
        .lc-chat-screen{display:flex;flex-direction:column;height:100%;overflow:hidden}
        .lc-chat-header{
          display:flex;align-items:center;justify-content:space-between;
          padding:16px 32px;background:#fff;border-bottom:1px solid #e2e8f0;flex-shrink:0;
        }
        .lc-chat-header-left{display:flex;align-items:center;gap:10px}
        .lc-chat-header-icon{
          position:relative;width:36px;height:36px;background:#f0f0ff;border-radius:10px;
          display:flex;align-items:center;justify-content:center;
        }
        .lc-header-status{
          position:absolute;bottom:-1px;right:-1px;width:10px;height:10px;
          border-radius:50%;border:2px solid #fff;
        }
        .lc-header-status[data-status="online"]{background:#10b981}
        .lc-header-status[data-status="offline"],.lc-header-status[data-status="checking"]{background:#94a3b8}
        .lc-chat-header-title{font-size:16px;font-weight:600;color:#0f172a}
        .lc-chat-header-beta-info{display:flex;align-items:center;padding:4px 10px;margin-left:auto;background:rgba(245,158,11,0.08);border-radius:8px;max-width:320px}

        .lc-chat-messages{flex:1;overflow-y:auto;padding:32px 0;min-height:0}
        .lc-chat-messages-inner{max-width:860px;margin:0 auto;padding:0 32px}
        .lc-msg{display:flex;gap:14px;margin-bottom:28px}
        .lc-msg--user{justify-content:flex-end}
        .lc-msg-avatar{
          width:36px;height:36px;border-radius:10px;background:#f0f0ff;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;
        }
        .lc-msg-content-wrap{min-width:0}
        .lc-msg-content-wrap--user{max-width:70%}
        .lc-msg-content-wrap--assistant{max-width:100%;flex:1}

        .lc-msg-bubble{border-radius:16px;overflow-wrap:break-word}
        .lc-msg-bubble--user{background:#1e293b;color:#fff;padding:14px 20px;border-radius:16px 16px 4px 16px}
        .lc-msg-bubble--assistant{
          background:#fff;color:#1e293b;padding:28px 32px;
          border-radius:16px 16px 16px 4px;
          box-shadow:0 1px 8px rgba(0,0,0,.04);border:1px solid #f1f5f9;
        }

        /* ── Source Type Visual Differentiation ── */
        .lc-msg-bubble--rag,
        .lc-msg-bubble--enriched,
        .lc-msg-bubble--fallback{
          border-left:3px solid #cbd5e1;
        }
        
        .lc-source-label{
          display:inline-flex;align-items:center;
          padding:4px 10px;margin-bottom:12px;
          border-radius:4px;font-size:10.5px;font-weight:600;
          letter-spacing:.3px;text-transform:uppercase;
          background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;
        }
        .lc-source-label-text{white-space:nowrap}
        .lc-msg-text{white-space:pre-wrap;font-size:15.5px;line-height:1.9;letter-spacing:.01em;word-break:break-word}
        .lc-msg-bubble--user .lc-msg-text{font-size:15px;line-height:1.6}
        .lc-msg-text strong{font-weight:700;color:#0f172a}
        
        /* ── Text & Bullet Lines ── */
        .lc-text-line{margin:4px 0;line-height:2.0}
        .lc-bullet-line{margin:14px 0;padding-left:0;line-height:2.0}
        .lc-heading-line{margin:22px 0 14px 0;font-weight:600;line-height:1.8}

        /* ── Source Name Badge (Clickable) ── */
        .lc-source-badge{
          display:inline-flex;align-items:center;
          padding:3px 10px;margin:0 3px;
          background:linear-gradient(135deg,#eef2ff,#e0e7ff);
          border:1.5px solid #c7d2fe;border-radius:8px;
          font-size:11.5px;font-weight:600;color:#4f46e5;
          letter-spacing:.2px;
          transition:all .2s cubic-bezier(.4,0,.2,1);
          cursor:pointer;
          vertical-align:middle;line-height:1.5;
          max-width:100%;word-break:break-word;
          box-shadow:0 1px 3px rgba(99,102,241,.15);
        }
        .lc-source-badge:hover{
          background:linear-gradient(135deg,#ddd6fe,#c7d2fe);
          border-color:#a5b4fc;color:#3730a3;
          box-shadow:0 2px 8px rgba(99,102,241,.25);
          transform:translateY(-1px);
        }
        .lc-source-badge:active{
          transform:translateY(0);
        }
        .lc-source-badge svg{
          color:#818cf8;flex-shrink:0;
        }

        /* ══════ SOURCE POPUP ══════ */
        .lc-popup-content{
          background:#fff;border-radius:20px;
          width:92%;max-width:700px;max-height:85vh;
          display:flex;flex-direction:column;
          box-shadow:0 24px 48px rgba(0,0,0,.2);
          animation:lc-modalSlideUp .3s ease-out;
        }
        .lc-popup-header{
          display:flex;align-items:center;gap:12px;
          padding:20px 22px 16px;border-bottom:1px solid #f1f5f9;flex-shrink:0;
        }
        .lc-popup-icon{
          width:40px;height:40px;border-radius:12px;
          background:linear-gradient(135deg,#eef2ff,#e0e7ff);
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .lc-popup-title-wrap{flex:1;min-width:0}
        .lc-popup-title{
          font-size:15px;font-weight:700;color:#0f172a;margin:0;
          line-height:1.3;
        }
        .lc-popup-subtitle{
          font-size:11px;font-weight:500;color:#94a3b8;
          letter-spacing:.3px;text-transform:uppercase;
        }
        .lc-popup-body{
          flex:1;overflow-y:auto;padding:16px 22px;
          display:flex;flex-direction:column;gap:12px;
        }
        .lc-popup-excerpt-full{
          display:flex;flex-direction:column;gap:10px;
        }
        .lc-popup-excerpt-header{
          display:flex;align-items:center;gap:8px;
          font-size:13px;font-weight:600;color:#6366f1;
        }
        .lc-popup-excerpt-text-full{
          padding:16px 18px;background:#f8fafc;
          border-left:3px solid #6366f1;border-radius:0 12px 12px 0;
          font-size:13.5px;line-height:1.9;color:#1e293b;
          white-space:pre-wrap;word-break:break-word;
        }
        .lc-popup-info{
          display:flex;align-items:start;gap:10px;
          padding:14px 16px;background:#eef2ff;border-radius:10px;
          font-size:13px;color:#4338ca;line-height:1.6;
        }
        .lc-popup-info svg{flex-shrink:0;margin-top:2px}
        .lc-popup-link-section{
          display:flex;justify-content:center;padding-top:6px;
        }
        .lc-popup-link{
          display:inline-flex;align-items:center;gap:6px;
          padding:10px 18px;background:#6366f1;color:#fff;
          border-radius:10px;font-size:13px;font-weight:600;
          text-decoration:none;
          transition:all .2s;
          box-shadow:0 2px 6px rgba(99,102,241,.3);
        }
        .lc-popup-link:hover{
          background:#4f46e5;
          box-shadow:0 4px 12px rgba(99,102,241,.5);
          transform:translateY(-1px);
        }
        .lc-popup-link:active{
          transform:translateY(0);
        }
        .lc-popup-footer{
          padding:12px 22px;border-top:1px solid #f1f5f9;
          display:flex;justify-content:center;flex-shrink:0;
        }
        .lc-popup-footer-text{
          font-size:11px;color:#94a3b8;font-style:italic;
        }

        /* ══════ FEEDBACK COMMENT POPUP ══════ */
        .lc-feedback-popup{
          background:#fff;border-radius:20px;
          width:92%;max-width:480px;
          display:flex;flex-direction:column;
          box-shadow:0 24px 48px rgba(0,0,0,.2);
          animation:lc-modalSlideUp .3s ease-out;
        }
        .lc-feedback-popup-header{
          display:flex;align-items:center;gap:12px;
          padding:20px 22px 16px;border-bottom:1px solid #f1f5f9;
        }
        .lc-feedback-popup-icon{
          width:40px;height:40px;border-radius:12px;
          background:linear-gradient(135deg,#fef2f2,#fee2e2);
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .lc-feedback-popup-title-wrap{flex:1;min-width:0}
        .lc-feedback-popup-title{
          font-size:15px;font-weight:700;color:#0f172a;margin:0;line-height:1.3;
        }
        .lc-feedback-popup-subtitle{
          font-size:12px;color:#64748b;margin-top:2px;display:block;
        }
        .lc-feedback-popup-body{
          padding:16px 22px;
        }
        .lc-feedback-textarea{
          width:100%;border:1.5px solid #e2e8f0;border-radius:12px;
          padding:12px 14px;font-size:13.5px;line-height:1.7;
          color:#1e293b;background:#f8fafc;resize:vertical;
          min-height:100px;max-height:200px;
          font-family:inherit;outline:none;
          transition:border-color .2s,box-shadow .2s;
        }
        .lc-feedback-textarea:focus{
          border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.1);
          background:#fff;
        }
        .lc-feedback-textarea::placeholder{
          color:#94a3b8;font-size:13px;
        }
        .lc-feedback-popup-actions{
          display:flex;align-items:center;justify-content:flex-end;gap:10px;
          padding:14px 22px;border-top:1px solid #f1f5f9;
        }
        .lc-feedback-btn{
          padding:8px 18px;border-radius:10px;font-size:13px;
          font-weight:600;cursor:pointer;border:none;
          display:flex;align-items:center;gap:6px;
          transition:all .2s;
        }
        .lc-feedback-btn--skip{
          background:transparent;color:#64748b;
        }
        .lc-feedback-btn--skip:hover{
          background:#f1f5f9;color:#475569;
        }
        .lc-feedback-btn--send{
          background:#6366f1;color:#fff;
        }
        .lc-feedback-btn--send:hover{
          background:#4f46e5;transform:translateY(-1px);
          box-shadow:0 4px 12px rgba(99,102,241,.3);
        }
        .lc-feedback-btn--send:disabled{
          opacity:0.5;cursor:not-allowed;transform:none;box-shadow:none;
        }

        /* ── Cursor blink ── */
        .lc-cursor{
          display:inline-block;width:2px;height:18px;background:#6366f1;
          margin-left:2px;vertical-align:text-bottom;
          animation:lc-blink .8s infinite;
        }
        @keyframes lc-blink{0%,100%{opacity:1}50%{opacity:0}}

        /* ══════ SOURCES BUTTON ══════ */
        .lc-sources-btn{
          display:inline-flex;align-items:center;gap:8px;
          margin-top:12px;padding:8px 16px;
          background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;
          font-size:13px;font-weight:500;color:#475569;
          cursor:pointer;transition:all .15s;
        }
        .lc-sources-btn:hover{
          background:#fff;border-color:#6366f1;color:#6366f1;
          box-shadow:0 2px 12px rgba(99,102,241,.1);
        }
        .lc-sources-btn svg{color:#64748b;transition:color .15s}
        .lc-sources-btn:hover svg{color:#6366f1}

        /* ══════ SOURCES MODAL ══════ */
        .lc-modal-overlay{
          position:fixed;top:0;left:0;right:0;bottom:0;
          background:rgba(0,0,0,.45);backdrop-filter:blur(6px);
          display:flex;align-items:center;justify-content:center;
          z-index:9999;animation:lc-fadeIn .2s ease-out;
        }
        .lc-modal-content{
          background:#fff;border-radius:20px;
          width:90%;max-width:560px;max-height:75vh;
          display:flex;flex-direction:column;
          box-shadow:0 24px 48px rgba(0,0,0,.2);
          animation:lc-modalSlideUp .3s ease-out;
        }
        @keyframes lc-modalSlideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        
        .lc-modal-header{
          display:flex;align-items:center;justify-content:space-between;
          padding:18px 22px;border-bottom:1px solid #f1f5f9;
          flex-shrink:0;
        }
        .lc-modal-title{
          font-size:16px;font-weight:700;color:#0f172a;margin:0;
          display:flex;align-items:center;
        }
        .lc-modal-close{
          width:32px;height:32px;border-radius:50%;border:none;
          background:#f8fafc;color:#64748b;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          transition:all .15s;
        }
        .lc-modal-close:hover{background:#fee2e2;color:#dc2626}
        
        .lc-modal-body{
          flex:1;overflow-y:auto;padding:12px 16px;
        }
        
        .lc-modal-source-item{
          background:#fafbfc;border:1px solid #e2e8f0;border-radius:10px;
          padding:10px 12px;margin-bottom:8px;transition:all .2s;
          cursor:pointer;user-select:none;
        }
        .lc-modal-source-item:last-child{margin-bottom:0}
        .lc-modal-source-item:hover{
          background:#fff;border-color:#c7d2fe;
        }
        .lc-modal-source-item.expanded{
          background:#fff;border-color:#a5b4fc;
          box-shadow:0 2px 10px rgba(99,102,241,.08);
        }
        
        .lc-modal-source-header{
          display:flex;align-items:start;gap:10px;
        }
        .lc-modal-source-number{
          width:20px;height:20px;border-radius:50%;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          color:#fff;font-size:10px;font-weight:700;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;margin-top:2px;
        }
        .lc-modal-source-number.lc-source-guide{
          background:linear-gradient(135deg,#10b981,#059669);
        }
        .lc-modal-source-info{flex:1;min-width:0}
        .lc-modal-source-name{
          font-size:12px;font-weight:600;color:#0f172a;
          margin:0;line-height:1.4;display:flex;align-items:center;
          gap:8px;flex-wrap:wrap;
        }
        .lc-modal-article-tag{
          font-size:10px;font-weight:600;color:#6366f1;
          background:#eef2ff;padding:1px 7px;border-radius:6px;
          white-space:nowrap;
        }
        .lc-modal-source-preview{
          margin:3px 0 0;font-size:11px;color:#94a3b8;
          line-height:1.4;overflow:hidden;
          display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;
        }
        .lc-modal-chevron{
          flex-shrink:0;color:#94a3b8;transition:transform .2s;margin-top:3px;
        }
        .lc-modal-chevron.open{transform:rotate(180deg);color:#6366f1}
        
        .lc-modal-source-excerpt{
          padding:12px 14px;margin:8px 0 0 30px;
          background:#f8fafc;border-left:2px solid #c7d2fe;border-radius:6px;
          font-size:12px;line-height:1.7;color:#475569;
          max-height:300px;overflow-y:auto;white-space:pre-wrap;
          animation:slideDown .2s ease;
        }
        @keyframes slideDown{
          from{opacity:0;max-height:0;margin-top:0}
          to{opacity:1;max-height:600px;margin-top:8px}
        }

        /* ══════ SOURCES (Embedded Reference Cards) - REMOVED ══════ */
        .lc-sources{
          margin-top:20px;padding:24px;
          background:linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%);
          border:1px solid #e2e8f0;border-radius:16px;
        }
        .lc-sources-title{
          font-size:13px;font-weight:700;letter-spacing:.8px;color:#334155;
          margin-bottom:12px;
        }
        .lc-sources-divider{
          height:3px;background:linear-gradient(90deg,#6366f1,#a78bfa,#6366f1);
          border-radius:2px;margin-bottom:20px;
        }
        .lc-source-item{
          background:#fff;border:1px solid #e2e8f0;border-radius:12px;
          padding:16px 20px;margin-bottom:16px;
          transition:all .15s;
        }
        .lc-source-item:last-child{margin-bottom:0}
        .lc-source-item:hover{border-color:#c7d2fe;box-shadow:0 2px 12px rgba(99,102,241,.06)}
        .lc-source-header{
          display:flex;align-items:center;gap:8px;margin-bottom:8px;
        }
        .lc-source-file-icon{font-size:16px}
        .lc-source-name{
          font-size:14px;font-weight:700;color:#0f172a;letter-spacing:.3px;
        }
        .lc-source-divider{
          height:1px;background:#e2e8f0;margin:8px 0 12px;
        }
        .lc-source-meta{
          font-size:13px;color:#475569;line-height:1.7;margin-bottom:6px;
        }
        .lc-source-meta:last-child{margin-bottom:0}
        .lc-source-meta strong{color:#0f172a}

        .lc-msg-actions{display:flex;gap:4px;margin-top:8px}
        .lc-action-btn{
          width:32px;height:32px;border-radius:8px;border:none;background:transparent;
          color:#94a3b8;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;
        }
        .lc-action-btn:hover{background:#f1f5f9;color:#475569}
        .lc-action-btn--active-up{background:#ecfdf5!important;color:#10b981!important;border:1px solid #a7f3d0}
        .lc-action-btn--active-up:hover{background:#d1fae5!important;color:#059669!important}
        .lc-action-btn--active-down{background:#fef2f2!important;color:#ef4444!important;border:1px solid #fecaca}
        .lc-action-btn--active-down:hover{background:#fee2e2!important;color:#dc2626!important}
        
        .lc-feedback-hint{
          font-size:11px;color:#94a3b8;margin:8px 0 0;
          font-style:italic;line-height:1.4;
        }

        /* ══════ THINKING BOX (Live) ══════ */
        .lc-think-box{
          background:#fff;padding:20px 24px;border-radius:16px 16px 16px 4px;
          box-shadow:0 1px 8px rgba(0,0,0,.04);border:1px solid #f1f5f9;
        }
        .lc-think-title{
          display:flex;align-items:center;gap:10px;margin-bottom:12px;
          font-size:14px;font-weight:600;color:#6366f1;
        }
        .lc-think-spinner{
          width:18px;height:18px;border:2.5px solid #e0e7ff;
          border-top-color:#6366f1;border-radius:50%;
          animation:lc-spin .8s linear infinite;
        }
        @keyframes lc-spin{to{transform:rotate(360deg)}}

        .lc-think-progress{
          height:4px;background:#e0e7ff;border-radius:2px;margin-bottom:14px;overflow:hidden;
        }
        .lc-think-progress-bar{
          height:100%;background:linear-gradient(90deg,#6366f1,#a78bfa);border-radius:2px;
          animation:lc-progress 9s ease-in-out forwards;
        }
        @keyframes lc-progress{
          0%{width:0%}20%{width:20%}40%{width:45%}60%{width:65%}80%{width:85%}100%{width:100%}
        }

        .lc-think-steps{display:flex;flex-direction:column;gap:4px}
        .lc-think-step{
          display:flex;align-items:center;gap:8px;padding:5px 10px;
          border-radius:4px;transition:all .3s;
          animation:lc-fadeIn .4s ease-out;
        }
        @keyframes lc-fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

        .lc-think-step--active{background:#f1f5f9}
        .lc-think-step--done{opacity:.5}
        .lc-think-step-icon{width:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .lc-step-dot{
          width:8px;height:8px;border-radius:50%;
          background:#cbd5e1;
        }
        .lc-step-dot--done{
          background:#64748b;
        }
        .lc-think-step-label{font-size:13px;font-weight:500;color:#475569}

        /* ══════ COLLAPSED THINKING (After answer) ══════ */
        .lc-think-collapsed{margin-bottom:8px}
        .lc-think-toggle{
          display:flex;align-items:center;gap:6px;
          background:none;border:1px solid #e2e8f0;border-radius:20px;
          padding:5px 12px;font-size:12px;color:#64748b;
          cursor:pointer;transition:all .15s;width:fit-content;
        }
        .lc-think-toggle:hover{background:#f8fafc;border-color:#cbd5e1;color:#334155}
        .lc-think-toggle-dot{
          width:8px;height:8px;border-radius:50%;background:#10b981;flex-shrink:0;
        }
        .lc-think-chevron{transition:transform .2s;flex-shrink:0;margin-left:2px}
        .lc-think-chevron--open{transform:rotate(180deg)}
        .lc-think-detail-list{
          margin-top:6px;padding:8px 12px;
          background:#fafbfc;border:1px solid #f1f5f9;border-radius:8px;
          display:flex;flex-direction:column;gap:3px;
          animation:lc-fadeIn .2s ease-out;
        }
        .lc-think-detail-row{
          display:flex;align-items:center;gap:6px;
          font-size:12px;color:#64748b;padding:2px 0;
        }

        /* ── Stop Button ── */
        .lc-stop-wrap{
          display:flex;justify-content:center;margin-bottom:12px;
        }
        .lc-stop-btn{
          display:flex;align-items:center;gap:6px;
          background:#fff;border:1.5px solid #e2e8f0;border-radius:20px;
          padding:8px 18px;font-size:13px;font-weight:500;color:#64748b;
          cursor:pointer;transition:all .15s;
          box-shadow:0 2px 8px rgba(0,0,0,.06);
        }
        .lc-stop-btn:hover{background:#fef2f2;border-color:#fca5a5;color:#dc2626}
        .lc-stop-btn:hover svg{color:#dc2626}
        .lc-stop-btn svg{color:#94a3b8;transition:color .15s}

        /* ── Bottom Input ── */
        .lc-chat-input-area{padding:12px 32px 8px;background:#f0f2f5;flex-shrink:0}
        .lc-chat-input-box{
          max-width:860px;margin:0 auto;display:flex;align-items:flex-end;
          background:#fff;border:1.5px solid #e2e8f0;border-radius:20px;
          padding:6px 6px 6px 20px;transition:all .2s;
        }
        .lc-chat-input-box:focus-within{border-color:#6366f1;box-shadow:0 2px 16px rgba(99,102,241,.1)}
        .lc-chat-input{
          border:none!important;box-shadow:none!important;background:transparent!important;
          font-size:15px;color:#0f172a;padding:10px 0!important;
          resize:none!important;flex:1;min-height:42px;max-height:120px;
        }
        .lc-chat-input::placeholder{color:#94a3b8}
        .lc-chat-input:disabled{opacity:.5}
        .lc-chat-send{
          width:42px;height:42px;border-radius:50%;border:none;
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;flex-shrink:0;transition:all .15s;color:#fff;background:#1e293b;
        }
        .lc-chat-send[data-active="false"]{background:#e2e8f0;color:#94a3b8;cursor:default}
        .lc-chat-send:hover:not(:disabled){transform:scale(1.05)}
        .lc-chat-disclaimer{text-align:center;font-size:11px;color:#94a3b8;margin:4px 0 0}
        .lc-chat-footer{text-align:center;font-size:10px;color:#c0c8d4;margin:1px 0 0;font-style:italic}
      `}</style>
    </React.Fragment>
  );
};

export default AIAssistantPanel;
