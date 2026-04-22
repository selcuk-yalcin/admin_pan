/**
 * HITL kontrol soruları — hitl_test/question_engine.py ve gradio_chat_5why_v2.py
 * disambiguation temalarıyla uyumlu, tiklamali Evet/Hayır/Bilinmiyor akisi.
 *
 * Sorular HSG245 / knowledge_base kategorileriyle eslestirilir (risk, PTW, prosedür, gözetim, eğitim, öğrenme).
 */

const QUESTIONS = [
  {
    id: "risk_done",
    hsgHint: "D4.1 / D5.3 — Risk değerlendirmesi",
    tr: "Bu iş için risk değerlendirmesi yapılmış mıydı?",
    en: "Was a risk assessment performed for this job?",
  },
  {
    id: "risk_applied",
    hsgHint: "D4.2 — Kontrollerin uygulanması",
    tr: "Risk değerlendirmesi sonuçları sahada güncel ve uygulanıyor muydu?",
    en: "Were risk assessment findings current and applied in the field?",
  },
  {
    id: "ptw",
    hsgHint: "D4.4 — İş izni / PTW",
    tr: "Bu çalışma için yazılı iş izni (PTW) alındı mı ve izin koşulları sahada kontrol edildi mi?",
    en: "Was a written permit (PTW) obtained and were permit conditions verified on site?",
  },
  {
    id: "procedure",
    hsgHint: "D4.1 / A1.1 — Prosedür",
    tr: "İlgili güvenlik prosedürü / iş talimatı mevcut, erişilebilir ve sahaya uygun muydu?",
    en: "Was the relevant safety procedure accessible and field-appropriate?",
  },
  {
    id: "supervision",
    hsgHint: "D1.1 / D1.2 — Gözetim",
    tr: "Bu iş için yeterli gözetim ve denetim yapılıyor muydu?",
    en: "Was supervision and monitoring adequate for this task?",
  },
  {
    id: "training",
    hsgHint: "D3.1 / D3.2 — Eğitim",
    tr: "Çalışan(lar) bu tip iş için eğitimli ve görev için yeterli yetkinlikte miydi?",
    en: "Were workers trained and competent for this type of work?",
  },
  {
    id: "ppe",
    hsgHint: "A3.x — KKD",
    tr: "Gerekli kişisel koruyucu donanım (KKD) sağlandı ve kullanımı gözetildi mi?",
    en: "Was required PPE provided and its use monitored?",
  },
  {
    id: "learning",
    hsgHint: "D1.5 / D2.x — Öğrenme ve iletişim",
    tr: "Benzer durumlar / near-miss kayıtları paylaşılıyor ve önlem alınıyor muydu?",
    en: "Were similar conditions and near-misses communicated and acted upon?",
  },
];

export function getHitlQuestionSequence() {
  return QUESTIONS;
}

export function getQuestionLabel(q, language) {
  const tr = (language || "tr").toLowerCase().startsWith("tr");
  return tr ? q.tr : q.en;
}

/** Cevaplari metin blok olarak birlestirir (investigate how_happened eki). */
export function formatHitlAnswersBlock(answers) {
  return answers
    .map((a) => `[${a.hsgHint}] ${a.question}\nCevap: ${a.label}`)
    .join("\n\n");
}
