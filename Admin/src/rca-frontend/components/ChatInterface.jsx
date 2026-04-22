import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, RotateCcw, Download, AlertCircle } from 'lucide-react';
import Message from './Message';
import QuestionFlow from './QuestionFlow';
import { getTranslation } from '../utils/translations';
import { sendMessage } from '../utils/api';
import {
  investigateIncident,
  generateActionPlan,
  generatePDFReport,
} from '../../services/hsg245Api';
import {
  buildInvestigationPayload,
  parseInitialImmediateCauses,
} from '../utils/investigationPayload';
import {
  getHitlQuestionSequence,
  getQuestionLabel,
  formatHitlAnswersBlock,
} from '../utils/hitlKbQuestions';
import './ChatInterface.css';

/**
 * @param {object} props
 * @param {string} props.language
 * @param {{ incidentId: string, formData: object } | null} props.hitlSeed - manuel formdan gelen HITL oturumu
 * @param {() => void} [props.onHitlFlowComplete] - HITL + isteğe bağlı PDF bittiğinde
 */
const ChatInterface = ({ language, hitlSeed = null, onHitlFlowComplete }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentFlow, setCurrentFlow] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  /** null | 'questions' | 'rca' | 'pdf_prompt' */
  const [hitlPhase, setHitlPhase] = useState(null);
  const [hitlIndex, setHitlIndex] = useState(0);
  const [hitlAnswers, setHitlAnswers] = useState([]);
  const processedHitlIdRef = useRef(null);
  const messagesEndRef = useRef(null);

  const t = (key) => getTranslation(language, key);
  const hitlSeq = getHitlQuestionSequence();
  const currentHitlQuestion = hitlPhase === 'questions' ? hitlSeq[hitlIndex] : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, hitlIndex, hitlPhase]);

  useEffect(() => {
    if (!hitlSeed?.incidentId) {
      processedHitlIdRef.current = null;
      setHitlPhase(null);
      setHitlIndex(0);
      setHitlAnswers([]);
      setMessages([
        {
          id: '1',
          type: 'assistant',
          content: getTranslation(language, 'welcome_message'),
          timestamp: new Date(),
        },
      ]);
      setSessionId(Date.now().toString());
      return;
    }
    if (processedHitlIdRef.current === hitlSeed.incidentId) {
      return;
    }
    processedHitlIdRef.current = hitlSeed.incidentId;

    const bullets = parseInitialImmediateCauses(hitlSeed.formData?.rootCauseInitial);
    const bulletText = bullets.length
      ? bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')
      : getTranslation(language, 'hitl_no_initial_causes');

    const intro = [
      getTranslation(language, 'hitl_intro_title'),
      '',
      bulletText,
      '',
      `Incident ID: ${hitlSeed.incidentId}`,
      '',
      `${getTranslation(language, 'hitl_questions_title')} — ${getTranslation(language, 'input_hint')}`,
    ].join('\n');

    setMessages([
      {
        id: 'hitl-start',
        type: 'assistant',
        content: intro,
        timestamp: new Date(),
      },
    ]);
    setHitlPhase('questions');
    setHitlIndex(0);
    setHitlAnswers([]);
    setSessionId(Date.now().toString());
  }, [hitlSeed, language]);

  const runRcaAfterHitl = async (answers) => {
    if (!hitlSeed?.incidentId) return;
    setHitlPhase('rca');
    setIsLoading(true);
    try {
      const appendix = formatHitlAnswersBlock(answers);
      const inv = buildInvestigationPayload(hitlSeed.formData, appendix);
      await investigateIncident(hitlSeed.incidentId, inv);
      await generateActionPlan(hitlSeed.incidentId);

      setMessages((prev) => [
        ...prev,
        {
          id: `rca-done-${Date.now()}`,
          type: 'assistant',
          content:
            `${t('hitl_running_rca')} ✓\nIncident ID: ${hitlSeed.incidentId}`,
          timestamp: new Date(),
        },
      ]);
      setHitlPhase('pdf_prompt');
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          type: 'error',
          content: `${t('error_occurred')}: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
      setHitlPhase(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHitlAnswer = (value) => {
    if (!currentHitlQuestion || isLoading) return;
    const labels = {
      yes: t('yes'),
      no: t('no'),
      unknown: t('unknown'),
    };
    const label = labels[value] || value;
    const entry = {
      hsgHint: currentHitlQuestion.hsgHint,
      question: getQuestionLabel(currentHitlQuestion, language),
      label,
      value,
    };
    const nextAnswers = [...hitlAnswers, entry];
    setHitlAnswers(nextAnswers);

    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        type: 'user',
        content: `${getQuestionLabel(currentHitlQuestion, language)}\n→ ${label}`,
        timestamp: new Date(),
      },
    ]);

    const nextIndex = hitlIndex + 1;
    if (nextIndex >= hitlSeq.length) {
      void runRcaAfterHitl(nextAnswers);
    } else {
      setHitlIndex(nextIndex);
    }
  };

  const handlePdfDownload = async () => {
    if (!hitlSeed?.incidentId) return;
    setIsLoading(true);
    try {
      await generatePDFReport(hitlSeed.incidentId);
      setHitlPhase(null);
      onHitlFlowComplete?.();
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `pdf-err-${Date.now()}`,
          type: 'error',
          content: error.message,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfSkip = () => {
    setHitlPhase(null);
    processedHitlIdRef.current = null;
    onHitlFlowComplete?.();
    setMessages([
      {
        id: '1',
        type: 'assistant',
        content: getTranslation(language, 'welcome_message'),
        timestamp: new Date(),
      },
    ]);
    setSessionId(Date.now().toString());
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (hitlPhase === 'questions' || hitlPhase === 'rca') {
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const text = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage({
        message: text,
        sessionId,
        language,
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.message,
        suggestions: response.suggestions,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.startFlow) {
        setCurrentFlow(response.flowType);
      }
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: t('error_occurred') + ': ' + error.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    if (hitlSeed?.incidentId) {
      onHitlFlowComplete?.();
    }
    processedHitlIdRef.current = null;
    setCurrentFlow(null);
    setHitlPhase(null);
    setHitlIndex(0);
    setHitlAnswers([]);
    setMessages([
      {
        id: '1',
        type: 'assistant',
        content: getTranslation(language, 'welcome_message'),
        timestamp: new Date(),
      },
    ]);
    setSessionId(Date.now().toString());
  };

  const handleQuestionAnswer = (answer) => {
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: answer,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
  };

  const inputLocked =
    isLoading || hitlPhase === 'questions' || hitlPhase === 'rca' || hitlPhase === 'pdf_prompt';

  return (
    <div className="chat-interface">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h3>{t('analysis_steps')}</h3>
        </div>
        <div className="sidebar-content">
          <div className={`step-item ${hitlSeed ? 'completed' : 'completed'}`}>
            <div className="step-icon">✓</div>
            <div className="step-text">
              <h4>{t('step_1')}</h4>
              <p>{t('step_1_desc')}</p>
            </div>
          </div>
          <div className={`step-item ${hitlPhase === 'questions' ? 'active' : hitlPhase ? 'completed' : ''}`}>
            <div className="step-icon">{hitlPhase === 'questions' ? '2' : hitlPhase ? '✓' : '2'}</div>
            <div className="step-text">
              <h4>{t('hitl_questions_title')}</h4>
              <p>HSG245 / KB</p>
            </div>
          </div>
          <div className={`step-item ${hitlPhase === 'rca' ? 'active' : ['pdf_prompt'].includes(hitlPhase) ? 'completed' : ''}`}>
            <div className="step-icon">3</div>
            <div className="step-text">
              <h4>{t('step_3')}</h4>
              <p>{t('step_3_desc')}</p>
            </div>
          </div>
          <div className={`step-item ${hitlPhase === 'pdf_prompt' ? 'active' : ''}`}>
            <div className="step-icon">4</div>
            <div className="step-text">
              <h4>{t('step_4')}</h4>
              <p>{t('step_4_desc')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-messages">
          {messages.map((message) => (
            <Message key={message.id} message={message} language={language} />
          ))}

          {currentFlow && (
            <QuestionFlow
              flowType={currentFlow}
              language={language}
              onAnswer={handleQuestionAnswer}
              onComplete={() => setCurrentFlow(null)}
            />
          )}

          {hitlPhase === 'questions' && currentHitlQuestion && (
            <div className="hitl-choice-panel">
              <div className="hitl-hint">{currentHitlQuestion.hsgHint}</div>
              <p className="hitl-q">{getQuestionLabel(currentHitlQuestion, language)}</p>
              <div className="hitl-choices">
                <button type="button" className="hitl-choice-btn" onClick={() => handleHitlAnswer('yes')}>
                  {t('yes')}
                </button>
                <button type="button" className="hitl-choice-btn hitl-choice-no" onClick={() => handleHitlAnswer('no')}>
                  {t('no')}
                </button>
                <button type="button" className="hitl-choice-btn hitl-choice-un" onClick={() => handleHitlAnswer('unknown')}>
                  {t('unknown')}
                </button>
              </div>
            </div>
          )}

          {hitlPhase === 'pdf_prompt' && (
            <div className="hitl-choice-panel hitl-pdf-panel">
              <p className="hitl-q">{t('hitl_ask_pdf')}</p>
              <div className="hitl-choices">
                <button type="button" className="hitl-choice-btn hitl-choice-primary" onClick={handlePdfDownload} disabled={isLoading}>
                  {t('hitl_pdf_download')}
                </button>
                <button type="button" className="hitl-choice-btn" onClick={handlePdfSkip} disabled={isLoading}>
                  {t('hitl_pdf_skip')}
                </button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="message-loading">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <div className="chat-actions">
            <button className="action-btn" onClick={handleReset} title={t('reset')} type="button">
              <RotateCcw size={18} />
              <span>{t('reset')}</span>
            </button>
            <button className="action-btn" title={t('export')} type="button">
              <Download size={18} />
              <span>{t('export')}</span>
            </button>
          </div>

          <div className="chat-input-wrapper">
            <button className="attach-btn" title={t('attach_file')} type="button">
              <Paperclip size={20} />
            </button>

            <textarea
              className="chat-input"
              placeholder={inputLocked ? t('hitl_questions_title') : t('input_placeholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
              disabled={inputLocked}
            />

            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!input.trim() || inputLocked}
              type="button"
            >
              <Send size={20} />
            </button>
          </div>

          <div className="input-hint">
            <AlertCircle size={14} />
            <span>{t('input_hint')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
