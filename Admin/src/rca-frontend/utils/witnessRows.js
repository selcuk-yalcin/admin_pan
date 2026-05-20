/** Tanık satırları — olay kronolojisi gibi ekle/sil/düzenle. */

export const createDefaultWitnesses = () => [{ name: '', roleContact: '', statement: '' }];

/**
 * Eski witnessNames / witnessStatements alanlarını satır listesine çevirir.
 * @param {object} snap
 * @returns {{ name: string, roleContact: string, statement: string }[]}
 */
export function normalizeWitnesses(snap = {}) {
  if (Array.isArray(snap.witnesses) && snap.witnesses.length > 0) {
    return snap.witnesses.map((w) => ({
      name: String(w?.name ?? '').trim(),
      roleContact: String(w?.roleContact ?? w?.role ?? '').trim(),
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
    return nameParts.map((name) => {
      const short = name.split('(')[0].trim();
      return {
        name,
        roleContact: '',
        statement: stmtByKey[name] || stmtByKey[short] || '',
      };
    });
  }

  return [{ name: '', roleContact: '', statement: statementsRaw }];
}

/**
 * @param {{ name?: string, roleContact?: string, statement?: string }[]} witnesses
 */
export function formatWitnessesBlock(witnesses) {
  const rows = (witnesses || []).filter((w) => w?.name || w?.roleContact || w?.statement);
  if (!rows.length) return '';
  return rows
    .map((w, idx) => {
      const parts = [`${idx + 1}. ${w.name || '—'}`];
      if (w.roleContact) parts.push(`(${w.roleContact})`);
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
