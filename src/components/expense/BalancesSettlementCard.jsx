import React, { useMemo, useState } from 'react';
import { round2 } from '../../utils/expenseSplitLogic';
import { deleteExpense, getReceiptSignedUrl } from '../../services/user/expenseService';
import './ExpenseModule.css';

function initials(name) {
  const p = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  if (p.length === 1 && p[0].length) return p[0].slice(0, 2).toUpperCase();
  return '?';
}

function BalancesSettlementCard({ loading, balances, simplified, expenses, displayName, refresh }) {
  /** Simplified / “who owes whom” panel (greedy min transfers) */
  const [showSimplify, setShowSimplify] = useState(true);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    setDeleting(true);
    try {
      await deleteExpense(expenseToDelete.id);
      setToastMsg({ type: 'success', text: 'Expense deleted' });
      await refresh();
    } catch (err) {
      setToastMsg({ type: 'error', text: err?.message || 'Failed to delete expense' });
    } finally {
      setDeleting(false);
      setExpenseToDelete(null);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleViewReceipt = async (path) => {
    if (!path) return;
    setLoadingReceipt(true);
    try {
      const url = await getReceiptSignedUrl(path);
      setViewingReceiptUrl(url);
    } catch (err) {
      setToastMsg({ type: 'error', text: 'Failed to load receipt' });
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setLoadingReceipt(false);
    }
  };

  const membersWithNet = useMemo(() => {
    const entries = Object.entries(balances || {}).map(([name, b]) => ({
      name,
      val: round2(b),
    }));
    entries.sort((a, b) => Math.abs(b.val) - Math.abs(a.val));
    return entries;
  }, [balances]);

  const formatMoney = (n) => `₹${round2(n).toFixed(2)}`;

  const hasExpenses = (expenses?.length || 0) > 0;

  return (
    <div className="profile-card" style={{ position: 'relative' }}>
      {toastMsg && (
        <div className={`pro-msg ${toastMsg.type}`} style={{ position: 'absolute', top: 16, right: 16, margin: 0, padding: '0.5rem 1rem', zIndex: 10 }}>
          {toastMsg.text}
        </div>
      )}
      <div className="card-header">
        <h2>Balances &amp; Settlements</h2>
        <p>Net balances from the ledger, then minimal “who owes whom” transfers.</p>
      </div>

      {loading ? (
        <div className="expense-loading-block">
          <div className="expense-loading-dots" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          Reconciling ledger data…
        </div>
      ) : (
        <>
          <div className="expense-section-label">Net by person</div>
          {!hasExpenses ? (
            <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>No expenses yet. Add one from Expense Manager.</p>
          ) : membersWithNet.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>No balance data.</p>
          ) : (
            <ul className="expense-balance-list">
              {membersWithNet.map(({ name, val }) => {
                const cls = val > 0.01 ? 'positive' : val < -0.01 ? 'negative' : '';
                const label = displayName(name);
                let line = `${label}: ${formatMoney(Math.abs(val))}`;
                if (val > 0.01) line = `${label} gets back ${formatMoney(val)}`;
                else if (val < -0.01) line = `${label} owes ${formatMoney(-val)}`;
                else line = `${label} is settled up`;
                return (
                  <li key={name} className={`expense-balance-li ${cls}`}>
                    <span className="expense-balance-avatar">{initials(name)}</span>
                    {line}
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            className="pro-btn-outline"
            onClick={() => setShowSimplify((s) => !s)}
            style={{ marginTop: '1rem' }}
          >
            {showSimplify ? 'Hide who owes whom' : 'Simplify debts'}
          </button>

          {showSimplify && (
            <>
              <div className="expense-section-label">Who owes whom</div>
              {!simplified?.length ? (
                <p style={{ color: '#6b7280', fontSize: '0.92rem' }}>
                  {hasExpenses ? 'Everyone is square — no transfers needed.' : 'Add expenses to see settlements.'}
                </p>
              ) : (
                <ul className="expense-balance-list expense-who-owes-list">
                  {simplified.map((t, i) => (
                    <li key={`${i}-${t.from_name}-${t.to_name}`} className="expense-balance-li expense-settle-li expense-who-owes-line">
                      <span className="expense-balance-avatar">{initials(t.from_name)}</span>
                      <span className="expense-who-owes-text">
                        <strong>{displayName(t.from_name)}</strong> owes <strong>{displayName(t.to_name)}</strong>{' '}
                        <strong className="expense-settle-amt">{formatMoney(t.amount)}</strong>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="expense-simplify-hint">
                Minimal transfers: match largest debtor with largest creditor until settled (cash-flow simplification).
              </p>
            </>
          )}

          <div className="expense-section-label">Expense history</div>
          <div className="expense-history-wrap">
            {!expenses?.length ? (
              <p style={{ color: '#9ca3af', fontSize: '0.92rem' }}>No entries yet.</p>
            ) : (
              <ul className="expense-history">
                {expenses.map((ex) => (
                  <li key={ex.id} className="expense-history-li">
                    <span className="expense-history-line" style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                      <span className="expense-balance-avatar">{initials(ex.payer_name)}</span>
                      <strong>{formatMoney(ex.total_amount)}</strong>
                      {' · '}
                      {ex.description?.trim() || '(no description)'}
                      {ex.receipt_url && (
                        <button
                          className="expense-view-btn"
                          onClick={() => handleViewReceipt(ex.receipt_url)}
                          disabled={loadingReceipt}
                          aria-label="View receipt"
                          title="View receipt"
                        >
                          {loadingReceipt ? '...' : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                          )}
                        </button>
                      )}
                      <button
                        className="expense-delete-btn"
                        onClick={() => setExpenseToDelete(ex)}
                        aria-label="Delete expense"
                        title="Delete expense"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                      </button>
                    </span>
                    <br />
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      Paid by {displayName(ex.payer_name)} · {ex.split_type} · {ex.created_at ? new Date(ex.created_at).toLocaleString() : ''}
                      {ex.receipt_url ? ' · receipt on file' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {expenseToDelete && (
        <div className="expense-modal-overlay">
          <div className="expense-modal-card">
            <h3>Delete Expense</h3>
            <p>
              Are you sure you want to delete this expense? <br />
              <strong>{formatMoney(expenseToDelete.total_amount)}</strong> for <em>{expenseToDelete.description?.trim() || 'an item'}</em>.
            </p>
            <div className="expense-modal-actions">
              <button type="button" className="pro-btn-cancel" onClick={() => setExpenseToDelete(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="pro-btn-danger" onClick={confirmDeleteExpense} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingReceiptUrl && (
        <div className="expense-modal-overlay" onClick={() => setViewingReceiptUrl(null)}>
          <div className="expense-modal-card receipt-view-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Expense Receipt</h3>
              <button type="button" className="expense-close-btn" onClick={() => setViewingReceiptUrl(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="receipt-view-content" style={{ display: 'flex', justifyContent: 'center' }}>
              {viewingReceiptUrl.toLowerCase().includes('.pdf') ? (
                <iframe src={viewingReceiptUrl} title="Receipt PDF" width="100%" height="600px" style={{ border: 'none', borderRadius: '8px' }} />
              ) : (
                <img src={viewingReceiptUrl} alt="Expense Receipt" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px', objectFit: 'contain' }} />
              )}
            </div>
            <div className="expense-modal-actions">
              <button type="button" className="pro-btn-cancel" onClick={() => setViewingReceiptUrl(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BalancesSettlementCard;
