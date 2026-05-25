import { getTranslation } from './translations';

/**
 * @param {string} prev
 * @param {string[]} lines
 * @param {Set<string>} seen
 */
export function appendNewActivityLines(prev, lines, seen) {
  const added = [];
  for (const raw of lines || []) {
    const line = String(raw || '').trim();
    if (!line || seen.has(line)) continue;
    seen.add(line);
    added.push(line);
  }
  if (!added.length) return prev || '';
  const block = added.map((l) => `- ${l}`).join('\n');
  const base = String(prev || '').trim();
  return base ? `${base}\n\n${block}` : block;
}

function formatCauseLine(cause, isTr) {
  const code = cause?.code || '';
  const cat = cause?.category || cause?.category_type || '';
  const desc = cause?.description || cause?.cause_tr || cause?.cause || '';
  if (!desc) return '';
  const parts = [code, cat, desc].filter(Boolean);
  return parts.join(' — ');
}

/**
 * Pipeline tamamlandığında sohbet özeti (part3 + part4).
 * @param {object} result
 * @param {string} language
 */
export function buildPipelineResultMarkdown(result, language) {
  const isTr = String(language || '').toLowerCase().startsWith('tr');
  const part3 = result?.part3 || result?.data?.part3 || {};
  const part4 = result?.part4 || result?.data?.part4 || {};
  const imm = part3?.immediate_causes || [];
  const roots = part3?.root_causes || [];
  const actions =
    part4?.immediate_actions ||
    part4?.recommended_actions ||
    part4?.actions ||
    [];

  const sections = [];

  sections.push(
    isTr
      ? '**Analiz tamamlandı**'
      : '**Analysis completed**',
  );

  if (imm.length) {
    sections.push(
      isTr ? '**Öncelikli doğrudan nedenler**' : '**Primary immediate causes**',
    );
    imm.slice(0, 8).forEach((c) => {
      const line = formatCauseLine(c, isTr);
      if (line) sections.push(`- ${line}`);
    });
  }

  if (roots.length) {
    sections.push(isTr ? '**Kök nedenler**' : '**Root causes**');
    roots.slice(0, 8).forEach((c) => {
      const line = formatCauseLine(c, isTr);
      if (line) sections.push(`- ${line}`);
    });
  }

  const actionTexts = [];
  for (const a of actions) {
    if (typeof a === 'string') actionTexts.push(a);
    else if (a?.title) actionTexts.push(a.title);
    else if (a?.action) actionTexts.push(a.action);
    else if (a?.description) actionTexts.push(a.description);
  }
  if (actionTexts.length) {
    sections.push(isTr ? '**Önerilen aksiyonlar**' : '**Recommended actions**');
    actionTexts.slice(0, 10).forEach((t) => sections.push(`- ${t}`));
  }

  const summary = part3?.incident_summary || part3?.final_report_tr;
  if (!imm.length && !roots.length && summary) {
    const excerpt = String(summary).slice(0, 600);
    sections.push(excerpt);
  }

  return sections.filter(Boolean).join('\n\n');
}

/**
 * Tamamlanan özeti satır satır akış için parçalar.
 * @param {string} markdown
 */
export function splitMarkdownForStream(markdown) {
  return String(markdown || '')
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function pipelineKickoffLine(language) {
  return getTranslation(language, 'hitl_rca_streaming_title');
}
