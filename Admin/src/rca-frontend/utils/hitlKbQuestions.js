/**
 * HITL cevaplarını investigate payload metnine dönüştürür.
 * Soru metinleri artık backend'den gelir (hitl_questions API).
 */

export function getHitlQuestionLabel(q, language) {
  if (!q) return "";
  const tr = (language || "tr").toLowerCase().startsWith("tr");
  if (tr) {
    return q.question_tr || q.soru || q.question || "";
  }
  return q.question_en || q.question_tr || q.soru || q.question || "";
}

/** Cevaplari metin blok olarak birlestirir (investigate how_happened eki). */
export function formatHitlAnswersBlock(answers) {
  return answers
    .map((a) => `[${a.hsgHint || a.hsg_hint || ""}] ${a.question}\nCevap: ${a.label}`)
    .join("\n\n");
}
