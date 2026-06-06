import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, RotateCcw, Download, AlertCircle } from 'lucide-react';
import Message from './Message';
import QuestionFlow from './QuestionFlow';
import { getTranslation } from '../utils/translations';
import { streamHitlIntro } from '../utils/streamHitlIntro';
import {
  appendNewActivityLines,
  buildPipelineResultMarkdown,
  pipelineKickoffLine,
  splitMarkdownForStream,
} from '../utils/formatPipelineChat';
import {
  runPipelineJobWithPolling,
  generateHTMLReport,
  downloadHTMLReport,
  downloadDecisionTree,
  openHTMLReport,
  openDecisionTree,
  getIncident,
  fetchHitlQuestions,
} from '../../services/hsg245Api';
import {
  buildInvestigationPayload,
  buildHowHappenedText,
} from '../utils/investigationPayload';
import { normalizeWitnesses } from '../utils/witnessRows';
import { getHitlQuestionLabel, formatHitlAnswersBlock } from '../utils/hitlKbQuestions';
import {
  hitlQuestionNeedsChoice,
  hitlQuestionShowsYesNo,
  getHitlChoiceOptionLabels,
  isHitlChoiceMulti,
  handleHitlTextareaEnter,
} from '../utils/hitlResponseMode';
import { finalizeSavedReport } from '../utils/draftReportsStorage';
import { openLibraryArtifact } from '../utils/reportsLibraryApi';
import { DEFAULT_REPORT_LAYOUT } from '../../services/reportLayoutApi';
import ReportTemplatePicker from './ReportTemplatePicker';
import { createSmoothPipelineProgress } from '../utils/pipelineProgressSmooth';
import { stripTechnicalCodes } from '../utils/displaySanitize';
import './ChatInterface.css';

const MAX_PROBE_CODES = 3;
const MAX_WHY_LEVEL = 5;
/** Uzun RCA + thinking modeller; 6 dk önce UI "Pipeline timeout" veriyordu. */
const PIPELINE_TIMEOUT_MS = 20 * 60 * 1000;
const RCA_STREAM_MSG_ID = 'rca-pipeline-stream';

function extractHsgCodes(text) {
  const matches = String(text || '').match(/[ABCD]\d+\.\d+/gi) || [];
  const uniq = [];
  for (const code of matches) {
    const up = code.toUpperCase();
    if (!uniq.includes(up)) uniq.push(up);
  }
  return uniq.slice(0, MAX_PROBE_CODES);
}

function deriveKnownFields(formData = {}) {
  const out = [];
  if (formData.incidentDate || formData.incidentTime || (formData.timeline || []).some((r) => r?.time || r?.event)) {
    out.push('timeline_known');
  }
  if (formData.safetyTraining) out.push('training_known');
  if (formData.fallProtection || formData.safetyHarness || formData.ppeUsed) out.push('ppe_known');
  if (formData.weatherConditions) out.push('weather_known');
  if (formData.lightingConditions) out.push('lighting_known');
  if (formData.workType || formData.rootCauseInitial) out.push('risk_assessment');
  const witnessesPresent = String(formData.witnessesPresent || '').trim().toLowerCase();
  const witnesses = normalizeWitnesses(formData);
  const witnessCaptured =
    witnessesPresent === 'yes' ||
    witnessesPresent === 'no' ||
    witnesses.some((w) => String(w?.name || w?.statement || '').trim());
  if (witnessCaptured) out.push('witness_known');
  return out;
}

/** Panelde HSG245 markası ve gereksiz kod öneklerini gizle. */
function formatHitlHint(hint) {
  return String(hint || '')
    .replace(/HSG\s*245/gi, '')
    .replace(/\bKB\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getHitlCauseTitle(q) {
  if (!q) return '';
  const cause = String(q.cause_desc || '').trim();
  if (cause && !cause.includes('?')) return cause;
  const hint = formatHitlHint(q.hsg_hint);
  if (hint && !hint.includes('?') && hint.length > 12) return hint;
  return '';
}

function getHitlContextNote(q) {
  if (!q) return '';
  const title = getHitlCauseTitle(q);
  const probeContext = String(q.probe_context || '').trim();
  if (probeContext) return probeContext;
  const helperHint = String(q.helper_hint || '').trim();
  if (helperHint && !/Evet.*Hayır|Yes.*No/i.test(helperHint)) return helperHint;
  const hint = formatHitlHint(q.hsg_hint);
  if (hint && hint !== title) return hint;
  return '';
}

function getStageLabel(language, stage, progress) {
  const isTr = String(language || '').toLowerCase().startsWith('tr');
  const pctNum = Number(progress);
  const pct = Number.isFinite(pctNum) ? ` (${Math.max(0, Math.min(100, pctNum))}%)` : '';
  const tr = {
    queued: `Analiz kuyruğa alındı${pct}`,
    investigate: `Kök neden analizi çalışıyor${pct}`,
    actionplan: `Aksiyon planı oluşturuluyor${pct}`,
    completed: `Analiz tamamlandı${pct}`,
    failed: `Analiz hata ile sonlandı${pct}`,
  };
  const en = {
    queued: `Analysis queued${pct}`,
    investigate: `Root cause analysis in progress${pct}`,
    actionplan: `Building action plan${pct}`,
    completed: `Analysis completed${pct}`,
    failed: `Analysis ended with an error${pct}`,
  };
  const map = isTr ? tr : en;
  return map[stage] || (isTr ? `Çalışıyor${pct}` : `Running${pct}`);
}

function getFlowPhaseMessage(language, phase, liveStatus = '') {
  const isTr = String(language || '').toLowerCase().startsWith('tr');
  if (phase === 'questions') {
    return isTr
      ? 'Olay metnini netleştirmek için birkaç derinleştirme sorusu soracağım.'
      : 'I will ask a few deepening questions to clarify the incident context.';
  }
  if (phase === 'rca') {
    return liveStatus || (isTr ? 'Kök neden analizi başladı.' : 'Root cause analysis has started.');
  }
  if (phase === 'pdf_prompt' || phase === 'report_saved') {
    return isTr ? 'Rapor hazırlanıyor.' : 'Preparing your report.';
  }
  return '';
}

/**
 * @param {object} props
 * @param {string} props.language
 * @param {{ incidentId: string, formData: object } | null} props.hitlSeed - manuel formdan gelen HITL oturumu
 * @param {(status: string) => void} [props.onPipelineStatusChange] - Agent pipeline canlı durum metni
 * @param {() => void} [props.onHitlFlowComplete] - HITL akışı bittiğinde
 * @param {() => void} [props.onStartNewAnalysis] - Yeni analiz / ana forma dön
 * @param {(payload: { incidentId?: string }) => void} [props.onAnalysisComplete] - Rapor kaydedildiğinde
 * @param {(payload: { incidentId: string, formData?: object, reportReady?: boolean }) => void} [props.onSaveReport]
 * @param {() => void} [props.onGoToReportsTab]
 * @param {() => void} [props.onGoToFormTab]
 */
const ChatInterface = ({
  language,
  hitlSeed = null,
  onPipelineStatusChange,
  onHitlFlowComplete,
  onStartNewAnalysis,
  onAnalysisComplete,
  onSaveReport,
  onGoToReportsTab,
  onGoToFormTab,
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentFlow, setCurrentFlow] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  /** null | 'intro_streaming' | 'questions' | 'rca' | 'pdf_prompt' | 'report_saved' */
  const [hitlPhase, setHitlPhase] = useState(null);
  const [reportTemplateConfig, setReportTemplateConfig] = useState({
    coverTemplate: DEFAULT_REPORT_LAYOUT.cover_template,
    watermarkMode: DEFAULT_REPORT_LAYOUT.watermark_mode,
    showTechnicalCodes: DEFAULT_REPORT_LAYOUT.show_technical_codes,
    enabledSections: [...DEFAULT_REPORT_LAYOUT.sections],
    layoutPayload: { ...DEFAULT_REPORT_LAYOUT },
  });
  const [savedLibraryItemId, setSavedLibraryItemId] = useState(null);
  const [hitlAnswers, setHitlAnswers] = useState([]);
  /** @type {import('react').MutableRefObject<string|null>} */
  const processedHitlIdRef = useRef(null);
  const hitlLoadGenRef = useRef(0);
  const pipelineActivitySeenRef = useRef(new Set());
  const lastFlowPhaseRef = useRef(null);
  const resolveNextQuestionRef = useRef(null);
  const runRcaAfterHitlRef = useRef(null);
  const librarySavedRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [hitlApiQuestion, setHitlApiQuestion] = useState(null);
  const [hitlAnsweredIds, setHitlAnsweredIds] = useState([]);
  const [hitlQuestionsLoading, setHitlQuestionsLoading] = useState(false);
  const [hitlMode, setHitlMode] = useState('why_probe'); // why_probe (Mongo typical_problems flow)
  const [probeCodes, setProbeCodes] = useState([]);
  const [hitlImmediateCauses, setHitlImmediateCauses] = useState([]);
  const [hitlWhyDisplay, setHitlWhyDisplay] = useState('');
  const [probeBranchIdx, setProbeBranchIdx] = useState(0);
  const [probeWhyLevel, setProbeWhyLevel] = useState(1);
  const [liveRcaStatus, setLiveRcaStatus] = useState('');
  const [pipelineResult, setPipelineResult] = useState(null);
  const [hitlTextDraft, setHitlTextDraft] = useState('');
  const [hitlOtherDraft, setHitlOtherDraft] = useState('');
  /** @type {[Set<number>, React.Dispatch<React.SetStateAction<Set<number>>>]} */
  const [hitlChoiceIdx, setHitlChoiceIdx] = useState(() => new Set());

  const t = (key) => getTranslation(language, key);
  const currentProbeCode = probeCodes[probeBranchIdx] || '';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, hitlPhase, hitlApiQuestion?.id, hitlQuestionsLoading]);

  useEffect(() => {
    if (!hitlSeed?.incidentId || !hitlPhase || hitlPhase === 'intro_streaming') return;
    if (lastFlowPhaseRef.current === hitlPhase) return;
    lastFlowPhaseRef.current = hitlPhase;
    const text = getFlowPhaseMessage(language, hitlPhase, liveRcaStatus);
    if (!text) return;
    const flowId = `flow-status-${hitlPhase}`;
    setMessages((prev) => {
      if (prev.some((m) => m.id === flowId)) return prev;
      return [
        ...prev,
        {
          id: flowId,
          type: 'assistant',
          content: text,
          timestamp: new Date(),
        },
      ];
    });
  }, [hitlPhase, hitlSeed, language, liveRcaStatus]);

  useEffect(() => {
    if (hitlPhase !== 'rca' || !liveRcaStatus) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === 'flow-status-rca' ? { ...m, content: liveRcaStatus, timestamp: new Date() } : m,
      ),
    );
  }, [hitlPhase, liveRcaStatus]);

  useEffect(() => {
    setHitlTextDraft('');
    setHitlOtherDraft('');
    setHitlChoiceIdx(new Set());
  }, [hitlApiQuestion?.id]);

  const ensureIncidentReadyForReport = useCallback(async (incidentId) => {
    for (let attempt = 0; attempt < 25; attempt += 1) {
      try {
        const res = await getIncident(incidentId);
        const incident = res?.data || res || {};
        const hasPart3 = !!incident?.part3 && typeof incident.part3 === 'object';
        const hasArtifacts =
          incident?.report_artifacts &&
          (incident.report_artifacts.html_path || incident.report_artifacts.docx_path);
        if (hasPart3 || hasArtifacts) return;
      } catch {
        // retry
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }, []);

  const persistReportToLibrary = useCallback(
    async (reportReady = true) => {
      if (!hitlSeed?.incidentId) return null;
      try {
        const item = await finalizeSavedReport({
          incidentId: hitlSeed.incidentId,
          snapshot: hitlSeed.formData || {},
          analysisModelPreset: hitlSeed.formData?.analysisModelPreset || '',
        });
        setSavedLibraryItemId(item?.id || `report-${hitlSeed.incidentId}`);
        librarySavedRef.current = hitlSeed.incidentId;
        if (typeof onSaveReport === 'function') {
          onSaveReport({
            incidentId: hitlSeed.incidentId,
            formData: hitlSeed.formData,
            reportReady,
          });
        }
        return item;
      } catch (err) {
        if (typeof onSaveReport === 'function') {
          onSaveReport({
            incidentId: hitlSeed.incidentId,
            formData: hitlSeed.formData,
            reportReady: false,
          });
        }
        throw err;
      }
    },
    [hitlSeed, onSaveReport],
  );

  // If finalize failed earlier, auto-retry when user lands on pdf_prompt.
  useEffect(() => {
    if (hitlPhase !== 'pdf_prompt' || !hitlSeed?.incidentId) return;
    if (librarySavedRef.current === hitlSeed.incidentId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        await ensureIncidentReadyForReport(hitlSeed.incidentId);
        if (cancelled) return;
        await persistReportToLibrary(true);
        if (cancelled) return;
        setHitlPhase('report_saved');
        onAnalysisComplete?.({ incidentId: hitlSeed.incidentId });
        setMessages((prev) => [
          ...prev,
          {
            id: `auto-save-${Date.now()}`,
            type: 'assistant',
            content: getTranslation(language, 'hitl_auto_saved'),
            timestamp: new Date(),
          },
        ]);
      } catch (err) {
        if (!cancelled) {
          setMessages((prev) => [
            ...prev,
            {
              id: `auto-save-err-${Date.now()}`,
              type: 'error',
              content: `${getTranslation(language, 'error_occurred')}: ${err.message}`,
              timestamp: new Date(),
            },
          ]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hitlPhase, hitlSeed, language, persistReportToLibrary, ensureIncidentReadyForReport]);

  const runRcaAfterHitl = useCallback(
    async (answers) => {
      if (!hitlSeed?.incidentId) return;
      setHitlPhase('rca');
      setHitlApiQuestion(null);
      setIsLoading(true);
      pipelineActivitySeenRef.current = new Set();
      const streamHeader = `**${pipelineKickoffLine(language)}**`;
      setMessages((prev) => [
        ...prev,
        {
          id: RCA_STREAM_MSG_ID,
          type: 'assistant',
          content: streamHeader,
          timestamp: new Date(),
          isStreaming: true,
        },
      ]);
      const smoothProgress = createSmoothPipelineProgress({
        onTick: (displayPct, stage) => {
          const statusLabel = getStageLabel(language, stage, displayPct);
          setLiveRcaStatus(statusLabel);
          onPipelineStatusChange?.(statusLabel);
        },
      });
      const kickoffLabel = getStageLabel(language, 'investigate', 1);
      setLiveRcaStatus(kickoffLabel);
      onPipelineStatusChange?.(kickoffLabel);
      smoothProgress.update({ stage: 'investigate', progress: 1 });
      try {
        const appendix = formatHitlAnswersBlock(answers);
        const inv = buildInvestigationPayload(hitlSeed.formData, appendix, language);
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
              smoothProgress.update(job);
              const lines = Array.isArray(job?.activity_lines)
                ? job.activity_lines
                : job?.latest_activity
                  ? [job.latest_activity]
                  : [];
              if (!lines.length) return;
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== RCA_STREAM_MSG_ID) return m;
                  const body = appendNewActivityLines(
                    '',
                    lines,
                    pipelineActivitySeenRef.current,
                  );
                  return {
                    ...m,
                    content: stripTechnicalCodes(
                      body ? `${streamHeader}\n\n${body}` : streamHeader,
                    ),
                    isStreaming: true,
                  };
                }),
              );
            },
          },
        );

        smoothProgress.finish(true);
        const resolvedPipelineResult = pipelineResponse?.data || pipelineResponse?.job?.result || null;
        setPipelineResult(resolvedPipelineResult);
        onPipelineStatusChange?.(
          String(language || '').toLowerCase().startsWith('tr')
            ? 'Analiz tamamlandı. Rapor adımına geçildi.'
            : 'Analysis completed. Moving to the report step.',
        );

        const summaryMd = buildPipelineResultMarkdown(resolvedPipelineResult, language);
        const summaryChunks = splitMarkdownForStream(summaryMd);
        let streamBody = appendNewActivityLines(
          '',
          Array.isArray(pipelineResponse?.job?.activity_lines)
            ? pipelineResponse.job.activity_lines
            : [],
          pipelineActivitySeenRef.current,
        );
        let builtContent = streamBody ? `${streamHeader}\n\n${streamBody}` : streamHeader;
        for (const chunk of summaryChunks) {
          builtContent = `${builtContent}\n\n${chunk}`;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === RCA_STREAM_MSG_ID
                ? { ...m, content: builtContent, isStreaming: true }
                : m,
            ),
          );
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 280));
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === RCA_STREAM_MSG_ID
              ? {
                  ...m,
                  content: stripTechnicalCodes(builtContent),
                  isStreaming: false,
                  timestamp: new Date(),
                }
              : m,
          ),
        );
        setIsLoading(true);
        try {
          await ensureIncidentReadyForReport(hitlSeed.incidentId);
          await persistReportToLibrary(true);
          setHitlPhase('report_saved');
          onAnalysisComplete?.({ incidentId: hitlSeed.incidentId });
          setMessages((prev) => [
            ...prev,
            {
              id: `report-saved-${Date.now()}`,
              type: 'assistant',
              content: getTranslation(language, 'hitl_auto_saved'),
              timestamp: new Date(),
            },
          ]);
          setLiveRcaStatus(
            String(language || '').toLowerCase().startsWith('tr')
              ? 'Rapor ve karar agaci Raporlar klasorune kaydedildi.'
              : 'Report and decision tree saved to Reports.',
          );
        } catch (saveErr) {
          setHitlPhase('pdf_prompt');
          setMessages((prev) => [
            ...prev,
            {
              id: `save-err-${Date.now()}`,
              type: 'error',
              content: `${getTranslation(language, 'error_occurred')}: ${saveErr.message}`,
              timestamp: new Date(),
            },
          ]);
        } finally {
          setIsLoading(false);
        }
      } catch (error) {
        smoothProgress.stop();
        setPipelineResult(null);
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
            ? `Analiz hatası: ${error.message}`
            : `Analysis error: ${error.message}`,
        );
      } finally {
        smoothProgress.stop();
        setIsLoading(false);
      }
    },
    [hitlSeed, language, onPipelineStatusChange, persistReportToLibrary, ensureIncidentReadyForReport],
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
      const baseHow = buildHowHappenedText(hitlSeed.formData, language);
      const rci = hitlSeed.formData?.rootCauseInitial || '';
      const appendix = formatHitlAnswersBlock(answers || []);
      const howAugmented = appendix ? `${baseHow}\n\n--- HITL ---\n${appendix}` : baseHow;
      const currentCode = (codes || probeCodes)[branchIdx] || '';

      let body;
      if (mode === 'immediate_identify') {
        body = {
          mode: 'immediate_identify',
          how_happened: howAugmented,
          root_cause_initial: rci,
          batch_size: 1,
          known_fields: deriveKnownFields(hitlSeed.formData || {}),
          output_language: language || 'tr',
        };
      } else if (mode === 'why_probe') {
        body = {
          mode: 'why_probe',
          how_happened: howAugmented,
          root_cause_initial: rci,
          answered_ids: answeredIds,
          immediate_code: currentCode,
          immediate_causes: hitlImmediateCauses,
          why_level: whyLevel,
          current_why_question: hitlWhyDisplay || `Why-${whyLevel}`,
          previous_why_answer: previousWhyAnswer || '',
          batch_size: 1,
          known_fields: deriveKnownFields(hitlSeed.formData || {}),
          output_language: language || 'tr',
        };
      } else {
        body = {
          mode: 'global',
          how_happened: howAugmented,
          root_cause_initial: rci,
          answered_ids: answeredIds,
          batch_size: 1,
          known_fields: deriveKnownFields(hitlSeed.formData || {}),
          output_language: language || 'tr',
        };
      }

      const res = await fetchHitlQuestions(hitlSeed.incidentId, body);
      const payload = res.data || {};
      const q = (payload.questions && payload.questions[0]) || null;
      return {
        done: !!payload.done,
        question: q,
        whyDisplay: payload.why_display || '',
        immediateCauses: payload.immediate_causes || null,
      };
    },
    [hitlSeed, probeCodes, hitlImmediateCauses, hitlWhyDisplay, language],
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
        return {
          done: true,
          question: null,
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
            nextWhyDisplay: r.whyDisplay || '',
          };
        }
        if (r.whyDisplay) {
          prevAns = prevAns || r.whyDisplay;
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

  // Keep refs current every render so HITL start effect always calls the
  // latest version without including these callbacks in its dep array.
  useEffect(() => {
    resolveNextQuestionRef.current = resolveNextQuestion;
    runRcaAfterHitlRef.current = runRcaAfterHitl;
  });

  useEffect(() => {
    if (!hitlSeed?.incidentId) {
      setLiveRcaStatus('');
      processedHitlIdRef.current = null;
      lastFlowPhaseRef.current = null;
      setHitlPhase(null);
      setHitlAnswers([]);
      setHitlAnsweredIds([]);
      setHitlApiQuestion(null);
      setHitlQuestionsLoading(false);
      setHitlMode('why_probe');
      setProbeCodes([]);
      setHitlImmediateCauses([]);
      setHitlWhyDisplay('');
      setProbeBranchIdx(0);
      setProbeWhyLevel(1);
      setPipelineResult(null);
      setMessages([]);
      setSessionId(null);
      onPipelineStatusChange?.('');
      return;
    }
    if (hitlSeed.resumeAt === 'report_saved' || hitlSeed.resumeAt === 'pdf_prompt') {
      processedHitlIdRef.current = hitlSeed.incidentId;
      librarySavedRef.current = hitlSeed.incidentId;
      setSavedLibraryItemId(hitlSeed.libraryItemId || `report-${hitlSeed.incidentId}`);
      setHitlPhase(hitlSeed.resumeAt === 'report_saved' ? 'report_saved' : 'pdf_prompt');
      setHitlQuestionsLoading(false);
      setPipelineResult(null);
      setMessages([
        {
          id: 'report-resume',
          type: 'assistant',
          content: t('hitl_report_resumed'),
          timestamp: new Date(),
        },
      ]);
      setLiveRcaStatus(
        String(language || '').toLowerCase().startsWith('tr')
          ? 'Kayitli rapor acildi. HTML indirebilir veya onizleyebilirsiniz.'
          : 'Saved report opened. You can download or preview HTML.',
      );
      onPipelineStatusChange?.(
        String(language || '').toLowerCase().startsWith('tr')
          ? 'Raporlarimdan acildi'
          : 'Opened from Reports',
      );
      return;
    }

    if (processedHitlIdRef.current === hitlSeed.incidentId) {
      return;
    }
    processedHitlIdRef.current = hitlSeed.incidentId;
    librarySavedRef.current = null;
    lastFlowPhaseRef.current = null;

    setHitlPhase('intro_streaming');
    setHitlAnswers([]);
    setHitlAnsweredIds([]);
    setHitlApiQuestion(null);
    setHitlQuestionsLoading(false);
    setProbeBranchIdx(0);
    setProbeWhyLevel(1);
    setPipelineResult(null);
    setSessionId(Date.now().toString());
    setMessages([
      {
        id: 'hitl-stream',
        type: 'assistant',
        content: `**${getTranslation(language, 'hitl_determining_causes')}**`,
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);
    onPipelineStatusChange?.(
      String(language || '').toLowerCase().startsWith('tr')
        ? 'Doğrudan nedenler belirleniyor.'
        : 'Determining immediate causes.',
    );

    const abortController = new AbortController();
    let cancelled = false;

    const loadFirstQuestion = async () => {
      setHitlPhase('questions');
      setHitlQuestionsLoading(true);
      onPipelineStatusChange?.(
        String(language || '').toLowerCase().startsWith('tr')
          ? 'Mongo BARSEL: doğrudan nedenler belirleniyor…'
          : 'Mongo BARSEL: identifying immediate causes…',
      );
      try {
        const rci = hitlSeed.formData?.rootCauseInitial || '';
        const ident = await fetchQuestionForState({
          mode: 'immediate_identify',
          answers: [],
          answeredIds: [],
          branchIdx: 0,
          whyLevel: 1,
          previousWhyAnswer: '',
          codes: [],
        });
        if (cancelled) return;
        const causes = ident.immediateCauses || [];
        const codes = causes.map((c) => c.code).filter(Boolean);
        if (!codes.length) {
          const fallback = extractHsgCodes(rci);
          setProbeCodes(fallback);
        } else {
          setHitlImmediateCauses(causes);
          setProbeCodes(codes);
        }
        setHitlWhyDisplay(ident.whyDisplay || '');
        setHitlMode('why_probe');
        onPipelineStatusChange?.(
          String(language || '').toLowerCase().startsWith('tr')
            ? `${codes.length || 0} doğrudan neden — Why-1 probe soruları.`
            : `${codes.length || 0} immediate causes — Why-1 probes.`,
        );
        const activeCodes = codes.length ? codes : extractHsgCodes(rci);
        const next = await resolveNextQuestionRef.current({
          mode: 'why_probe',
          answers: [],
          answeredIds: [],
          branchIdx: 0,
          whyLevel: 1,
          previousWhyAnswer: '',
          codes: activeCodes,
        });
        if (cancelled) return;
        if (next.question) {
          setHitlApiQuestion(next.question);
          setProbeBranchIdx(next.nextBranchIdx);
          setProbeWhyLevel(next.nextWhyLevel);
          setHitlAnsweredIds(next.nextAnsweredIds);
          if (next.nextWhyDisplay) setHitlWhyDisplay(next.nextWhyDisplay);
          return;
        }
        if (next.done) {
          void runRcaAfterHitlRef.current([]);
          return;
        }
        if (!cancelled) {
          setMessages((prev) => [
            ...prev,
            {
              id: `hitl-empty-${Date.now()}`,
              type: 'error',
              content: getTranslation(language, 'hitl_no_questions'),
              timestamp: new Date(),
            },
          ]);
          setHitlPhase(null);
        }
      } catch (error) {
        if (!cancelled) {
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
        }
      } finally {
        setHitlQuestionsLoading(false);
      }
    };

    (async () => {
      try {
        await streamHitlIntro({
          language,
          formData: hitlSeed.formData || {},
          incidentId: hitlSeed.incidentId,
          signal: abortController.signal,
          onUpdate: (content, isStreaming) => {
            if (cancelled) return;
            setMessages([
              {
                id: 'hitl-stream',
                type: 'assistant',
                content,
                timestamp: new Date(),
                isStreaming,
              },
            ]);
          },
        });
        if (cancelled) return;
        await loadFirstQuestion();
      } catch (error) {
        if (!cancelled) {
          setMessages((prev) => [
            ...prev,
            {
              id: `hitl-stream-err-${Date.now()}`,
              type: 'error',
              content: `${getTranslation(language, 'error_occurred')}: ${error.message}`,
              timestamp: new Date(),
            },
          ]);
          setHitlPhase(null);
        }
      }
    })();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  // runRcaAfterHitl and resolveNextQuestion intentionally captured via refs —
  // including them here would re-trigger the effect whenever probeCodes or other
  // transitive deps change mid-async, leaving hitlQuestionsLoading stuck.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hitlSeed, language, onPipelineStatusChange]);

  const submitHitlResponse = (value, displayLabel) => {
    if (!hitlSeed?.incidentId || !hitlApiQuestion || isLoading || hitlQuestionsLoading) return;
    const label = displayLabel;
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
          if (hitlMode === 'why_probe' && next.nextBranchIdx > probeBranchIdx) {
            const finishedBranch = probeBranchIdx + 1;
            setMessages((prev) => [
              ...prev,
              {
                id: `branch-done-${Date.now()}`,
                type: 'assistant',
                content: isTurkish
                  ? `${finishedBranch}. derinleştirme turu tamamlandı. Sıradaki sorulara geçiyoruz.`
                  : `Deepening round ${finishedBranch} is complete. Moving to the next questions.`,
                timestamp: new Date(),
              },
            ]);
          }
          setHitlApiQuestion(next.question);
          setProbeBranchIdx(next.nextBranchIdx);
          setProbeWhyLevel(next.nextWhyLevel);
          setHitlAnsweredIds(next.nextAnsweredIds);
          if (next.nextWhyDisplay) setHitlWhyDisplay(next.nextWhyDisplay);
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

  const handleHitlAnswer = (value) => {
    if (!['yes', 'no', 'unknown', 'skip'].includes(value)) return;
    const labels = {
      yes: t('yes'),
      no: t('no'),
      unknown: t('unknown'),
      skip: t('hitl_skip_question'),
    };
    submitHitlResponse(value, labels[value] || value);
  };

  const handleHitlFreeTextSubmit = () => {
    const text = (hitlTextDraft || '').trim();
    if (!text) return;
    submitHitlResponse('free_text', text);
  };

  const isOtherChoiceLabel = (label) =>
    /\b(diğer|diger|other|autre|otro|sonstige|altro|anderes)\b/i.test(String(label || ''));

  const getOtherChoiceIndex = () => {
    if (!hitlApiQuestion) return -1;
    const trOpts = hitlApiQuestion.choice_options || [];
    const displayOpts = getHitlChoiceOptionLabels(hitlApiQuestion, language);
    const merged = trOpts.length ? trOpts : displayOpts;
    return merged.findIndex((opt) => isOtherChoiceLabel(opt));
  };

  const handleHitlChoiceClick = (optionIndex) => {
    if (!hitlApiQuestion) return;
    const trOpts = hitlApiQuestion.choice_options || [];
    const displayOpts = getHitlChoiceOptionLabels(hitlApiQuestion, language);
    const labelTr = (trOpts[optionIndex] || displayOpts[optionIndex] || '').trim();
    if (!labelTr) return;
    const multi = isHitlChoiceMulti(hitlApiQuestion);
    const otherIdx = getOtherChoiceIndex();
    const isOther = optionIndex === otherIdx;
    if (!multi) {
      if (isOther) {
        setHitlChoiceIdx(new Set([optionIndex]));
        return;
      }
      submitHitlResponse('choice', labelTr);
      return;
    }
    setHitlChoiceIdx((prev) => {
      const n = new Set(prev);
      if (n.has(optionIndex)) n.delete(optionIndex);
      else n.add(optionIndex);
      return n;
    });
  };

  const handleHitlMultiChoiceSubmit = () => {
    if (!hitlApiQuestion) return;
    const trOpts = hitlApiQuestion.choice_options || [];
    const displayOpts = getHitlChoiceOptionLabels(hitlApiQuestion, language);
    const idxs = Array.from(hitlChoiceIdx).sort((a, b) => a - b);
    if (!idxs.length) return;
    const otherIdx = getOtherChoiceIndex();
    const parts = idxs.map((i) => (trOpts[i] || displayOpts[i] || '').trim()).filter(Boolean);
    if (otherIdx >= 0 && idxs.includes(otherIdx)) {
      const extra = (hitlOtherDraft || '').trim();
      if (!extra) return;
      const mapped = parts.map((p, i) =>
        idxs[i] === otherIdx ? `${p}: ${extra}` : p,
      );
      submitHitlResponse('choice_multi', mapped.join(' · '));
      return;
    }
    if (!parts.length) return;
    submitHitlResponse('choice_multi', parts.join(' · '));
  };

  const handleHitlOtherSubmit = () => {
    if (!hitlApiQuestion) return;
    const text = (hitlOtherDraft || '').trim();
    if (!text) return;
    const trOpts = hitlApiQuestion.choice_options || [];
    const displayOpts = getHitlChoiceOptionLabels(hitlApiQuestion, language);
    const otherIdx = getOtherChoiceIndex();
    const otherLabel = (trOpts[otherIdx] || displayOpts[otherIdx] || (isTurkish ? 'Diğer' : 'Other')).trim();
    const multi = isHitlChoiceMulti(hitlApiQuestion);
    if (multi) {
      handleHitlMultiChoiceSubmit();
      return;
    }
    submitHitlResponse('choice', `${otherLabel}: ${text}`);
  };

  const handleHtmlGenerate = async () => {
    if (!hitlSeed?.incidentId) return;
    setIsLoading(true);
    const layout = reportTemplateConfig.layoutPayload || DEFAULT_REPORT_LAYOUT;
    try {
      await ensureIncidentReadyForReport(hitlSeed.incidentId);
      await generateHTMLReport(hitlSeed.incidentId, { report_layout: layout, force_regenerate: true });
      await downloadHTMLReport(hitlSeed.incidentId, { report_layout: layout, force_regenerate: false });
      persistReportToLibrary(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `html-ok-${Date.now()}`,
          type: 'assistant',
          content: t('hitl_html_download_ok'),
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `html-err-${Date.now()}`,
          type: 'error',
          content: `${t('error_occurred')}: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const notifyAnalysisComplete = useCallback(() => {
    if (hitlSeed?.incidentId) {
      onAnalysisComplete?.({ incidentId: hitlSeed.incidentId });
    }
  }, [hitlSeed, onAnalysisComplete]);

  const handleCloseHitlPanel = () => {
    setLiveRcaStatus('');
    setHitlPhase(null);
    processedHitlIdRef.current = null;
    lastFlowPhaseRef.current = null;
    onHitlFlowComplete?.();
    setMessages([]);
    setSessionId(null);
    onPipelineStatusChange?.('');
    onGoToFormTab?.();
  };

  const handlePdfSkip = () => {
    handleCloseHitlPanel();
  };

  const runReportAction = useCallback(
    async (fn) => {
      if (!hitlSeed?.incidentId) return;
      const layoutOpts = {
        report_layout: reportTemplateConfig.layoutPayload || DEFAULT_REPORT_LAYOUT,
        force_regenerate: true,
      };
      try {
        await ensureIncidentReadyForReport(hitlSeed.incidentId);
        await generateHTMLReport(hitlSeed.incidentId, layoutOpts);
        const result = await fn(hitlSeed.incidentId, layoutOpts);
        if (result?.mode === 'download') {
          setMessages((prev) => [
            ...prev,
            {
              id: `report-download-fallback-${Date.now()}`,
              type: 'assistant',
              content: t('hitl_report_download_fallback'),
              timestamp: new Date(),
            },
          ]);
        }
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
    [hitlSeed, language, ensureIncidentReadyForReport, t, reportTemplateConfig],
  );

  const handleSend = async () => {
    if (!hitlSeed?.incidentId || !input.trim() || isLoading) return;
    if (
      hitlPhase === 'intro_streaming' ||
      hitlPhase === 'questions' ||
      hitlPhase === 'rca' ||
      hitlPhase === 'pdf_prompt' ||
      hitlPhase === 'report_saved'
    ) {
      return;
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
    lastFlowPhaseRef.current = null;
    setCurrentFlow(null);
    setHitlPhase(null);
    setHitlAnswers([]);
    setHitlAnsweredIds([]);
    setHitlApiQuestion(null);
    setHitlQuestionsLoading(false);
    setHitlMode('why_probe');
    setProbeCodes([]);
    setHitlImmediateCauses([]);
    setHitlWhyDisplay('');
    setProbeBranchIdx(0);
    setProbeWhyLevel(1);
    setPipelineResult(null);
    setMessages([]);
    setSessionId(null);
    onPipelineStatusChange?.('');
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

  const hitlSessionActive = Boolean(hitlSeed?.incidentId);
  const showFreeTextInput =
    hitlPhase === 'pdf_prompt' || hitlPhase === 'report_saved' || hitlPhase === null;
  const inputLocked =
    !hitlSessionActive ||
    isLoading ||
    hitlQuestionsLoading ||
    hitlPhase === 'intro_streaming' ||
    hitlPhase === 'questions' ||
    hitlPhase === 'rca' ||
    hitlPhase === 'pdf_prompt' ||
    hitlPhase === 'report_saved';
  const isTurkish = String(language || '').toLowerCase().startsWith('tr');

  const showHitlPanel = hitlPhase === 'questions' && (hitlQuestionsLoading || hitlApiQuestion);
  const displayChoiceLabels = hitlApiQuestion
    ? getHitlChoiceOptionLabels(hitlApiQuestion, language)
    : [];
  const showHitlChips =
    hitlApiQuestion && hitlQuestionNeedsChoice(hitlApiQuestion) && displayChoiceLabels.length >= 2;
  const hitlOtherIdx = showHitlChips ? getOtherChoiceIndex() : -1;
  const hitlOtherSelected = showHitlChips && hitlOtherIdx >= 0 && hitlChoiceIdx.has(hitlOtherIdx);
  const showHitlQuickChoices =
    hitlApiQuestion && hitlQuestionShowsYesNo(hitlApiQuestion);
  const showHitlTextArea =
    hitlApiQuestion && !showHitlChips && showHitlQuickChoices;
  const hitlCauseTitle = hitlApiQuestion ? getHitlCauseTitle(hitlApiQuestion) : '';
  const hitlContextNote = hitlApiQuestion ? getHitlContextNote(hitlApiQuestion) : '';

  const renderHitlQuickChoiceButtons = () => (
    <div className="hitl-choices">
      <button
        type="button"
        className="hitl-choice-btn"
        onClick={() => handleHitlAnswer('yes')}
        disabled={isLoading || hitlQuestionsLoading}
      >
        {t('yes')}
      </button>
      <button
        type="button"
        className="hitl-choice-btn hitl-choice-no"
        onClick={() => handleHitlAnswer('no')}
        disabled={isLoading || hitlQuestionsLoading}
      >
        {t('no')}
      </button>
      <button
        type="button"
        className="hitl-choice-btn hitl-choice-un"
        onClick={() => handleHitlAnswer('unknown')}
        disabled={isLoading || hitlQuestionsLoading}
      >
        {t('unknown')}
      </button>
      <button
        type="button"
        className="hitl-choice-btn hitl-choice-skip"
        onClick={() => handleHitlAnswer('skip')}
        disabled={isLoading || hitlQuestionsLoading}
      >
        {t('hitl_skip_question')}
      </button>
    </div>
  );

  return (
    <div className="chat-interface chat-interface--full">
      <div className="chat-main">
        <div className="chat-messages">
          {!hitlSeed?.incidentId ? (
            <div className="chat-form-gate">
              <h3>{t('chat_requires_form_title')}</h3>
              <p>{t('chat_requires_form_body')}</p>
              <button type="button" className="chat-form-gate-btn" onClick={() => onGoToFormTab?.()}>
                {t('chat_go_to_form')}
              </button>
            </div>
          ) : (
            messages.map((message) => (
              <Message key={message.id} message={message} language={language} />
            ))
          )}

          {currentFlow && (
            <QuestionFlow
              flowType={currentFlow}
              language={language}
              onAnswer={handleQuestionAnswer}
              onComplete={() => setCurrentFlow(null)}
            />
          )}

          {showHitlPanel && (
            <div className="hitl-choice-panel hitl-choice-panel--flow">
              {hitlQuestionsLoading && !hitlApiQuestion ? (
                <p className="hitl-q">{t('hitl_loading_questions')}</p>
              ) : hitlApiQuestion ? (
                <>
                  {hitlMode === 'why_probe' && hitlWhyDisplay ? (
                    <p className="hitl-why-display">
                      {isTurkish ? `NEDEN ${probeWhyLevel}` : `WHY ${probeWhyLevel}`}: {hitlWhyDisplay}
                    </p>
                  ) : null}
                  {hitlCauseTitle ? (
                    <p className="hitl-cause-title">{hitlCauseTitle}</p>
                  ) : null}
                  <p className="hitl-q">{getHitlQuestionLabel(hitlApiQuestion, language)}</p>
                  {hitlContextNote ? (
                    <p className="hitl-flow-context hitl-probe-context">{hitlContextNote}</p>
                  ) : null}
                  {showHitlQuickChoices ? renderHitlQuickChoiceButtons() : null}
                  {showHitlChips ? (
                    <div className="hitl-choice-chips-wrap">
                      <div className="hitl-choice-head">
                        <span className="hitl-choice-title">
                          {isTurkish ? 'Uygun seçenekleri işaretleyin' : 'Select applicable options'}
                        </span>
                        {isHitlChoiceMulti(hitlApiQuestion) && (
                          <span className="hitl-choice-count">
                            {hitlChoiceIdx.size} {isTurkish ? 'seçim' : 'selected'}
                          </span>
                        )}
                      </div>
                      {isHitlChoiceMulti(hitlApiQuestion) && (
                        <p className="hitl-multi-hint">{t('hitl_multi_choice_hint')}</p>
                      )}
                      <div className="hitl-option-chips" role="group" aria-label={t('hitl_questions_title')}>
                        {displayChoiceLabels.map((label, idx) => (
                          <button
                            key={`hitl-opt-${hitlApiQuestion.id}-${idx}`}
                            type="button"
                            className={`hitl-option-chip ${hitlChoiceIdx.has(idx) ? 'is-selected' : ''}`}
                            onClick={() => handleHitlChoiceClick(idx)}
                            disabled={isLoading || hitlQuestionsLoading}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {hitlOtherSelected && (
                        <div className="hitl-other-wrap">
                          <textarea
                            className="hitl-free-text-input hitl-other-text-input"
                            value={hitlOtherDraft}
                            onChange={(e) => setHitlOtherDraft(e.target.value)}
                            rows={2}
                            placeholder={isTurkish ? 'Diğer seçeneğini kısaca yazın...' : 'Please specify the other option...'}
                          />
                          {!isHitlChoiceMulti(hitlApiQuestion) && (
                            <button
                              type="button"
                              className="hitl-choice-btn hitl-choice-primary"
                              onClick={handleHitlOtherSubmit}
                              disabled={!hitlOtherDraft.trim() || isLoading || hitlQuestionsLoading}
                            >
                              {t('hitl_submit_text_answer')}
                            </button>
                          )}
                        </div>
                      )}
                      {isHitlChoiceMulti(hitlApiQuestion) && (
                        <button
                          type="button"
                          className="hitl-choice-btn hitl-choice-primary"
                          onClick={handleHitlMultiChoiceSubmit}
                          disabled={
                            hitlChoiceIdx.size === 0 ||
                            (hitlOtherSelected && !hitlOtherDraft.trim()) ||
                            isLoading ||
                            hitlQuestionsLoading
                          }
                        >
                          {t('hitl_submit_choices')}
                        </button>
                      )}
                    </div>
                  ) : showHitlTextArea ? (
                    <div className="hitl-free-text-wrap hitl-free-text-wrap--hybrid">
                      <textarea
                        className="hitl-free-text-input"
                        value={hitlTextDraft}
                        onChange={(e) => setHitlTextDraft(e.target.value)}
                        onKeyDown={(e) =>
                          handleHitlTextareaEnter(e, () => {
                            if (hitlTextDraft.trim()) handleHitlFreeTextSubmit();
                          })
                        }
                        rows={2}
                        placeholder={t('hitl_optional_text_placeholder')}
                        disabled={isLoading || hitlQuestionsLoading}
                      />
                      <p className="hitl-text-hint">{t('hitl_hybrid_text_hint')}</p>
                      {hitlTextDraft.trim() ? (
                        <button
                          type="button"
                          className="hitl-choice-btn hitl-choice-primary"
                          onClick={handleHitlFreeTextSubmit}
                          disabled={isLoading || hitlQuestionsLoading}
                        >
                          {t('hitl_submit_text_answer')}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          )}

          {hitlPhase === 'report_saved' && (
            <div className="hitl-choice-panel hitl-pdf-panel">
              <p className="hitl-q">{t('hitl_auto_saved')}</p>
              <ReportTemplatePicker
                language={language}
                value={reportTemplateConfig}
                onChange={setReportTemplateConfig}
                disabled={isLoading}
              />
              <div className="hitl-choices hitl-report-actions">
                <div className="report-action-card">
                  <div className="report-action-title">{isTurkish ? 'Rapor' : 'Report'}</div>
                  <button
                    type="button"
                    className="hitl-choice-btn report-open-btn"
                    disabled={isLoading || !savedLibraryItemId}
                    onClick={() => openLibraryArtifact(savedLibraryItemId, 'report')}
                  >
                    {isTurkish ? 'Raporu Ac (HTML)' : 'Open report (HTML)'}
                  </button>
                </div>
                <div className="report-action-card">
                  <div className="report-action-title">{isTurkish ? 'Karar Agaci' : 'Decision tree'}</div>
                  <button
                    type="button"
                    className="hitl-choice-btn report-open-btn"
                    disabled={isLoading || !savedLibraryItemId}
                    onClick={() => openLibraryArtifact(savedLibraryItemId, 'decision_tree')}
                  >
                    {isTurkish ? 'Karar Agacini Ac (HTML)' : 'Open decision tree (HTML)'}
                  </button>
                </div>
              </div>
              <div className="hitl-choices">
                <button
                  type="button"
                  className="hitl-choice-btn hitl-choice-primary"
                  onClick={() => onGoToReportsTab?.()}
                >
                  {t('hitl_open_reports_tab')}
                </button>
                <button
                  type="button"
                  className="hitl-choice-btn hitl-choice-primary"
                  onClick={() => {
                    notifyAnalysisComplete();
                    if (typeof onStartNewAnalysis === 'function') {
                      onStartNewAnalysis();
                    } else {
                      handlePdfSkip();
                    }
                  }}
                >
                  {t('btn_new_analysis')}
                </button>
                <button
                  type="button"
                  className="hitl-choice-btn"
                  onClick={() => {
                    notifyAnalysisComplete();
                    handleCloseHitlPanel();
                  }}
                >
                  {isTurkish ? 'Kapat' : 'Close'}
                </button>
              </div>
            </div>
          )}

          {hitlPhase === 'pdf_prompt' && (
            <div className="hitl-choice-panel hitl-pdf-panel">
              <p className="hitl-q">{t('hitl_ask_pdf')}</p>
              <ReportTemplatePicker
                language={language}
                value={reportTemplateConfig}
                onChange={setReportTemplateConfig}
                disabled={isLoading}
              />
              <div className="hitl-choices">
                <button type="button" className="hitl-choice-btn hitl-choice-primary" onClick={handleHtmlGenerate} disabled={isLoading}>
                  {t('hitl_pdf_download')}
                </button>
                <button type="button" className="hitl-choice-btn" onClick={handlePdfSkip} disabled={isLoading}>
                  {t('hitl_pdf_skip')}
                </button>
              </div>
              <div className="hitl-choices hitl-save-report-row">
                <button
                  type="button"
                  className="hitl-choice-btn hitl-choice-save"
                  onClick={() => {
                    persistReportToLibrary(true);
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: `save-report-${Date.now()}`,
                        type: 'assistant',
                        content: t('report_saved_toast'),
                        timestamp: new Date(),
                      },
                    ]);
                  }}
                  disabled={isLoading}
                >
                  {t('save_report')}
                </button>
              </div>
              <div className="hitl-choices hitl-report-actions">
                <div className="report-action-card">
                  <div className="report-action-title">{isTurkish ? 'Rapor' : 'Report'}</div>
                  <button type="button" className="hitl-choice-btn report-open-btn" onClick={() => runReportAction(openHTMLReport)} disabled={isLoading}>
                    {isTurkish ? 'Raporu Ac' : 'Open Report'}
                  </button>
                  <button type="button" className="hitl-choice-btn" onClick={() => runReportAction(downloadHTMLReport)} disabled={isLoading}>
                    {isTurkish ? 'HTML Indir' : 'Download HTML'}
                  </button>
                </div>
                <div className="report-action-card">
                  <div className="report-action-title">Decision Tree</div>
                  <button type="button" className="hitl-choice-btn report-open-btn" onClick={() => runReportAction(openDecisionTree)} disabled={isLoading}>
                    {isTurkish ? 'Decision Tree Ac' : 'Open Decision Tree'}
                  </button>
                  <button type="button" className="hitl-choice-btn" onClick={() => runReportAction(downloadDecisionTree)} disabled={isLoading}>
                    {isTurkish ? 'Decision Tree Indir' : 'Download Decision Tree'}
                  </button>
                </div>
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

        {hitlSessionActive ? (
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

            {showFreeTextInput ? (
              <>
                <div className="chat-input-wrapper">
                  <button className="attach-btn" title={t('attach_file')} type="button" disabled>
                    <Paperclip size={20} />
                  </button>
                  <textarea
                    className="chat-input"
                    placeholder={t('hitl_input_locked_placeholder')}
                    value=""
                    rows={1}
                    disabled
                    readOnly
                  />
                  <button className="send-btn" disabled type="button" aria-hidden>
                    <Send size={20} />
                  </button>
                </div>
                <div className="input-hint">
                  <AlertCircle size={14} />
                  <span>{t('hitl_input_locked_placeholder')}</span>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ChatInterface;
