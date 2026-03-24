import { supabase } from '../../config/supabase';

/**
 * @param {string} name
 */
export function normalizeParticipantName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Ensure the signed-in user has a ledger group (owner_user_id = auth uid; no FK to auth.users).
 * @param {string | null | undefined} userId — Supabase auth user id for RLS scope only
 * @returns {Promise<string>} group id
 */
export async function ensureExpenseGroup(userId) {
  if (!userId) throw new Error('Sign in to use the expense ledger');

  const { data: row, error: qErr } = await supabase
    .from('groups')
    .select('id')
    .eq('owner_user_id', userId)
    .limit(1)
    .maybeSingle();

  if (qErr) throw qErr;
  if (row?.id) return row.id;

  const { data: group, error: gErr } = await supabase
    .from('groups')
    .insert({ name: 'My split ledger', owner_user_id: userId })
    .select('id')
    .single();

  if (gErr) throw gErr;
  return group.id;
}

/**
 * @param {string} groupId
 * @returns {Promise<Array<{ id: string, name: string }>>}
 */
export async function fetchParticipants(groupId) {
  const { data, error } = await supabase
    .from('participants')
    .select('id, name')
    .eq('group_id', groupId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Persists a display name for the group; unique per group (case-insensitive).
 * @param {string} groupId
 * @param {string} rawName
 */
export async function addParticipant(groupId, rawName) {
  const name = normalizeParticipantName(rawName);
  if (!name) throw new Error('Name cannot be empty');

  const { error } = await supabase.from('participants').insert({ group_id: groupId, name });
  if (error) {
    if (error.code === '23505') throw new Error(`"${name}" is already in this group`);
    throw error;
  }
}

/**
 * @param {string} groupId
 * @param {string} rawName
 */
export async function removeParticipantByName(groupId, rawName) {
  const key = normalizeParticipantName(rawName).toLowerCase();
  if (!key) return;

  const { data: rows, error: qErr } = await supabase
    .from('participants')
    .select('id, name')
    .eq('group_id', groupId);

  if (qErr) throw qErr;
  const row = (rows || []).find((r) => normalizeParticipantName(r.name).toLowerCase() === key);
  if (!row) return;

  const { error } = await supabase.from('participants').delete().eq('id', row.id);
  if (error) throw error;
}

/**
 * Distinct names for autosuggest (from saved participants + expense history).
 * @param {Array<{ name: string }>} participantRows
 * @param {Array<object>} expenses
 */
export function buildSuggestedNames(participantRows, expenses) {
  const set = new Set();
  for (const p of participantRows || []) {
    const n = normalizeParticipantName(p.name);
    if (n) set.add(n);
  }
  for (const ex of expenses || []) {
    const pn = normalizeParticipantName(ex.payer_name);
    if (pn) set.add(pn);
    for (const sp of ex.expense_splits || []) {
      const n = normalizeParticipantName(sp.participant_name);
      if (n) set.add(n);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * @param {string} groupId
 */
export async function fetchExpensesWithSplits(groupId) {
  const { data, error } = await supabase
    .from('expenses')
    .select(
      `
      id,
      group_id,
      payer_name,
      total_amount,
      description,
      split_type,
      receipt_url,
      created_at,
      expense_splits (
        id,
        expense_id,
        participant_name,
        amount_owed
      )
    `
    )
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * @param {File | null} file
 * @param {string} userId
 * @param {string} groupId
 * @returns {Promise<string|null>} public URL or storage path stored in receipt_url
 */
export async function uploadExpenseReceipt(file, userId, groupId) {
  if (!file) return null;
  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
  const path = `${userId}/${groupId}/${crypto.randomUUID()}${ext}`;

  const { error } = await supabase.storage.from('expense-receipts').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  // Private bucket: store object path; use createSignedUrl when displaying.
  return path;
}

/**
 * Frontend → Supabase: insert expense row, then batch-insert splits (same pattern as docs).
 * @param {{
 *   groupId: string,
 *   payerName: string,
 *   totalAmount: number,
 *   description: string,
 *   splitType: string,
 *   splits: { name: string, amount: number }[],
 *   receiptUrl: string | null,
 * }} params
 */
export async function createExpenseRecord(params) {
  const { groupId, payerName, totalAmount, description, splitType, splits, receiptUrl } =
    params;

  // 1) Insert expense
  const { data: expense, error: eErr } = await supabase
    .from('expenses')
    .insert({
      group_id: groupId,
      payer_name: normalizeParticipantName(payerName),
      total_amount: totalAmount,
      split_type: splitType,
      description: description || null,
      receipt_url: receiptUrl,
    })
    .select()
    .single();

  if (eErr) throw eErr;

  // 2) Insert splits (linked to expense.id)
  const splitRows = splits.map((s) => ({
    expense_id: expense.id,
    participant_name: normalizeParticipantName(s.name),
    amount_owed: s.amount,
  }));

  const { error: sErr } = await supabase.from('expense_splits').insert(splitRows);
  if (sErr) throw sErr;

  return expense.id;
}

/**
 * @param {string} expenseId
 */
export async function deleteExpense(expenseId) {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) throw error;
}

/**
 * @param {string} groupId 
 * @param {string} rawName
 * @returns {Promise<boolean>}
 */
export async function checkParticipantHasExpenses(groupId, rawName) {
  const name = normalizeParticipantName(rawName);
  const { data: splits, error: sErr } = await supabase
    .from('expense_splits')
    .select('id')
    .eq('participant_name', name)
    .limit(1);
  if (sErr) throw sErr;
  if (splits && splits.length > 0) return true;

  const { data: ex, error: eErr } = await supabase
    .from('expenses')
    .select('id')
    .eq('group_id', groupId)
    .eq('payer_name', name)
    .limit(1);
  if (eErr) throw eErr;

  return (ex && ex.length > 0);
}

/**
 * @param {string} groupId 
 * @param {string} rawName
 */
export async function deleteParticipantCascade(groupId, rawName) {
  const name = normalizeParticipantName(rawName);

  // delete splits first
  await supabase.from('expense_splits').delete().eq('participant_name', name);

  // delete expenses where payer
  await supabase.from('expenses').delete().eq('group_id', groupId).eq('payer_name', name);

  // delete participant
  await removeParticipantByName(groupId, rawName);
}
