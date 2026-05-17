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
  getIncident,
  fetchHitlQuestions,
} from '../../services/hsg245Api';
import {
  buildInvestigationPayload,
  parseInitialImmediateCauses,
  buildHowHappenedText,
} from '../utils/investigationPayload';
import { getHitlQuestionLabel, formatHitlAnswersBlock } from '../utils/hitlKbQuestions';
import {
  hitlQuestionNeedsFreeText,
  hitlQuestionNeedsChoice,
  getHitlChoiceOptionLabels,
  isHitlChoiceMulti,
} from '../utils/hitlResponseMode';
import './ChatInterface.css';

const MAX_PROBE_CODES = 3;
const MAX_WHY_LEVEL = 5;
/** Uzun RCA + thinking modeller; 6 dk önce UI "Pipeline timeout" veriyordu. */
const PIPELINE_TIMEOUT_MS = 20 * 60 * 1000;

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
  return out;
}

function stripCodePrefix(line) {
  return String(line || '')
    .replace(/^\s*\d+[\.)-]?\s*/, '')
    .replace(/^\s*[ABCD]\d+\.\d+\s*[-:)]?\s*/i, '')
    .trim();
}

/** Panelde HSG245 markası ve gereksiz kod öneklerini gizle. */
function formatHitlHint(hint) {
  return String(hint || '')
    .replace(/HSG\s*245/gi, '')
    .replace(/\bKB\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
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

/**
 * @param {object} props
 * @param {string} props.language
 * @param {{ incidentId: string, formData: object } | null} props.hitlSeed - manuel formdan gelen HITL oturumu
 * @param {(status: string) => void} [props.onPipelineStatusChange] - Agent pipeline canlı durum metni
 * @param {() => void} [props.onHitlFlowComplete] - HITL akışı bittiğinde
 * @param {(payload: { incidentId: string, formData?: object, reportReady?: boolean }) => void} [props.onSaveReport]
 */
const ChatInterface = ({
  language,
  hitlSeed = null,
  onPipelineStatusChange,
  onHitlFlowComplete,
  onSaveReport,
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
  const hitlLoadGenRef = useRef(0);
  const resolveNextQuestionRef = useRef(null);
  const librarySavedRef = useRef(null);
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
    setHitlTextDraft('');
    setHitlOtherDraft('');
    setHitlChoiceIdx(new Set());
  }, [hitlApiQuestion?.id]);

  const persistReportToLibrary = useCallback(
    (reportReady = true) => {
      if (!hitlSeed?.incidentId || typeof onSaveReport !== 'function') return;
      onSaveReport({
        incidentId: hitlSeed.incidentId,
        formData: hitlSeed.formData,
        reportReady,
      });
      librarySavedRef.current = hitlSeed.incidentId;
    },
    [hitlSeed, onSaveReport],
  );

  useEffect(() => {
    if (hitlPhase !== 'pdf_prompt' || !hitlSeed?.incidentId) return;
    if (librarySavedRef.current === hitlSeed.incidentId) return;
    persistReportToLibrary(true);
  }, [hitlPhase, hitlSeed, persistReportToLibrary]);

  const runRcaAfterHitl = useCallback(
    async (answers) => {
      if (!hitlSeed?.incidentId) return;
      setHitlPhase('rca');
      setHitlApiQuestion(null);
      setIsLoading(true);
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
              const stage = job?.stage || job?.status || 'running';
              const progress = job?.progress ?? 0;
              const statusLabel = getStageLabel(language, stage, progress);
              setLiveRcaStatus(statusLabel);
              onPipelineStatusChange?.(statusLabel);
            },
          },
        );

        const resolvedPipelineResult = pipelineResponse?.data || pipelineResponse?.job?.result || null;
        setPipelineResult(resolvedPipelineResult);
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
        persistReportToLibrary(true);
        setLiveRcaStatus(
          String(language || '').toLowerCase().startsWith('tr')
            ? 'Analiz tamamlandi, rapor adimina gecildi.'
            : 'Analysis completed, moved to report stage.',
        );
      } catch (error) {
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
            ? `Pipeline hatasi: ${error.message}`
            : `Pipeline error: ${error.message}`,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [hitlSeed, language, onPipelineStatusChange, persistReportToLibrary],
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
              known_fields: deriveKnownFields(hitlSeed.formData || {}),
            }
          : {
              mode: 'global',
              how_happened: howAugmented,
              root_cause_initial: rci,
              answered_ids: answeredIds,
              batch_size: 1,
              known_fields: deriveKnownFields(hitlSeed.formData || {}),
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

  // Keep ref current so the HITL start effect can call the latest version
  // without including resolveNextQuestion in its own dep array.
  useEffect(() => {
    resolveNextQuestionRef.current = resolveNextQuestion;
  });

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
    if (hitlSeed.resumeAt === 'pdf_prompt') {
      processedHitlIdRef.current = hitlSeed.incidentId;
      librarySavedRef.current = hitlSeed.incidentId;
      setHitlPhase('pdf_prompt');
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

    const bullets = parseInitialImmediateCauses(hitlSeed.formData?.rootCauseInitial)
      .map(stripCodePrefix)
      .filter(Boolean)
      .slice(0, MAX_PROBE_CODES);
    const bulletText = bullets.length
      ? bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')
      : getTranslation(language, 'hitl_no_initial_causes');

    const intro = [
      String(language || '').toLowerCase().startsWith('tr')
        ? 'İlk bulunan dogrudan nedenler'
        : 'Initial immediate causes',
      '',
      bulletText,
      '',
      String(language || '').toLowerCase().startsWith('tr')
        ? 'Simdi daha derin arastirma icin sorulari birlikte yanitlayacagiz.'
        : 'Now we will answer deeper investigation questions together.',
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
    setSessionId(Date.now().toString());
    onPipelineStatusChange?.(
      String(language || '').toLowerCase().startsWith('tr')
        ? `Derinlestirme sorulari basladi (Incident: ${hitlSeed.incidentId})`
        : `Deepening questions started (Incident: ${hitlSeed.incidentId})`,
    );

    const rci = hitlSeed.formData?.rootCauseInitial || '';
    const codes = extractHsgCodes(rci);
    const mode = codes.length ? 'why_probe' : 'global';
    setHitlMode(mode);
    setProbeCodes(codes);

    let cancelled = false;
    (async () => {
      try {
        const next = await resolveNextQuestionRef.current({
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
          return;
        }
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
  // resolveNextQuestion intentionally omitted — captured via ref to avoid re-triggering
  // when setProbeCodes changes probeCodes state mid-effect.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hitlSeed, language, runRcaAfterHitl, onPipelineStatusChange]);

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
            const rcCode = probeCodes[probeBranchIdx] || '-';
            setMessages((prev) => [
              ...prev,
              {
                id: `branch-done-${Date.now()}`,
                type: 'assistant',
                content: isTurkish
                  ? `Dal ${finishedBranch} tamamlandi (Kod: ${rcCode}). Simdi Dal ${next.nextBranchIdx + 1} icin derin sorulara geciyoruz.`
                  : `Branch ${finishedBranch} completed (Code: ${rcCode}). Moving to deep questions for branch ${next.nextBranchIdx + 1}.`,
                timestamp: new Date(),
              },
            ]);
          }
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

  const handleHitlAnswer = (value) => {
    if (!['yes', 'no', 'unknown'].includes(value)) return;
    const labels = {
      yes: t('yes'),
      no: t('no'),
      unknown: t('unknown'),
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

  const ensureIncidentReadyForReport = useCallback(async (incidentId) => {
    // Job "completed" olsa da incident.part3 kısa süre gecikmeli yazılabilir.
    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        const res = await getIncident(incidentId);
        const incident = res?.data || res || {};
        const hasPart3 = !!incident?.part3 && typeof incident.part3 === 'object';
        const hasArtifacts =
          incident?.report_artifacts &&
          (incident.report_artifacts.html_path || incident.report_artifacts.docx_path);
        if (hasPart3 || hasArtifacts) return;
      } catch {
        // Ağ/timeout hatasında kısa retry yap.
      }
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }, []);

  const handleHtmlGenerate = async () => {
    if (!hitlSeed?.incidentId) return;
    setIsLoading(true);
    try {
      await ensureIncidentReadyForReport(hitlSeed.incidentId);
      await generateHTMLReport(hitlSeed.incidentId);
      await downloadHTMLReport(hitlSeed.incidentId);
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
  };

  const runReportAction = useCallback(
    async (fn) => {
      if (!hitlSeed?.incidentId) return;
      try {
        await ensureIncidentReadyForReport(hitlSeed.incidentId);
        const result = await fn(hitlSeed.incidentId);
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
    [hitlSeed, language, ensureIncidentReadyForReport, t],
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
  const isTurkish = String(language || '').toLowerCase().startsWith('tr');
  const totalBranches = hitlMode === 'why_probe' ? Math.max(1, probeCodes.length) : 1;
  const branchProgressLabel =
    hitlMode === 'why_probe'
      ? isTurkish
        ? `Dal ${probeBranchIdx + 1}/${totalBranches} - Why ${probeWhyLevel}/${MAX_WHY_LEVEL}`
        : `Branch ${probeBranchIdx + 1}/${totalBranches} - Why ${probeWhyLevel}/${MAX_WHY_LEVEL}`
      : isTurkish
        ? `Derinlestirme asamasi - Soru ${hitlAnswers.length + 1}`
        : `Deepening stage - Question ${hitlAnswers.length + 1}`;
  const branchGateText =
    hitlMode === 'why_probe'
      ? isTurkish
        ? `Dal ${probeBranchIdx + 1} tamamlanmadan sonraki dala gecilmez.`
        : `The next branch cannot start before Branch ${probeBranchIdx + 1} is completed.`
      : isTurkish
        ? 'Siradaki soru onceki cevaplara gore derinlestirilir.'
        : 'Next question is deepened from your previous answer.';

  const showHitlPanel = hitlPhase === 'questions' && (hitlQuestionsLoading || hitlApiQuestion);
  const displayChoiceLabels = hitlApiQuestion
    ? getHitlChoiceOptionLabels(hitlApiQuestion, language)
    : [];
  const showHitlChips =
    hitlApiQuestion && hitlQuestionNeedsChoice(hitlApiQuestion) && displayChoiceLabels.length >= 2;
  const hitlOtherIdx = showHitlChips ? getOtherChoiceIndex() : -1;
  const hitlOtherSelected = showHitlChips && hitlOtherIdx >= 0 && hitlChoiceIdx.has(hitlOtherIdx);
  const showHitlFree = hitlApiQuestion && !showHitlChips && hitlQuestionNeedsFreeText(hitlApiQuestion);
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
              <h4>{t('step_2_hitl')}</h4>
              <p>{t('step_2_hitl_desc')}</p>
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
              <div className="hitl-branch-status">
                <div className="hitl-branch-title">{branchProgressLabel}</div>
                <div className="hitl-branch-sub">{branchGateText}</div>
              </div>
              {hitlQuestionsLoading && !hitlApiQuestion ? (
                <p className="hitl-q">{t('hitl_loading_questions')}</p>
              ) : hitlApiQuestion ? (
                <>
                  {(() => {
                    const hintRaw =
                      hitlMode === 'why_probe'
                        ? formatHitlHint(hitlApiQuestion.hsg_hint) || currentProbeCode
                        : formatHitlHint(hitlApiQuestion.hsg_hint);
                    if (!hintRaw) return null;
                    return (
                      <div className="hitl-hint">
                        {hitlMode === 'why_probe'
                          ? isTurkish
                            ? `Dal ${probeBranchIdx + 1}/${Math.max(1, probeCodes.length)} • Why-${probeWhyLevel} • ${hintRaw}`
                            : `Branch ${probeBranchIdx + 1}/${Math.max(1, probeCodes.length)} • Why-${probeWhyLevel} • ${hintRaw}`
                          : hintRaw}
                      </div>
                    );
                  })()}
                  <p className="hitl-q">{getHitlQuestionLabel(hitlApiQuestion, language)}</p>
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
                  ) : showHitlFree ? (
                    <div className="hitl-free-text-wrap">
                      <textarea
                        className="hitl-free-text-input"
                        value={hitlTextDraft}
                        onChange={(e) => setHitlTextDraft(e.target.value)}
                        rows={3}
                        placeholder={t('hitl_free_text_placeholder')}
                      />
                      <button
                        type="button"
                        className="hitl-choice-btn hitl-choice-primary"
                        onClick={handleHitlFreeTextSubmit}
                        disabled={!hitlTextDraft.trim() || isLoading || hitlQuestionsLoading}
                      >
                        {t('hitl_submit_text_answer')}
                      </button>
                    </div>
                  ) : (
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
                  )}
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
              placeholder={inputLocked ? t('hitl_input_locked_placeholder') : t('input_placeholder')}
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
