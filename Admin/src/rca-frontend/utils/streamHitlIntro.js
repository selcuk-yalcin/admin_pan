import { getTranslation } from './translations';
import { deriveImmediateCauseLines } from './investigationPayload';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * HITL öncesi doğrudan nedenleri satır satır akışla gösterir.
 * @param {object} opts
 * @param {string} opts.language
 * @param {object} opts.formData
 * @param {string} opts.incidentId
 * @param {(content: string, isStreaming: boolean) => void} opts.onUpdate
 * @param {AbortSignal} [opts.signal]
 */
export async function streamHitlIntro({ language, formData, incidentId, onUpdate, signal }) {
  const t = (key) => getTranslation(language, key);
  const lines = deriveImmediateCauseLines(formData, 5);

  let content = `**${t('hitl_determining_causes')}**`;
  onUpdate(content, true);
  await sleep(500);
  if (signal?.aborted) return;

  if (!lines.length) {
    content += `\n\n${t('hitl_analyzing_narrative')}`;
    onUpdate(content, true);
    await sleep(900);
    if (signal?.aborted) return;
  } else {
    for (let i = 0; i < lines.length; i += 1) {
      if (signal?.aborted) return;
      await sleep(380 + (i % 3) * 80);
      content += `\n\n${i + 1}. ${lines[i]}`;
      onUpdate(content, true);
    }
  }

  await sleep(450);
  if (signal?.aborted) return;

  content += `\n\n${t('hitl_intro_deepening_notice')}`;
  content += `\n\n*Incident ID: ${incidentId}*`;
  onUpdate(content, false);
}
