import { getTranslation } from './translations';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * HITL giriş mesajı — numaralı doğrudan neden listesi göstermez.
 * Nedenler olay metninden arka planda eşleştirilir; kullanıcıya jenerik liste yansıtılmaz.
 * @param {object} opts
 * @param {string} opts.language
 * @param {(content: string, isStreaming: boolean) => void} opts.onUpdate
 * @param {AbortSignal} [opts.signal]
 */
export async function streamHitlIntro({ language, onUpdate, signal }) {
  const t = (key) => getTranslation(language, key);

  let content = `**${t('hitl_intro_start')}**`;
  onUpdate(content, true);
  await sleep(500);
  if (signal?.aborted) return;

  content += `\n\n${t('hitl_intro_deepening_notice')}`;
  onUpdate(content, false);
}
