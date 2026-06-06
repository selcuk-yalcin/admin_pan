import { getTranslation } from './translations';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * API immediate_causes satırı (kullanıcıya kod + kısa açıklama).
 * @param {object} cause
 */
export function formatImmediateCauseLine(cause) {
  if (!cause || typeof cause !== 'object') return '';
  const label = String(
    cause.cause_tr || cause.standard_title_tr || cause.evidence_tr || '',
  ).trim();
  const code = String(cause.code || '').trim().toUpperCase();
  if (label && code && !label.toUpperCase().includes(code)) {
    return `${label} (${code})`;
  }
  return label || code;
}

/**
 * @param {object[]} causes
 * @param {number} [max]
 */
export function immediateCauseLinesFromApi(causes, max = 5) {
  if (!Array.isArray(causes)) return [];
  return causes
    .map(formatImmediateCauseLine)
    .filter(Boolean)
    .slice(0, max);
}

/**
 * HITL öncesi doğrudan nedenleri satır satır akışla gösterir.
 * Yalnızca backend immediate_identify çıktısı kullanılır (form alanından değil).
 * @param {object} opts
 * @param {string} opts.language
 * @param {object[]} [opts.causes] — API immediate_causes
 * @param {(content: string, isStreaming: boolean) => void} opts.onUpdate
 * @param {AbortSignal} [opts.signal]
 */
export async function streamHitlIntro({ language, causes = [], onUpdate, signal }) {
  const t = (key) => getTranslation(language, key);
  const lines = immediateCauseLinesFromApi(causes, 5);

  let content = `**${t('hitl_determining_causes')}**`;
  onUpdate(content, true);
  await sleep(450);
  if (signal?.aborted) return;

  if (!lines.length) {
    content += `\n\n${t('hitl_no_immediate_causes_yet')}`;
    onUpdate(content, true);
    await sleep(700);
    if (signal?.aborted) return;
  } else {
    for (let i = 0; i < lines.length; i += 1) {
      if (signal?.aborted) return;
      await sleep(360 + (i % 3) * 70);
      content += `\n\n${i + 1}. ${lines[i]}`;
      onUpdate(content, true);
    }
  }

  await sleep(420);
  if (signal?.aborted) return;

  content += `\n\n${t('hitl_intro_deepening_notice')}`;
  onUpdate(content, false);
}
