import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ExpenseDetail.css';
import { useTripContext } from '../context/TripContext';
import { formatRupiah, splitEqual } from '../utils/money';
import { isItemizedExpense, getExpensePayerIds, getItemParticipants, getItemPayer } from '../utils/items';
import { getCategoryById } from '../utils/categories';
import ScreenHeader from '../components/ScreenHeader';
import Avatar from '../components/Avatar';
import Button from '../components/Button';

export default function ExpenseDetail() {
  const { tripId, expenseId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, showToast } = useTripContext();

  const expense = state.expenses.find(e => e.id === expenseId);
  const members = useMemo(() => state.members.filter(m => m.tripId === tripId), [state.members, tripId]);

  if (!expense) {
    return (
      <div className="expense-detail-screen">
        <ScreenHeader title="Expense" />
        <div className="muted" style={{ textAlign: 'center', padding: 40 }}>Expense not found</div>
      </div>
    );
  }

  const category = getCategoryById(expense.category);
  const itemized = isItemizedExpense(expense);

  // Pay-by section: itemized uses per-item payers; equal uses expense.paidBy.
  const payerIds = getExpensePayerIds(expense);
  const payerRows = payerIds
    .map(id => members.find(m => m.id === id))
    .filter(Boolean)
    .map(m => ({ key: m.id, name: m.name }));

  const itemRows = itemized
    ? (expense.items || []).map((item, i) => {
        const ps = getItemParticipants(item);
        const amt = Number(item.amount) || 0;
        const base = ps.length > 0 ? Math.floor(amt / ps.length) : 0;
        const rem = amt - base * ps.length;
        return {
          key: item.id || `item-${i}`,
          name: item.name,
          participants: ps
            .map((id, j) => {
              const m = members.find(mm => mm.id === id);
              return m ? `${m.name} (${formatRupiah(base + (j < rem ? 1 : 0))})` : null;
            })
            .filter(Boolean),
          participantIds: ps,
          payerName: members.find(m => m.id === getItemPayer(item, expense))?.name || 'Unknown',
          amount: amt,
        };
      })
    : [];

  const shares = itemized
    ? []
    : splitEqual(expense.amount, (expense.splitBetween || []).length);
  const splitMembers = (expense.splitBetween || []).map((id, i) => ({
    member: members.find(m => m.id === id),
    share: shares[i] || 0,
  }));

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      dispatch({ type: 'DELETE_EXPENSE', payload: expenseId });
      dispatch({ type: 'RESET_SETTLEMENTS', payload: tripId });
      showToast('Expense deleted');
      navigate(`/trips/${tripId}`);
    }
  };

  const handleEdit = () => {
    navigate(`/trips/${tripId}/expenses/${expenseId}/edit`);
  };

  return (
    <div className="expense-detail-screen">
      <ScreenHeader title={expense.name} fontSize="18px" />
      <div className="muted" style={{ marginBottom: 10 }}>
        {category.emoji} {category.label}
      </div>
      <div className="expense-detail-amount">{formatRupiah(expense.amount)}</div>

      {!itemized && (
        <>
          <div className="expense-detail-label">Paid by</div>
          {payerRows.map(({ key, name }) => (
            <div key={key} className="expense-detail-member-row">
              <div className="expense-detail-member-left">
                <Avatar name={name} />
                <span>{name}</span>
              </div>
            </div>
          ))}
        </>
      )}

      <div className="expense-detail-label" style={{ marginTop: 18 }}>
        {itemized ? 'Items' : 'Split between'}
      </div>
      {itemized ? (
        itemRows.map(({ key, name, participants, participantIds, payerName, amount }) => {
          const firstMember = members.find(m => m.id === participantIds[0]);
          return (
            <div key={key} className="expense-detail-member-row">
              <div className="expense-detail-member-left">
                <Avatar name={firstMember?.name || '?'} />
                <div>
                  <div>{name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>Bought by: {participants.join(', ')}</div>
                  <div className="muted" style={{ fontSize: 12 }}>Paid by: {payerName}</div>
                </div>
              </div>
              <b>{formatRupiah(amount)}</b>
            </div>
          );
        })
      ) : (
        splitMembers.map(({ member, share }, i) => (
          <div key={i} className="expense-detail-member-row">
            <div className="expense-detail-member-left">
              <Avatar name={member?.name || '?'} />
              <span>{member?.name || 'Unknown'}</span>
            </div>
            <b>{formatRupiah(share)}</b>
          </div>
        ))
      )}

      <div className="expense-detail-actions">
        <Button variant="ghost" onClick={handleEdit} style={{ flex: 1 }}>Edit</Button>
        <Button variant="destructive" onClick={handleDelete} style={{ flex: 1 }}>Delete</Button>
      </div>
    </div>
  );
}
