/**
 * HITL soru cevabı: Evet/Hayır/Bilinmiyor mu yoksa açık uçlu metin mi?
 * Backend `response_mode` yoksa veya eski cache için sezgisel yedek.
 */
export function hitlQuestionNeedsFreeText(q) {
  if (!q) return false;
  const m = String(q.response_mode || '').toLowerCase();
  if (m === 'free_text' || m === 'freetext') return true;
  if (m === 'yes_no_unknown') return false;
  return inferFreeTextHeuristic(
    q.soru || q.question_tr || q.question_en || q.question || '',
  );
}

function inferFreeTextHeuristic(t) {
  if (!t || t.length < 8) return false;
  const tr = t.match(/\b(mı|mi|mu|mü)\b/gi) || [];
  if (tr.length >= 2) return true;
  if (t.includes('—') && (t.match(/\b(mı|mi|mu|mü)\b/gi) || []).length >= 1) {
    if (t.includes(',') || t.split(/\b(mı|mi|mu|mü)\b/gi).length > 2) return true;
  }
  const low = t.toLowerCase();
  if ((low.includes(' veya ') || /\b(or|versus)\b/i.test(t)) && t.includes('?') && t.length > 35) {
    return true;
  }
  if (/\byoksa\b/i.test(t) && t.includes('?') && t.length > 20) return true;
  if (/(hangi|açıkla|açikla|detay|açıkça|acikca)/i.test(t) && t.includes('?')) {
    return true;
  }
  return false;
}
