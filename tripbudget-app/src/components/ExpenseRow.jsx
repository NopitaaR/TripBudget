import './ExpenseRow.css';
import { getCategoryById } from '../utils/categories';
import { formatRupiah } from '../utils/money';
import { getRelativeDateLabel } from '../utils/helpers';
import { getExpensePayerIds } from '../utils/items';

export default function ExpenseRow({ expense, members, onClick, showPayer = true }) {
  const category = getCategoryById(expense.category);
  const payerIds = getExpensePayerIds(expense);
  const payerNames = payerIds
    .map(id => members.find(m => m.id === id)?.name)
    .filter(Boolean);
  const dateLabel = expense.date ? getRelativeDateLabel(expense.date) : '';
  const payerText = payerNames.length === 0
    ? ''
    : payerNames.length === 1
      ? `${payerNames[0]} paid`
      : `${payerNames.join(', ')} paid`;

  return (
    <div className="expense-row" onClick={onClick}>
      <div className="expense-row-icon">{category.emoji}</div>
      <div className="expense-row-info">
        <div className="expense-row-title">{expense.name}</div>
        <div className="expense-row-sub">
          {showPayer ? payerText : payerNames.join(', ') || ''}
          {dateLabel ? ` · ${dateLabel}` : ''}
        </div>
      </div>
      <div className="expense-row-amount">{formatRupiah(expense.amount)}</div>
    </div>
  );
}
