/**
 * HITL soru cevabı: Evet/Hayır, serbest metin, veya çoklu/seçenek (chip) listesi.
 * Backend: response_mode, choice_options, choice_options_en, choice_multi
 */

const PPE_TR_MARKERS = /(\bkkd\b|kisisel\s+koruyucu|kişisel\s+koruyucu|ppe|baret|eldiven|ayakkab|gözlük|göz|isitme|dusm|düşm|kemer|emniyet|can\s+halat)/i;

/** Sunucu `choice_options` dönmezse (önbellek) aynı deneyim için yedek KKD listesi */
const FALLBACK_PPE_TR = [
  'Baret',
  'Gözlük / yüz kalkanı',
  'İşitme koruyucu',
  'Solunum (maske / FFP)',
  'Eldiven',
  'Koruyucu elbise / önlük',
  'Güvenlik ayakkabısı / çizme',
  'Düşmeye karşı kemer / lanyard',
  'Yüksek görünürlüklü yelek',
  'Diğer (açık yazın)',
];
const FALLBACK_PPE_EN = [
  'Helmet',
  'Goggles / face shield',
  'Hearing protection',
  'Respirator / FFP mask',
  'Gloves',
  'Coveralls / apron',
  'Safety shoes / boots',
  'Fall harness / lanyard',
  'High-vis vest',
  'Other (specify below)',
];

/**
 * @param {object} q
 * @returns {boolean} chip listesi (tek veya çoklu seçim)
 */
export function hitlQuestionNeedsChoice(q) {
  if (!q) return false;
  const m = String(q.response_mode || '').toLowerCase();
  if (m === 'choice' || m === 'options' || m === 'multi_choice') {
    return Array.isArray(q.choice_options) && q.choice_options.length >= 2;
  }
  const t = String(
    q.question_en || q.question_tr || q.soru || q.question || '',
  );
  if (/\bhangi\b/i.test(t) && PPE_TR_MARKERS.test(t)) {
    return true;
  }
  return false;
}

/**
 * @param {object} q
 * @param {string} language
 * @returns {string[]}
 */
export function getHitlChoiceOptionLabels(q, language) {
  if (!q) return [];
  const trUi = String(language || 'tr').toLowerCase().startsWith('tr');
  let tr = Array.isArray(q.choice_options) ? q.choice_options : [];
  const en = Array.isArray(q.choice_options_en) ? q.choice_options_en : [];
  if (tr.length < 2) {
    const t = String(
      q.question_en || q.question_tr || q.soru || q.question || '',
    );
    if (/\b(hangi|which)\b/i.test(t) && PPE_TR_MARKERS.test(t)) {
      tr = trUi ? FALLBACK_PPE_TR : FALLBACK_PPE_EN;
    }
  }
  if (tr.length && en.length === tr.length && !trUi) {
    return en;
  }
  return tr;
}

/**
 * @param {object} q
 */
export function isHitlChoiceMulti(q) {
  if (!q) return false;
  if (typeof q.choice_multi === 'boolean') return q.choice_multi;
  const t = String(q.soru || q.question_tr || q.question || '').toLowerCase();
  return /kkd[''´` ]?ler|korumal|neler|hangileri|gerekli(ydi|ydı)?|ler\b|lar\b/.test(t);
}

/**
 * @param {object} q
 * @returns {boolean} serbest metin (textarea)
 */
export function hitlQuestionNeedsFreeText(q) {
  if (!q) return false;
  if (hitlQuestionNeedsChoice(q)) return false;
  const m = String(q.response_mode || '').toLowerCase();
  if (m === 'free_text' || m === 'freetext' || m === 'text') return true;
  if (m === 'choice' || m === 'options' || m === 'multi_choice') return false;
  const text = q.soru || q.question_tr || q.question_en || q.question || '';
  return inferFreeTextHeuristic(text);
}

/**
 * Evet/Hayır/Bilinmiyor/Soruyu Geç — her HITL sorusunda (chip listesi olsa da).
 * @param {object} q
 */
export function hitlQuestionShowsYesNo(q) {
  return !!q;
}

/**
 * Soru metninden serbest metin gerekip gerekmediğini çıkarır (backend ile uyumlu).
 * @param {string} t
 */
export function inferFreeTextHeuristic(t) {
  if (!t || t.length < 8) return false;
  const low = t.toLowerCase();

  if (
    /\b(kaç|kac|ne\s+kadar|ne\s+zaman|hangi\s+tarih|kim(dir|in|i)?|nerede|nereden|nereye)\b/i.test(
      low,
    )
  ) {
    return true;
  }
  if (/\bkaç\s*(yıl|ay|gün|saat|dakika|metre|kg|ton|adet)\b/i.test(low)) return true;
  if (/\b(yıllık|aylık)\s+deneyim\b/i.test(low)) return true;
  if (/\bkaç\s+yıllık\b/i.test(low)) return true;
  if (/\bdeneyim\S*\s+(var|yok)\b/i.test(low) && /\bkaç\b/i.test(low)) return true;
  if (/\b(miktar|sayı|adet|süre|mesafe|yükseklik|derinlik|genişlik)\b/i.test(low)) return true;
  if (/\b(listele|belirt|açıkla|acikla|detaylandır|tanımla|tarif\s+et|yazın|yazin)\b/i.test(low)) {
    return true;
  }

  const tr = t.match(/\b(mı|mi|mu|mü)\b/gi) || [];
  if (tr.length >= 2) return true;
  if (t.includes('—') && tr.length >= 1) {
    if (t.includes(',') || tr.length > 2) return true;
  }
  // Probe kalıpları — typical_problem içinde "veya" olsa da Evet/Hayır kalır
  if (/geçerli\s+miydi|geçerli\s+mi\b|geçerli\s+ydi|aşağıda\s+belirtilen/i.test(low)) {
    return false;
  }
  if ((low.includes(' veya ') || /\b(or|versus)\b/i.test(t)) && t.includes('?') && t.length > 35) {
    return true;
  }
  if (/\byoksa\b/i.test(t) && t.includes('?') && t.length > 20) return true;
  if (
    /(hangi|açıkla|açikla|detay|açıkça|acikca)/i.test(t) &&
    t.includes('?') &&
    !PPE_TR_MARKERS.test(t)
  ) {
    return true;
  }
  return false;
}

/**
 * Enter ile gönderim için textarea key handler.
 * @param {React.KeyboardEvent} e
 * @param {() => void} submit
 */
export function handleHitlTextareaEnter(e, submit) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submit();
  }
}
