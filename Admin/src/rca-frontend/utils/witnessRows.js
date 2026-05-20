/** Tanık satırları — olay kronolojisi gibi ekle/sil/düzenle. */

import {
  TEMPLATE_WITNESS_NAMES,
  templateWitnessNameForIndex,
} from '../constants/formDefaults';

export { templateWitnessNameForIndex };

export const createDefaultWitnesses = () => [
  { name: TEMPLATE_WITNESS_NAMES[0], role: '', statement: '' },
];

/**
 * Eski witnessNames / witnessStatements alanlarını satır listesine çevirir.
 * @param {object} snap
 * @returns {{ name: string, role: string, statement: string }[]}
 */
export function normalizeWitnesses(snap = {}) {
  if (Array.isArray(snap.witnesses) && snap.witnesses.length > 0) {
    return snap.witnesses.map((w) => ({
      name: String(w?.name ?? '').trim(),
      role: String(w?.role ?? w?.roleContact ?? '').trim(),
      statement: String(w?.statement ?? '').trim(),
    }));
  }

  const namesRaw = String(snap.witnessNames ?? '').trim();
  const statementsRaw = String(snap.witnessStatements ?? '').trim();
  if (!namesRaw && !statementsRaw) {
    return createDefaultWitnesses();
  }

  const stmtByKey = {};
  for (const line of statementsRaw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const key = match[1].trim();
      stmtByKey[key] = match[2].trim().replace(/^["']|["']$/g, '');
      const shortKey = key.split('(')[0].trim();
      if (shortKey && shortKey !== key) {
        stmtByKey[shortKey] = stmtByKey[key];
      }
    }
  }

  const nameParts = namesRaw
    ? namesRaw.split(/,(?=\s*[^,]+)/).map((s) => s.trim()).filter(Boolean)
    : [];

  if (nameParts.length) {
    return nameParts.map((name, idx) => {
      const short = name.split('(')[0].trim();
      const roleFromParen = name.includes('(')
        ? name.replace(/^.*\(([^)]+)\).*$/, '$1').trim()
        : '';
      return {
        name: name.split('(')[0].trim() || name,
        role: roleFromParen,
        statement: stmtByKey[name] || stmtByKey[short] || '',
      };
    });
  }

  return [{ name: '', role: '', statement: statementsRaw }];
}

/**
 * @param {{ name?: string, role?: string, statement?: string }[]} witnesses
 */
export function formatWitnessesBlock(witnesses) {
  const rows = (witnesses || []).filter((w) => w?.name || w?.role || w?.statement);
  if (!rows.length) return '';
  return rows
    .map((w, idx) => {
      const parts = [`${idx + 1}. ${w.name || '—'}`];
      if (w.role) parts.push(`(${w.role})`);
      if (w.statement) parts.push(`— ${w.statement}`);
      return parts.join(' ');
    })
    .join('\n');
}

export function witnessNamesJoined(witnesses) {
  return (witnesses || [])
    .map((w) => w?.name)
    .filter(Boolean)
    .join(' | ');
}

export function createWitnessRow(index) {
  return {
    name: templateWitnessNameForIndex(index),
    role: '',
    statement: '',
  };
}
