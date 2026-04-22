/**
 * Form verisinden olay metni ve investigate API payload üretir (RcaFrontendHub ile uyumlu).
 */

export function buildHowHappenedText(formData) {
  const timelineRows = (formData.timeline || [])
    .filter((row) => row?.time || row?.event)
    .map((row) => `- ${row.time || "??:??"}: ${row.event || ""}`)
    .join("\n");

  return [
    formData.incidentDescription || "",
    formData.emergencyMeasures ? `Acil Onlemler: ${formData.emergencyMeasures}` : "",
    timelineRows ? `Olay Kronolojisi:\n${timelineRows}` : "",
    formData.additionalNotes ? `Ek Notlar: ${formData.additionalNotes}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
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
 */
export function buildInvestigationPayload(formData, hitlAppendix = "") {
  let description = buildHowHappenedText(formData);
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
  };
}
