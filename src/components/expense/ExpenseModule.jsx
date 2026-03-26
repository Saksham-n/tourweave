import React from 'react';
import { useExpenseGroup } from '../../hooks/useExpenseGroup';
import ExpenseManagerCard from './ExpenseManagerCard';
import BalancesSettlementCard from './BalancesSettlementCard';
import './ExpenseModule.css';

/**
 * Splitwise-style pair of cards; use inside profile grid column 3.
 */
function ExpenseModule({ user }) {
  const {
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
  } = useExpenseGroup(user);

  return (
    <div className="profile-expense-module">
      {error ? (
        <div className="pro-msg error" style={{ gridColumn: '1 / -1', margin: '0 0 0.5rem' }}>
          {error}
        </div>
      ) : null}
      <ExpenseManagerCard
        user={user}
        groupId={groupId}
        participantRows={participantRows}
        suggestedNames={suggestedNames}
        refresh={refresh}
      />
      <BalancesSettlementCard
        loading={loading}
        balances={balances}
        simplified={simplified}
        expenses={expenses}
        displayName={displayName}
        refresh={refresh}
      />
    </div>
  );
}

export default ExpenseModule;
