import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, RotateCcw, Download, AlertCircle } from 'lucide-react';
import Message from './Message';
import QuestionFlow from './QuestionFlow';
import { getTranslation } from '../utils/translations';
import { sendMessage } from '../utils/api';
import {
  runPipelineJobWithPolling,
  generateHTMLReport,
  downloadHTMLReport,
  downloadDecisionTree,
  openHTMLReport,
  openDecisionTree,
  fetchHitlQuestions,
} from '../../services/hsg245Api';
import {
  buildInvestigationPayload,
  parseInitialImmediateCauses,
  buildHowHappenedText,
} from '../utils/investigationPayload';
import { getHitlQuestionLabel, formatHitlAnswersBlock } from '../utils/hitlKbQuestions';
import './ChatInterface.css';

const MAX_PROBE_CODES = 3;
const MAX_WHY_LEVEL = 5;
const PIPELINE_TIMEOUT_MS = 6 * 60 * 1000;

function extractHsgCodes(text) {
  const matches = String(text || '').match(/[ABCD]\d+\.\d+/gi) || [];
  const uniq = [];
  for (const code of matches) {
    const up = code.toUpperCase();
    if (!uniq.includes(up)) uniq.push(up);
  }
  return uniq.slice(0, MAX_PROBE_CODES);
}

function getStageLabel(language, stage, progress) {
  const isTr = String(language || '').toLowerCase().startsWith('tr');
  const pctNum = Number(progress);
  const pct = Number.isFinite(pctNum) ? ` (${Math.max(0, Math.min(100, pctNum))}%)` : '';
  const tr = {
    queued: `Kuyruga alindi${pct}`,
    investigate: `Kok neden analizi calisiyor${pct}`,
    actionplan: `Aksiyon plani olusturuluyor${pct}`,
    completed: `Pipeline tamamlandi${pct}`,
    failed: `Pipeline hata ile sonlandi${pct}`,
  };
  const en = {
    queued: `Queued${pct}`,
    investigate: `Root cause analysis running${pct}`,
    actionplan: `Action plan generation running${pct}`,
    completed: `Pipeline completed${pct}`,
    failed: `Pipeline failed${pct}`,
  };
  const map = isTr ? tr : en;
  return map[stage] || (isTr ? `Calisiyor${pct}` : `Running${pct}`);
}

function buildWhyFlowLines(resultPayload) {
  const lines = [];
  const raw = resultPayload?.part3?._v2_raw || {};
  const branches = Array.isArray(raw?.analysis_branches) ? raw.analysis_branches : [];
  if (!branches.length) return lines;

  lines.push('ADIM 1: DOGRUDAN NEDENLER');
  branches.forEach((branch, idx) => {
    const direct = branch?.immediate_cause || branch?.direct_cause || {};
    const directCode = direct?.code || branch?.immediate_code || '';
    const directText = direct?.cause_tr || direct?.cause || branch?.immediate_cause_text || '';
    lines.push(`- [${directCode || `DAL-${idx + 1}`}] ${directText}`.trim());
  });

  lines.push('');
  lines.push('ADIM 2: 5-WHY ANALIZI (HER DAL)');
  branches.forEach((branch, idx) => {
    const branchType = branch?.branch_type || branch?.type || '?';
    const direct = branch?.immediate_cause || branch?.direct_cause || {};
    const directCode = direct?.code || branch?.immediate_code || '';
    const directText = direct?.cause_tr || direct?.cause || branch?.immediate_cause_text || '';
    lines.push('');
    lines.push(`=== DAL ${idx + 1}: ${branchType} ===`);
    lines.push(`DOGRUDAN NEDEN [${directCode || '-'}]: ${directText}`);

    const whyChain = branch?.why_chain || branch?.five_why_chain || branch?.why_analysis_chain || [];
    whyChain.forEach((why, whyIdx) => {
      const q = why?.question_tr || why?.question || '';
      const a = why?.answer_tr || why?.answer || '';
      lines.push(`Why-${why?.level || whyIdx + 1}: ${q}`);
      lines.push(` -> ${a}`);
    });

    const rc = branch?.root_cause || (Array.isArray(branch?.root_causes) ? branch.root_causes[0] : null);
    if (rc) {
      lines.push(`KOK NEDEN: ${rc?.cause_tr || rc?.cause || ''}`);
      if (rc?.category_tr || rc?.category) lines.push(`Kategori: ${rc?.category_tr || rc?.category}`);
      if (typeof rc?.confidence !== 'undefined') lines.push(`Guven: ${rc.confidence}%`);
    }
  });

  const meta = raw?.meta_root_cause || resultPayload?.part3?.meta_root_cause;
  if (meta) {
    lines.push('');
    lines.push('ADIM 3: META KOK NEDEN SENTEZI');
    lines.push(`Meta Kok Neden: ${meta?.cause_tr || meta?.cause || ''}`);
  }

  return lines.filter((line) => typeof line === 'string');
}

/**
 * @param {object} props
 * @param {string} props.language
 * @param {{ incidentId: string, formData: object } | null} props.hitlSeed - manuel formdan gelen HITL oturumu
 * @param {(status: string) => void} [props.onPipelineStatusChange] - Agent pipeline canlı durum metni
 * @param {(steps: string[]) => void} [props.onPipelineWhyStreamChange] - Agent pipeline Why akış satırları
 * @param {() => void} [props.onHitlFlowComplete] - HITL akışı bittiğinde
 */
const ChatInterface = ({
  language,
  hitlSeed = null,
  onPipelineStatusChange,
  onPipelineWhyStreamChange,
  onHitlFlowComplete,
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentFlow, setCurrentFlow] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  /** null | 'questions' | 'rca' | 'pdf_prompt' */
  const [hitlPhase, setHitlPhase] = useState(null);
  const [hitlAnswers, setHitlAnswers] = useState([]);
  /** @type {import('react').MutableRefObject<string|null>} */
  const processedHitlIdRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [hitlApiQuestion, setHitlApiQuestion] = useState(null);
  const [hitlAnsweredIds, setHitlAnsweredIds] = useState([]);
  const [hitlQuestionsLoading, setHitlQuestionsLoading] = useState(false);
  const [hitlMode, setHitlMode] = useState('global'); // global | why_probe
  const [probeCodes, setProbeCodes] = useState([]);
  const [probeBranchIdx, setProbeBranchIdx] = useState(0);
  const [probeWhyLevel, setProbeWhyLevel] = useState(1);
  const [liveRcaStatus, setLiveRcaStatus] = useState('');
  const [pipelineResult, setPipelineResult] = useState(null);
  const [whyFlowLines, setWhyFlowLines] = useState([]);

  const t = (key) => getTranslation(language, key);
  const currentProbeCode = probeCodes[probeBranchIdx] || '';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, hitlPhase, hitlApiQuestion?.id, hitlQuestionsLoading]);

  const runRcaAfterHitl = useCallback(
    async (answers) => {
      if (!hitlSeed?.incidentId) return;
      setHitlPhase('rca');
      setHitlApiQuestion(null);
      setIsLoading(true);
      try {
        const appendix = formatHitlAnswersBlock(answers);
        const inv = buildInvestigationPayload(hitlSeed.formData, appendix);
        inv.why_probe_answers = answers.map((a) => ({
          branch_number: a.branchNumber || 1,
          why_level: a.whyLevel || 1,
          immediate_code: a.immediateCode || '',
          question_id: a.questionId || '',
          question: a.question || '',
          answer: a.label || '',
          hsg_hint: a.hsgHint || '',
        }));
        const pipelineResponse = await runPipelineJobWithPolling(
          hitlSeed.incidentId,
          inv,
          {
            timeoutMs: PIPELINE_TIMEOUT_MS,
            pollIntervalMs: 2000,
            onUpdate: (job) => {
              const stage = job?.stage || job?.status || 'running';
              const progress = job?.progress ?? 0;
              const statusLabel = getStageLabel(language, stage, progress);
              setLiveRcaStatus(statusLabel);
              onPipelineStatusChange?.(statusLabel);
              setWhyFlowLines((prev) => {
                const line = `[PIPELINE] ${statusLabel}`;
                if (prev[prev.length - 1] === line) return prev;
                return [...prev, line];
              });
            },
          },
        );

        const resolvedPipelineResult = pipelineResponse?.data || pipelineResponse?.job?.result || null;
        setPipelineResult(resolvedPipelineResult);
        const streamBranch = resolvedPipelineResult?.part3?._v2_raw?.analysis_branches?.[0];
        const streamWhyChain =
          streamBranch?.why_chain || streamBranch?.five_why_chain || streamBranch?.why_analysis_chain || [];
        if (Array.isArray(streamWhyChain) && streamWhyChain.length) {
          const progressive = [];
          streamWhyChain.forEach((why, idx) => {
            const line = `NEDEN ${why?.level || idx + 1}: ${why?.question_tr || why?.question || ''} -> ${
              why?.answer_tr || why?.answer || ''
            }`;
            progressive.push(line);
            setTimeout(() => {
              onPipelineWhyStreamChange?.([...progressive]);
            }, idx * 900);
          });
        }
        const fullFlowLines = buildWhyFlowLines(resolvedPipelineResult);
        if (fullFlowLines.length) {
          fullFlowLines.forEach((line, idx) => {
            setTimeout(() => {
              setWhyFlowLines((prev) => [...prev, line]);
            }, idx * 180);
          });
        }
        onPipelineStatusChange?.(
          String(language || '').toLowerCase().startsWith('tr')
            ? 'Pipeline tamamlandi. Rapor adimina gecildi.'
            : 'Pipeline completed. Moved to report stage.',
        );
        setMessages((prev) => [
          ...prev,
          {
            id: `rca-done-${Date.now()}`,
            type: 'assistant',
            content: `${getTranslation(language, 'hitl_running_rca')} ✓\nIncident ID: ${hitlSeed.incidentId}`,
            timestamp: new Date(),
          },
        ]);
        setHitlPhase('pdf_prompt');
        setLiveRcaStatus(
          String(language || '').toLowerCase().startsWith('tr')
            ? 'Analiz tamamlandi, rapor adimina gecildi.'
            : 'Analysis completed, moved to report stage.',
        );
      } catch (error) {
        setPipelineResult(null);
        setWhyFlowLines([]);
        onPipelineWhyStreamChange?.([]);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            type: 'error',
            content: `${getTranslation(language, 'error_occurred')}: ${error.message}`,
            timestamp: new Date(),
          },
        ]);
        setHitlPhase(null);
        setLiveRcaStatus(
          String(language || '').toLowerCase().startsWith('tr')
            ? 'Analiz asamasinda hata olustu.'
            : 'Error occurred during analysis stage.',
        );
        onPipelineStatusChange?.(
          String(language || '').toLowerCase().startsWith('tr')
            ? `Pipeline hatasi: ${error.message}`
            : `Pipeline error: ${error.message}`,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [hitlSeed, language, onPipelineStatusChange, onPipelineWhyStreamChange],
  );

  const fetchQuestionForState = useCallback(
    async ({
      mode,
      answeredIds,
      branchIdx,
      whyLevel,
      previousWhyAnswer,
      answers,
      codes,
    }) => {
      if (!hitlSeed?.incidentId) return { done: true, question: null };
      const baseHow = buildHowHappenedText(hitlSeed.formData);
      const rci = hitlSeed.formData?.rootCauseInitial || '';
      const appendix = formatHitlAnswersBlock(answers || []);
      const howAugmented = appendix ? `${baseHow}\n\n--- HITL ---\n${appendix}` : baseHow;
      const currentCode = (codes || probeCodes)[branchIdx] || '';

      const body =
        mode === 'why_probe'
          ? {
              mode: 'why_probe',
              how_happened: howAugmented,
              root_cause_initial: rci,
              answered_ids: answeredIds,
              immediate_code: currentCode,
              why_level: whyLevel,
              current_why_question: `Why-${whyLevel} (${currentCode || 'GENERIC'})`,
              previous_why_answer: previousWhyAnswer || '',
              batch_size: 1,
            }
          : {
              mode: 'global',
              how_happened: howAugmented,
              root_cause_initial: rci,
              answered_ids: answeredIds,
              batch_size: 1,
            };

      const res = await fetchHitlQuestions(hitlSeed.incidentId, body);
      const payload = res.data || {};
      const q = (payload.questions && payload.questions[0]) || null;
      return { done: !!payload.done, question: q };
    },
    [hitlSeed, probeCodes],
  );

  const resolveNextQuestion = useCallback(
    async ({
      mode,
      answers,
      answeredIds,
      branchIdx,
      whyLevel,
      previousWhyAnswer,
      codes,
    }) => {
      const activeCodes = codes || probeCodes;
      if (mode !== 'why_probe') {
        const r = await fetchQuestionForState({
          mode: 'global',
          answers,
          answeredIds,
          branchIdx: 0,
          whyLevel: 1,
          previousWhyAnswer: '',
          codes: activeCodes,
        });
        return {
          done: !r.question,
          question: r.question,
          nextBranchIdx: 0,
          nextWhyLevel: 1,
          nextAnsweredIds: answeredIds,
          nextPreviousWhyAnswer: '',
        };
      }

      let b = branchIdx;
      let w = whyLevel;
      let ids = answeredIds;
      let prevAns = previousWhyAnswer || '';
      let guard = 0;

      while (guard < 24) {
        guard += 1;
        const r = await fetchQuestionForState({
          mode: 'why_probe',
          answers,
          answeredIds: ids,
          branchIdx: b,
          whyLevel: w,
          previousWhyAnswer: prevAns,
          codes: activeCodes,
        });
        if (r.question) {
          return {
            done: false,
            question: r.question,
            nextBranchIdx: b,
            nextWhyLevel: w,
            nextAnsweredIds: ids,
            nextPreviousWhyAnswer: prevAns,
          };
        }

        if (w < MAX_WHY_LEVEL) {
          w += 1;
          ids = [];
          continue;
        }
        if (b < activeCodes.length - 1) {
          b += 1;
          w = 1;
          ids = [];
          prevAns = '';
          continue;
        }
        return {
          done: true,
          question: null,
          nextBranchIdx: b,
          nextWhyLevel: w,
          nextAnsweredIds: ids,
          nextPreviousWhyAnswer: prevAns,
        };
      }

      return {
        done: true,
        question: null,
        nextBranchIdx: b,
        nextWhyLevel: w,
        nextAnsweredIds: ids,
        nextPreviousWhyAnswer: prevAns,
      };
    },
    [fetchQuestionForState, probeCodes],
  );

  useEffect(() => {
    if (!hitlSeed?.incidentId) {
      setLiveRcaStatus('');
      processedHitlIdRef.current = null;
      setHitlPhase(null);
      setHitlAnswers([]);
      setHitlAnsweredIds([]);
      setHitlApiQuestion(null);
      setHitlQuestionsLoading(false);
      setHitlMode('global');
      setProbeCodes([]);
      setProbeBranchIdx(0);
      setProbeWhyLevel(1);
      setPipelineResult(null);
      setWhyFlowLines([]);
      onPipelineWhyStreamChange?.([]);
      setMessages([
        {
          id: '1',
          type: 'assistant',
          content: getTranslation(language, 'welcome_message'),
          timestamp: new Date(),
        },
      ]);
      setSessionId(Date.now().toString());
      onPipelineStatusChange?.('');
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
    setHitlAnswers([]);
    setHitlAnsweredIds([]);
    setHitlApiQuestion(null);
    setHitlQuestionsLoading(true);
    setProbeBranchIdx(0);
    setProbeWhyLevel(1);
    setPipelineResult(null);
    setWhyFlowLines([]);
    onPipelineWhyStreamChange?.([]);
    setSessionId(Date.now().toString());
    onPipelineStatusChange?.(
      String(language || '').toLowerCase().startsWith('tr')
        ? `HITL sorulari basladi (Incident: ${hitlSeed.incidentId})`
        : `HITL questions started (Incident: ${hitlSeed.incidentId})`,
    );

    const rci = hitlSeed.formData?.rootCauseInitial || '';
    const codes = extractHsgCodes(rci);
    const mode = codes.length ? 'why_probe' : 'global';
    setHitlMode(mode);
    setProbeCodes(codes);

    let cancelled = false;
    (async () => {
      try {
        const next = await resolveNextQuestion({
          mode,
          answers: [],
          answeredIds: [],
          branchIdx: 0,
          whyLevel: 1,
          previousWhyAnswer: '',
          codes,
        });
        if (cancelled) return;
        if (next.question) {
          setHitlApiQuestion(next.question);
          setProbeBranchIdx(next.nextBranchIdx);
          setProbeWhyLevel(next.nextWhyLevel);
          setHitlAnsweredIds(next.nextAnsweredIds);
          return;
        }
        if (next.done) {
          void runRcaAfterHitl([]);
        }
      } catch (error) {
        if (cancelled) return;
        setMessages((prev) => [
          ...prev,
          {
            id: `hitl-err-${Date.now()}`,
            type: 'error',
            content: `${getTranslation(language, 'error_occurred')}: ${error.message}`,
            timestamp: new Date(),
          },
        ]);
        setHitlPhase(null);
      } finally {
        if (!cancelled) {
          setHitlQuestionsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hitlSeed, language, runRcaAfterHitl, onPipelineStatusChange, onPipelineWhyStreamChange]);

  const handleHitlAnswer = (value) => {
    if (!hitlSeed?.incidentId || !hitlApiQuestion || isLoading || hitlQuestionsLoading) return;
    const labels = {
      yes: t('yes'),
      no: t('no'),
      unknown: t('unknown'),
    };
    const label = labels[value] || value;
    const qLabel = getHitlQuestionLabel(hitlApiQuestion, language);
    const entry = {
      questionId: hitlApiQuestion.id,
      hsgHint: hitlApiQuestion.hsg_hint || '',
      question: qLabel,
      label,
      value,
      branchNumber: hitlMode === 'why_probe' ? probeBranchIdx + 1 : 1,
      whyLevel: hitlMode === 'why_probe' ? probeWhyLevel : hitlAnswers.length + 1,
      immediateCode: hitlMode === 'why_probe' ? currentProbeCode : '',
    };
    const nextAnswers = [...hitlAnswers, entry];
    const newIds = [...hitlAnsweredIds, hitlApiQuestion.id];
    setHitlAnswers(nextAnswers);
    setHitlAnsweredIds(newIds);

    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        type: 'user',
        content: `${qLabel}\n→ ${label}`,
        timestamp: new Date(),
      },
    ]);

    setHitlApiQuestion(null);
    setHitlQuestionsLoading(true);

    (async () => {
      try {
        const next = await resolveNextQuestion({
          mode: hitlMode,
          answers: nextAnswers,
          answeredIds: newIds,
          branchIdx: probeBranchIdx,
          whyLevel: probeWhyLevel,
          previousWhyAnswer: label,
          codes: probeCodes,
        });
        if (next.question) {
          setHitlApiQuestion(next.question);
          setProbeBranchIdx(next.nextBranchIdx);
          setProbeWhyLevel(next.nextWhyLevel);
          setHitlAnsweredIds(next.nextAnsweredIds);
          return;
        }
        if (next.done) {
          void runRcaAfterHitl(nextAnswers);
        }
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: `hitl-err-${Date.now()}`,
            type: 'error',
            content: `${getTranslation(language, 'error_occurred')}: ${error.message}`,
            timestamp: new Date(),
          },
        ]);
        setHitlPhase(null);
      } finally {
        setHitlQuestionsLoading(false);
      }
    })();
  };

  const handleHtmlGenerate = async () => {
    if (!hitlSeed?.incidentId) return;
    setIsLoading(true);
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      setMessages((prev) => [
        ...prev,
        {
          id: `html-popup-err-${Date.now()}`,
          type: 'error',
          content: 'Popup blocked. Please allow popups for preview.',
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
      return;
    }
    reportWindow.document.write('<p style="font-family:sans-serif;padding:16px">Preparing HTML report...</p>');
    try {
      await generateHTMLReport(hitlSeed.incidentId);
      await openHTMLReport(hitlSeed.incidentId, { preopenedWindow: reportWindow });
      setMessages((prev) => [
        ...prev,
        {
          id: `html-ok-${Date.now()}`,
          type: 'assistant',
          content: String(language || '').toLowerCase().startsWith('tr')
            ? 'HTML rapor ve decision tree hazir. Asagidaki butonlardan goruntuleyebilir veya indirebilirsiniz.'
            : 'HTML report and decision tree are ready. You can preview or download from the buttons below.',
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      reportWindow.close();
      setMessages((prev) => [
        ...prev,
        {
          id: `html-err-${Date.now()}`,
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
    setLiveRcaStatus('');
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
    onPipelineStatusChange?.('');
    setWhyFlowLines([]);
    onPipelineWhyStreamChange?.([]);
  };

  const runReportAction = useCallback(
    async (fn) => {
      if (!hitlSeed?.incidentId) return;
      try {
        await fn(hitlSeed.incidentId);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: `report-action-err-${Date.now()}`,
            type: 'error',
            content: `${getTranslation(language, 'error_occurred')}: ${error.message}`,
            timestamp: new Date(),
          },
        ]);
      }
    },
    [hitlSeed, language],
  );

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
    setLiveRcaStatus('');
    processedHitlIdRef.current = null;
    setCurrentFlow(null);
    setHitlPhase(null);
    setHitlAnswers([]);
    setHitlAnsweredIds([]);
    setHitlApiQuestion(null);
    setHitlQuestionsLoading(false);
    setHitlMode('global');
    setProbeCodes([]);
    setProbeBranchIdx(0);
    setProbeWhyLevel(1);
    setPipelineResult(null);
    setWhyFlowLines([]);
    setMessages([
      {
        id: '1',
        type: 'assistant',
        content: getTranslation(language, 'welcome_message'),
        timestamp: new Date(),
      },
    ]);
    setSessionId(Date.now().toString());
    onPipelineStatusChange?.('');
    setWhyFlowLines([]);
    onPipelineWhyStreamChange?.([]);
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
    isLoading ||
    hitlQuestionsLoading ||
    hitlPhase === 'questions' ||
    hitlPhase === 'rca' ||
    hitlPhase === 'pdf_prompt';

  const showHitlPanel = hitlPhase === 'questions' && (hitlQuestionsLoading || hitlApiQuestion);
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
              <p>{hitlPhase === 'rca' ? liveRcaStatus || t('step_3_desc') : t('step_3_desc')}</p>
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
          {!!whyFlowLines.length && (
            <div className="why-stream-panel">
              <h4 className="why-stream-title">5-Why Canli Akis</h4>
              <div className="why-stream-body">
                {whyFlowLines.map((line, idx) => (
                  <p className="why-stream-line" key={`why-stream-${idx}-${line.slice(0, 20)}`}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}

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

          {showHitlPanel && (
            <div className="hitl-choice-panel">
              {hitlQuestionsLoading && !hitlApiQuestion ? (
                <p className="hitl-q">{t('hitl_loading_questions')}</p>
              ) : hitlApiQuestion ? (
                <>
                  <div className="hitl-hint">
                    {hitlMode === 'why_probe'
                      ? `Branch ${probeBranchIdx + 1}/${Math.max(1, probeCodes.length)} • Why-${probeWhyLevel} • ${hitlApiQuestion.hsg_hint || currentProbeCode}`
                      : hitlApiQuestion.hsg_hint}
                  </div>
                  <p className="hitl-q">{getHitlQuestionLabel(hitlApiQuestion, language)}</p>
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
                </>
              ) : null}
            </div>
          )}

          {hitlPhase === 'pdf_prompt' && (
            <div className="hitl-choice-panel hitl-pdf-panel">
              <p className="hitl-q">{t('hitl_ask_pdf')}</p>
              <div className="hitl-choices">
                <button type="button" className="hitl-choice-btn hitl-choice-primary" onClick={handleHtmlGenerate} disabled={isLoading}>
                  {t('hitl_pdf_download')}
                </button>
                <button type="button" className="hitl-choice-btn" onClick={handlePdfSkip} disabled={isLoading}>
                  {t('hitl_pdf_skip')}
                </button>
              </div>
              <div className="hitl-choices hitl-report-actions">
                <button type="button" className="hitl-choice-btn" onClick={() => runReportAction(openHTMLReport)} disabled={isLoading}>
                  {String(language || '').toLowerCase().startsWith('tr') ? 'Raporu Ac' : 'Open Report'}
                </button>
                <button type="button" className="hitl-choice-btn" onClick={() => runReportAction(downloadHTMLReport)} disabled={isLoading}>
                  {String(language || '').toLowerCase().startsWith('tr') ? 'HTML Indir' : 'Download HTML'}
                </button>
                <button type="button" className="hitl-choice-btn" onClick={() => runReportAction(openDecisionTree)} disabled={isLoading}>
                  {String(language || '').toLowerCase().startsWith('tr') ? 'Decision Tree Ac' : 'Open Decision Tree'}
                </button>
                <button type="button" className="hitl-choice-btn" onClick={() => runReportAction(downloadDecisionTree)} disabled={isLoading}>
                  {String(language || '').toLowerCase().startsWith('tr') ? 'Decision Tree Indir' : 'Download Decision Tree'}
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
