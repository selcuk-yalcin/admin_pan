/**
 * Form verisinden olay metni ve investigate API payload üretir (RcaFrontendHub ile uyumlu).
 */

const EVIDENCE_TEXT_MAX = 12000;

function truncateEvidenceText(text) {
  const s = String(text || "");
  if (s.length <= EVIDENCE_TEXT_MAX) return s;
  return `${s.slice(0, EVIDENCE_TEXT_MAX)}\n… [${s.length - EVIDENCE_TEXT_MAX} karakter daha]`;
}

/** @param {object[]} attachments @param {string} lang */
function buildEvidenceAttachmentBlock(attachments, lang) {
  const list = Array.isArray(attachments) ? attachments.filter((a) => a && a.name) : [];
  if (!list.length) return "";

  const isTr = String(lang || "").toLowerCase().startsWith("tr");
  const title = isTr ? "Ek kanıt dosyaları (form yüklemesi)" : "Attached evidence files (form upload)";
  const imageNote = isTr
    ? "(Görüntü — içerik bu sürümde yalnızca dosya bilgisi olarak iletiliyor.)"
    : "(Image — only file metadata is included in this version.)";
  const pdfNote = isTr
    ? "(PDF — metin çıkarımı bu sürümde eklenmedi.)"
    : "(PDF — text extraction not included in this version.)";

  const lines = [title + ":"];
  for (const a of list) {
    const mime = a.mimeType || "unknown";
    const size = typeof a.size === "number" ? `${Math.round(a.size / 1024)} KB` : "";
    lines.push(`- ${a.name} (${mime}${size ? `, ${size}` : ""})`);
    if (a.textExcerpt && String(a.textExcerpt).trim()) {
      const label = isTr ? "Dosya metni özü" : "File text excerpt";
      lines.push(`  ${label}:\n${truncateEvidenceText(a.textExcerpt)}`);
    } else if (mime.startsWith("image/")) {
      lines.push(`  ${imageNote}`);
    } else if (mime === "application/pdf") {
      lines.push(`  ${pdfNote}`);
    }
  }
  return lines.join("\n");
}

/**
 * @param {object} formData
 * @param {string} [outputLanguage] UI / rapor dili (tr, en, …)
 */
export function buildHowHappenedText(formData, outputLanguage = "tr") {
  const timelineRows = (formData.timeline || [])
    .filter((row) => row?.time || row?.event)
    .map((row) => `- ${row.time || "??:??"}: ${row.event || ""}`)
    .join("\n");

  const parts = [
    formData.incidentDescription || "",
    formData.emergencyMeasures ? `Acil Onlemler: ${formData.emergencyMeasures}` : "",
    timelineRows ? `Olay Kronolojisi:\n${timelineRows}` : "",
    formData.additionalNotes ? `Ek Notlar: ${formData.additionalNotes}` : "",
  ];

  const evidenceBlock = buildEvidenceAttachmentBlock(formData.evidenceAttachments, outputLanguage);
  if (evidenceBlock) parts.push(evidenceBlock);

  return parts.filter(Boolean).join("\n\n");
}

/** Kök neden (ilk değerlendirme) alanını satır listesine çevirir. */
export function parseInitialImmediateCauses(text) {
  if (!text || !String(text).trim()) return [];
  return String(text)
    .split(/\n+/)
    .map((s) => s.replace(/^\s*\d+[\.)]\s*/, "").trim())
    .filter(Boolean);
}

/**
 * @param {object} formData
 * @param {string} [hitlAppendix] - HITL soru-cevap özeti (how_happened sonuna eklenir)
 * @param {string} [outputLanguage] - rapor/analiz hedef dili (tr, en, de, fr, es, ar)
 */
export function buildInvestigationPayload(formData, hitlAppendix = "", outputLanguage = "") {
  const lang = String(outputLanguage || "tr").trim() || "tr";
  let description = buildHowHappenedText(formData, lang);
  if (formData.rootCauseInitial) {
    description += `\n\nKök Neden (İlk Değerlendirme):\n${formData.rootCauseInitial}`;
  }
  if (formData.correctiveActions) {
    description += `\n\nDüzeltici Aksiyonlar (Ön):\n${formData.correctiveActions}`;
  }
  if (hitlAppendix) {
    description += `\n\n--- HITL (Etkileşimli kontrol soruları) ---\n${hitlAppendix}`;
  }

  return {
    location: `${formData.location || ""} ${formData.department ? `| ${formData.department}` : ""}`.trim(),
    who_involved: [formData.reportedBy, formData.witnessNames].filter(Boolean).join(" | "),
    how_happened: description,
    activities: [formData.workType, formData.workDuration, formData.shiftTime].filter(Boolean).join(" | "),
    working_conditions: [
      formData.weatherConditions,
      formData.lightingConditions,
      formData.noiseLevel,
      formData.temperature,
    ]
      .filter(Boolean)
      .join(" | "),
    safety_procedures: [
      `FallProtection=${formData.fallProtection || "unknown"}`,
      `Harness=${formData.safetyHarness || "unknown"}`,
      `Training=${formData.safetyTraining || "unknown"}`,
      formData.ppeUsed ? `PPE=${formData.ppeUsed}` : "",
    ]
      .filter(Boolean)
      .join(" | "),
    injuries: [
      formData.injuryType,
      formData.injurySeverity,
      formData.bodyPart,
      formData.medicalTreatment,
      formData.propertyDamage,
    ]
      .filter(Boolean)
      .join(" | "),
    output_language: String(outputLanguage || "").trim(),
  };
}
