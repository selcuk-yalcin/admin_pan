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

/** Sohbet geçmişinde şablon soru + farklı probe_context ayırt edilsin. */
export function formatHitlAnswerChatLine(q, language, answerLabel) {
  if (!q) return String(answerLabel || "");
  const isTr = String(language || "tr").toLowerCase().startsWith("tr");
  const qLabel = getHitlQuestionLabel(q, language);
  const ctx = String(q.probe_context || "").trim();
  const code = String(q.code || q.hsg_hint || "").trim();
  const category = String(
    q.cause_desc || q.category_title || q.standard_title_tr || "",
  ).trim();
  const lines = [];
  if (code || category) {
    lines.push([code, category].filter(Boolean).join(" — "));
  }
  if (ctx) {
    const cond = isTr ? "İncelenen koşul" : "Condition";
    const clipped = ctx.length > 200 ? `${ctx.slice(0, 197)}…` : ctx;
    lines.push(`${cond}: ${clipped}`);
  }
  lines.push(qLabel);
  lines.push(`→ ${answerLabel || ""}`);
  return lines.join("\n");
}

/** Cevaplari metin blok olarak birlestirir (investigate how_happened eki). */
export function formatHitlAnswersBlock(answers) {
  return answers
    .map((a) => `[${a.hsgHint || a.hsg_hint || ""}] ${a.question}\nCevap: ${a.label}`)
    .join("\n\n");
}
