/** HSG245 / olay kimligi gibi teknik kodlari kullaniciya gostermeden metin uretir. */

const HSG_CODE_RE = /\b[ABCD]\d+(?:\.\d+)?\b/gi;
const INC_ID_RE = /\bINC-\d{8}-\d{6}\b/gi;

export function stripTechnicalCodes(text) {
  let out = String(text || '');
  out = out.replace(HSG_CODE_RE, '');
  out = out.replace(INC_ID_RE, '');
  out = out.replace(/\b(?:Incident\s*ID|Olay\s*ID)\s*:\s*/gi, '');
  out = out.replace(/\([^)]*\b[ABCD]\d+[^)]*\)/gi, '');
  out = out.replace(/\b(?:Dal|Branch)\s+\d+\s*\/\s*\d+\s*[-•·]\s*Why-\d+\s*[-•·]\s*/gi, '');
  out = out.replace(/\bWhy-\d+\s*\([^)]*\)\s*/gi, '');
  out = out.replace(/\s*—\s*—\s*/g, ' — ');
  out = out.replace(/^\s*[-•]\s*/gm, '');
  out = out.replace(/\n{3,}/g, '\n\n');
  out = out.replace(/[ \t]{2,}/g, ' ');
  return out.trim();
}

export function stripTechnicalCodesMarkdown(text) {
  return stripTechnicalCodes(text);
}
