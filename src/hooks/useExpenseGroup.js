import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildSuggestedNames,
  ensureExpenseGroup,
  fetchExpensesWithSplits,
  fetchParticipants,
} from '../services/user/expenseService';
import { computeBalances, simplifyDebts } from '../utils/expenseSplitLogic';

/**
 * Ledger for the signed-in user: name-based participants and expenses.
 * @param {import('@supabase/supabase-js').User | null} user
 */
export function useExpenseGroup(user) {
  const [groupId, setGroupId] = useState(null);
  const [participantRows, setParticipantRows] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setError(null);
    try {
      const gid = await ensureExpenseGroup(user.id);
      setGroupId(gid);
      const [parts, ex] = await Promise.all([
        fetchParticipants(gid),
        fetchExpensesWithSplits(gid),
      ]);
      setParticipantRows(parts);
      setExpenses(ex);
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Failed to load expense data');
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setGroupId(null);
      setParticipantRows([]);
      setExpenses([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const gid = await ensureExpenseGroup(user.id);
        if (cancelled) return;
        setGroupId(gid);
        const [parts, ex] = await Promise.all([
          fetchParticipants(gid),
          fetchExpensesWithSplits(gid),
        ]);
        if (cancelled) return;
        setParticipantRows(parts);
        setExpenses(ex);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e?.message || 'Failed to load expense data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const suggestedNames = useMemo(
    () => buildSuggestedNames(participantRows, expenses),
    [participantRows, expenses]
  );

  const balances = useMemo(() => computeBalances(expenses), [expenses]);

  const simplified = useMemo(() => simplifyDebts(balances), [balances]);

  const displayName = useCallback((name) => String(name || '').trim() || '—', []);

  return {
    groupId,
    participantRows,
    expenses,
    balances,
    simplified,
    suggestedNames,
    loading,
    error,
    refresh,
    displayName,
  };
}
