/**
 * Pure split calculations using participant names (not user ids).
 * Amounts are in major currency units, rounded to 2 places where needed.
 */

const EPS = 0.009;

export function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/** @param {string} name */
function ensureName(name) {
  const n = typeof name === 'string' ? name.trim() : '';
  if (!n) throw new Error('Participant names cannot be empty');
  return n;
}

/**
 * @param {number|string} total
 * @param {string[]} participants
 * @returns {{ name: string, amount: number }[]}
 */
export function calculateEqualSplit(total, participants) {
  const names = (participants || []).map((p) => ensureName(p));
  if (!names.length) throw new Error('Add at least one participant');
  const cents = Math.round(parseFloat(total) * 100);
  if (!Number.isFinite(cents) || cents <= 0) throw new Error('Invalid amount');

  const n = names.length;
  const base = Math.floor(cents / n);
  const remainder = cents - base * n;

  return names.map((name, i) => ({
    name,
    amount: (base + (i < remainder ? 1 : 0)) / 100,
  }));
}

/**
 * @param {number|string} total
 * @param {Record<string, number|string>} nameToAmount
 * @returns {{ name: string, amount: number }[]}
 */
export function calculateExactSplit(total, nameToAmount) {
  const t = round2(total);
  if (t <= 0) throw new Error('Invalid amount');

  const entries = Object.entries(nameToAmount || {});
  if (!entries.length) throw new Error('Enter amounts for each participant');

  let sum = 0;
  const out = [];
  for (const [rawName, raw] of entries) {
    const name = ensureName(rawName);
    const a = round2(raw);
    if (a < 0) throw new Error('Amounts cannot be negative');
    out.push({ name, amount: a });
    sum = round2(sum + a);
  }
  if (Math.abs(sum - t) > EPS) {
    throw new Error(`Exact amounts must sum to ₹${t.toFixed(2)} (currently ₹${sum.toFixed(2)})`);
  }
  return out;
}

/**
 * @param {number|string} total
 * @param {Record<string, number|string>} nameToPercent
 * @returns {{ name: string, amount: number }[]}
 */
export function calculatePercentageSplit(total, nameToPercent) {
  const tCents = Math.round(parseFloat(total) * 100);
  if (!Number.isFinite(tCents) || tCents <= 0) throw new Error('Invalid amount');

  const entries = Object.entries(nameToPercent || {});
  if (!entries.length) throw new Error('Enter a percentage for each participant');

  const names = [];
  let pSum = 0;
  const percents = [];
  for (const [rawName, raw] of entries) {
    const name = ensureName(rawName);
    const p = round2(raw);
    if (p < 0) throw new Error('Percentages cannot be negative');
    names.push(name);
    percents.push(p);
    pSum = round2(pSum + p);
  }
  if (Math.abs(pSum - 100) > 0.05 + EPS) {
    throw new Error('Percentages must sum to 100%');
  }

  const rawCents = percents.map((p) => (tCents * p) / 100);
  let assigned = rawCents.map((c) => Math.floor(c));
  const used = assigned.reduce((s, c) => s + c, 0);
  let rem = tCents - used;

  const fracIdx = rawCents
    .map((c, i) => ({ i, frac: c - assigned[i] }))
    .sort((a, b) => b.frac - a.frac);

  let k = 0;
  while (rem > 0 && k < fracIdx.length) {
    assigned[fracIdx[k].i] += 1;
    rem -= 1;
    k += 1;
  }

  return names.map((name, i) => ({ name, amount: assigned[i] / 100 }));
}

/**
 * @param {number|string} total
 * @param {Record<string, number|string>} nameToShares
 * @returns {{ name: string, amount: number }[]}
 */
export function calculateShareSplit(total, nameToShares) {
  const tCents = Math.round(parseFloat(total) * 100);
  if (!Number.isFinite(tCents) || tCents <= 0) throw new Error('Invalid amount');

  const entries = Object.entries(nameToShares || {});
  if (!entries.length) throw new Error('Enter shares for each participant');

  const names = [];
  const shareVals = [];
  let shareSum = 0;
  for (const [rawName, raw] of entries) {
    const name = ensureName(rawName);
    const s = parseInt(String(raw), 10);
    if (!Number.isFinite(s) || s < 1) throw new Error('Shares must be positive whole numbers');
    names.push(name);
    shareVals.push(s);
    shareSum += s;
  }

  const rawCents = shareVals.map((s) => (tCents * s) / shareSum);
  const assigned = rawCents.map((c) => Math.floor(c));
  let used = assigned.reduce((a, b) => a + b, 0);
  let rem = tCents - used;

  const fracIdx = rawCents
    .map((c, i) => ({ i, frac: c - assigned[i] }))
    .sort((a, b) => b.frac - a.frac);

  let k = 0;
  while (rem > 0 && k < fracIdx.length) {
    assigned[fracIdx[k].i] += 1;
    rem -= 1;
    k += 1;
  }

  return names.map((name, i) => ({ name, amount: assigned[i] / 100 }));
}

/** @param {{ name: string, amount: number }[]} rows */
export function splitsRowsToMap(rows) {
  const m = {};
  for (const { name, amount } of rows) {
    m[ensureName(name)] = round2(amount);
  }
  return m;
}

/**
 * Net balance per name: payer is credited total_amount; each split row debits that person.
 * Mirrors: balances[payer] += total_amount; balances[name] -= amount_owed
 * @param {Array<{ payer_name: string, total_amount: number|string, expense_splits: Array<{ participant_name: string, amount_owed: number|string }> }>} expenses
 * @returns {Record<string, number>}
 */
export function computeBalances(expenses) {
  /** @type {Record<string, number>} */
  const balances = {};

  for (const exp of expenses || []) {
    const payer = String(exp.payer_name || '').trim();
    if (!payer) continue;

    const total = round2(exp.total_amount);
    balances[payer] = round2((balances[payer] || 0) + total);

    const splits = exp.expense_splits || [];
    for (const s of splits) {
      const name = String(s.participant_name || '').trim();
      if (!name) continue;
      const owed = round2(s.amount_owed);
      balances[name] = round2((balances[name] || 0) - owed);
    }
  }

  return balances;
}

/**
 * Greedy cash-flow minimization: repeatedly match max creditor with max debtor.
 * @param {Record<string, number> | Map<string, number>} balances
 * @returns {{ from_name: string, to_name: string, amount: number }[]}
 */
export function simplifyDebts(balances) {
  const b =
    balances instanceof Map
      ? new Map(balances)
      : new Map(Object.entries(balances || {}));
  const txs = [];

  const pickMaxCreditor = () => {
    let name = null;
    let v = 0;
    for (const [k, x] of b) {
      if (x > v + EPS) {
        v = x;
        name = k;
      }
    }
    return name ? { name, v } : null;
  };

  const pickMaxDebtor = () => {
    let name = null;
    let v = 0;
    for (const [k, x] of b) {
      if (x < v - EPS) {
        v = x;
        name = k;
      }
    }
    return name ? { name, v } : null;
  };

  for (let guard = 0; guard < 5000; guard++) {
    const c = pickMaxCreditor();
    const d = pickMaxDebtor();
    if (!c || !d || c.v < EPS || -d.v < EPS) break;

    const pay = round2(Math.min(c.v, -d.v));
    if (pay < EPS) break;

    txs.push({ from_name: d.name, to_name: c.name, amount: pay });
    b.set(c.name, round2(b.get(c.name) - pay));
    b.set(d.name, round2(b.get(d.name) + pay));
  }

  return txs;
}
