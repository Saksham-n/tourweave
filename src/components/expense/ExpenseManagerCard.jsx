import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateShareSplit,
  round2,
} from '../../utils/expenseSplitLogic';
import {
  addParticipant,
  checkParticipantHasExpenses,
  createExpenseRecord,
  deleteParticipantCascade,
  normalizeParticipantName,
  removeParticipantByName,
  uploadExpenseReceipt,
} from '../../services/user/expenseService';
import './ExpenseModule.css';

const SPLIT_TYPES = [
  { value: 'equal', label: 'Equal' },
  { value: 'exact', label: 'Exact amounts' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'shares', label: 'Shares' },
];

function initials(name) {
  const p = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  if (p.length === 1 && p[0].length) return p[0].slice(0, 2).toUpperCase();
  return '?';
}

function ExpenseManagerCard({ user, groupId, participantRows, suggestedNames, refresh }) {
  const names = useMemo(() => (participantRows || []).map((p) => p.name), [participantRows]);
  const namesKey = useMemo(() => JSON.stringify(names), [names]);

  const [nameInput, setNameInput] = useState('');
  const [payerName, setPayerName] = useState('');
  const [splitIncluded, setSplitIncluded] = useState(() => new Set());
  const [splitType, setSplitType] = useState('equal');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [splitInputs, setSplitInputs] = useState({});
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [addingName, setAddingName] = useState(false);
  
  const [participantToRemove, setParticipantToRemove] = useState(null);
  const [removeConfirmType, setRemoveConfirmType] = useState(null);
  const [checkingRemove, setCheckingRemove] = useState(false);
  const [deletingParticipant, setDeletingParticipant] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const fileRef = useRef(null);

  useEffect(() => {
    const list = namesKey ? JSON.parse(namesKey) : [];
    setSplitIncluded((prev) => {
      const next = new Set();
      for (const n of list) {
        if (prev.has(n)) next.add(n);
      }
      if (next.size === 0 && list.length) list.forEach((n) => next.add(n));
      return next;
    });
  }, [namesKey]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.pro-custom-select')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    const list = namesKey ? JSON.parse(namesKey) : [];
    if (!list.length) {
      setPayerName('');
      return;
    }
    setPayerName((prev) => (prev && list.includes(prev) ? prev : list[0]));
  }, [namesKey]);

  const selectedForSplit = useMemo(
    () => names.filter((n) => splitIncluded.has(n)),
    [names, splitIncluded]
  );

  const toggleSplitName = (n) => {
    setSplitIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const updateSplitField = (n, val) => {
    setSplitInputs((s) => ({ ...s, [n]: val }));
  };

  const tryAddName = async () => {
    const n = normalizeParticipantName(nameInput);
    setMsg(null);
    if (!n) {
      setMsg({ type: 'error', text: 'Enter a non-empty name.' });
      return;
    }
    if (!groupId) return;
    const exists = names.some((x) => x.toLowerCase() === n.toLowerCase());
    if (exists) {
      setMsg({ type: 'error', text: `"${n}" is already in this group.` });
      setNameInput('');
      return;
    }
    setAddingName(true);
    try {
      await addParticipant(groupId, n);
      setNameInput('');
      await refresh();
    } catch (err) {
      setMsg({ type: 'error', text: err?.message || 'Could not add name.' });
    } finally {
      setAddingName(false);
    }
  };

  const initiateRemoveName = async (n) => {
    if (!groupId) return;
    setMsg(null);
    setCheckingRemove(true);
    setParticipantToRemove(n);
    try {
      const hasExpenses = await checkParticipantHasExpenses(groupId, n);
      setRemoveConfirmType(hasExpenses ? 'cascade' : 'simple');
    } catch (err) {
      setMsg({ type: 'error', text: 'Could not verify participant data.' });
      setParticipantToRemove(null);
    } finally {
      setCheckingRemove(false);
    }
  };

  const confirmRemoveParticipant = async () => {
    if (!groupId || !participantToRemove) return;
    setDeletingParticipant(true);
    setMsg(null);
    try {
      if (removeConfirmType === 'cascade') {
        await deleteParticipantCascade(groupId, participantToRemove);
      } else {
        await removeParticipantByName(groupId, participantToRemove);
      }
      setToastMsg({ type: 'success', text: 'Participant removed' });
      await refresh();
    } catch (err) {
      setMsg({ type: 'error', text: err?.message || 'Could not remove participant.' });
    } finally {
      setDeletingParticipant(false);
      setParticipantToRemove(null);
      setRemoveConfirmType(null);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const buildSplitRows = () => {
    const total = amount;
    const splitNames = selectedForSplit;
    if (!splitNames.length) throw new Error('Select at least one person in “Split among”.');
    if (!splitNames.includes(payerName)) throw new Error('The payer must be included in the split.');

    if (splitType === 'equal') {
      return calculateEqualSplit(total, splitNames);
    }
    if (splitType === 'exact') {
      const map = {};
      for (const n of splitNames) {
        const v = splitInputs[n];
        if (v === undefined || v === '') throw new Error('Fill exact amount for each person in the split.');
        map[n] = v;
      }
      return calculateExactSplit(total, map);
    }
    if (splitType === 'percentage') {
      const map = {};
      for (const n of splitNames) {
        const v = splitInputs[n];
        if (v === undefined || v === '') throw new Error('Fill percentage for each person in the split.');
        map[n] = v;
      }
      return calculatePercentageSplit(total, map);
    }
    const map = {};
    for (const n of splitNames) {
      const v = splitInputs[n];
      if (v === undefined || v === '') throw new Error('Fill shares for each person in the split.');
      map[n] = v;
    }
    return calculateShareSplit(total, map);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!groupId || !user?.id) return;

    const num = parseFloat(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setMsg({ type: 'error', text: 'Enter a valid amount greater than zero.' });
      return;
    }
    if (!payerName) {
      setMsg({ type: 'error', text: 'Choose who paid.' });
      return;
    }

    setSubmitting(true);
    try {
      const rows = buildSplitRows();
      let receiptUrl = null;
      if (receiptFile) {
        receiptUrl = await uploadExpenseReceipt(receiptFile, user.id, groupId);
      }
      await createExpenseRecord({
        groupId,
        payerName,
        totalAmount: round2(num),
        description: description.trim(),
        splitType,
        splits: rows,
        receiptUrl,
      });
      setMsg({ type: 'success', text: 'Expense recorded.' });
      setAmount('');
      setDescription('');
      setReceiptFile(null);
      if (fileRef.current) fileRef.current.value = '';
      await refresh();
    } catch (err) {
      setMsg({ type: 'error', text: err?.message || 'Could not save expense.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filterSuggestions = () => {
    const q = nameInput.trim().toLowerCase();
    if (!q) return (suggestedNames || []).slice(0, 12);
    return (suggestedNames || []).filter((s) => s.toLowerCase().includes(q)).slice(0, 12);
  };

  return (
    <div className="profile-card" style={{ position: 'relative' }}>
      {toastMsg && (
        <div className={`pro-msg ${toastMsg.type}`} style={{ position: 'absolute', top: 16, right: 16, margin: 0, padding: '0.5rem 1rem', zIndex: 10 }}>
          {toastMsg.text}
        </div>
      )}
      <div className="card-header">
        <h2>Expense Manager</h2>
        <p>Add people by name, split bills with equal, exact, percentage, or share rules—no accounts required.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="pro-group">
          <label>People in this ledger</label>
          <div className="expense-tag-input-row">
            <input
              type="text"
              className="pro-input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  tryAddName();
                }
              }}
              placeholder="Type a name, press Enter"
              list="expense-name-suggestions"
              autoComplete="off"
            />
            <datalist id="expense-name-suggestions">
              {filterSuggestions().map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <button type="button" className="pro-btn-secondary" disabled={addingName} onClick={tryAddName}>
              {addingName ? 'Adding…' : 'Add'}
            </button>
          </div>
          {!names.length ? (
            <p className="expense-hint">Add at least one person to record expenses.</p>
          ) : (
            <ul className="expense-chip-list">
              {names.map((n) => (
                <li key={n} className="expense-chip">
                  <span className="expense-chip-avatar" aria-hidden>
                    {initials(n)}
                  </span>
                  <span className="expense-chip-label">{n}</span>
                  <button type="button" className="expense-chip-remove" onClick={() => initiateRemoveName(n)} aria-label={`Remove ${n}`} disabled={checkingRemove}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="pro-group">
          <label>Split among</label>
          <div className="expense-participant-grid">
            {names.map((n) => (
              <label key={n} className="expense-participant-row">
                <input type="checkbox" checked={splitIncluded.has(n)} onChange={() => toggleSplitName(n)} />
                <span className="expense-participant-avatar">{initials(n)}</span>
                {n}
              </label>
            ))}
          </div>
        </div>

        <div className="pro-group">
          <label>Amount (₹)</label>
          <input
            type="number"
            className="pro-input"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="pro-group">
          <label>Payer</label>
          <div className={`pro-custom-select ${activeDropdown === 'payer' ? 'active' : ''} ${!names.length ? 'disabled' : ''}`}>
            <div className="pro-select-trigger" onClick={() => names.length && setActiveDropdown(activeDropdown === 'payer' ? null : 'payer')}>
              <span>{payerName || 'Select who paid'}</span>
              <svg className="pro-select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div className="pro-select-dropdown">
              <div className={`pro-select-option ${payerName === '' ? 'selected' : ''}`} onClick={() => { setPayerName(''); setActiveDropdown(null); }}>Select who paid</div>
              {names.map((n) => (
                <div key={n} className={`pro-select-option ${payerName === n ? 'selected' : ''}`} onClick={() => { setPayerName(n); setActiveDropdown(null); }}>
                  {n}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pro-group">
          <label>Split type</label>
          <div className={`pro-custom-select ${activeDropdown === 'split' ? 'active' : ''}`}>
            <div className="pro-select-trigger" onClick={() => setActiveDropdown(activeDropdown === 'split' ? null : 'split')}>
              <span>{SPLIT_TYPES.find(t => t.value === splitType)?.label || 'Select split type'}</span>
              <svg className="pro-select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div className="pro-select-dropdown">
              {SPLIT_TYPES.map((t) => (
                <div key={t.value} className={`pro-select-option ${splitType === t.value ? 'selected' : ''}`} onClick={() => { setSplitType(t.value); setActiveDropdown(null); }}>
                  {t.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {splitType !== 'equal' && selectedForSplit.length > 0 && (
          <div className="pro-group">
            <label>
              {splitType === 'exact' ? 'Amount per person (₹)' : splitType === 'percentage' ? 'Percent per person' : 'Shares (whole numbers)'}
            </label>
            <div className="expense-split-grid">
              {selectedForSplit.map((n) => (
                <div key={n} className="expense-split-row">
                  <span className="expense-split-name">
                    <span className="expense-split-avatar">{initials(n)}</span>
                    {n}
                  </span>
                  <input
                    className="pro-input"
                    style={{ padding: '0.75rem' }}
                    type={splitType === 'shares' ? 'number' : 'text'}
                    min={splitType === 'shares' ? 1 : undefined}
                    step={splitType === 'exact' ? '0.01' : splitType === 'percentage' ? '0.1' : 1}
                    value={splitInputs[n] ?? ''}
                    onChange={(e) => updateSplitField(n, e.target.value)}
                    placeholder={splitType === 'percentage' ? '%' : splitType === 'shares' ? '1' : '0.00'}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pro-group">
          <label>Description</label>
          <input
            type="text"
            className="pro-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dinner, taxi, tickets…"
          />
        </div>

        <div className="pro-group">
          <label>Receipt</label>
          <div className="expense-receipt-row">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              style={{ display: 'none' }}
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            />
            <button type="button" className="pro-btn-secondary" onClick={() => fileRef.current?.click()}>
              Upload receipt
            </button>
            {receiptFile && <span className="expense-receipt-name">{receiptFile.name}</span>}
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {msg && <div className={`pro-msg ${msg.type}`}>{msg.text}</div>}
          <button className="pro-save-btn" type="submit" disabled={submitting || !groupId || !names.length} style={{ background: '#0b5851', margin: 0 }}>
            {submitting ? 'Saving…' : 'Add Expense'}
          </button>
        </div>
      </form>

      {participantToRemove && removeConfirmType && (
        <div className="expense-modal-overlay">
          <div className="expense-modal-card">
            <h3>Remove Participant</h3>
            {removeConfirmType === 'cascade' ? (
              <p>
                <strong>{participantToRemove}</strong> is part of past expenses. What do you want to do?
              </p>
            ) : (
              <p>Are you sure you want to remove <strong>{participantToRemove}</strong>?</p>
            )}
            
            <div className="expense-modal-actions">
              <button type="button" className="pro-btn-cancel" onClick={() => { setParticipantToRemove(null); setRemoveConfirmType(null); }} disabled={deletingParticipant}>
                Cancel
              </button>
              <button type="button" className="pro-btn-danger" onClick={confirmRemoveParticipant} disabled={deletingParticipant}>
                {deletingParticipant 
                  ? 'Removing...' 
                  : (removeConfirmType === 'cascade' ? 'Delete participant + all their expenses' : 'Remove')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpenseManagerCard;
