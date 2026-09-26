import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ExpenseList.css';
import { useTripContext } from '../context/TripContext';
import { CATEGORY_FILTERS } from '../utils/categories';
import { getRelativeDateLabel } from '../utils/helpers';
import ScreenHeader from '../components/ScreenHeader';
import ExpenseRow from '../components/ExpenseRow';
import CategoryChip from '../components/CategoryChip';
import EmptyState from '../components/EmptyState';

export default function ExpenseList() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { state } = useTripContext();
  const [filter, setFilter] = useState('all');

  const members = useMemo(() => state.members.filter(m => m.tripId === tripId), [state.members, tripId]);

  const filteredExpenses = useMemo(() => {
    let exps = state.expenses.filter(e => e.tripId === tripId);
    if (filter !== 'all') {
      exps = exps.filter(e => e.category === filter);
    }
    return exps.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [state.expenses, tripId, filter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups = [];
    let currentLabel = '';
    filteredExpenses.forEach(exp => {
      const label = getRelativeDateLabel(exp.date);
      if (label !== currentLabel) {
        groups.push({ label, expenses: [exp] });
        currentLabel = label;
      } else {
        groups[groups.length - 1].expenses.push(exp);
      }
    });
    return groups;
  }, [filteredExpenses]);

  return (
    <div className="expense-list-screen">
      <ScreenHeader title="Expenses" />

      <div className="filter-row">
        {CATEGORY_FILTERS.map(f => (
          <CategoryChip
            key={f.id}
            label={f.label}
            active={filter === f.id}
            onClick={() => setFilter(f.id)}
          />
        ))}
      </div>

      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon="💸"
          heading="No expenses yet"
          text="Start tracking your group spending."
          actionLabel="+ Add Expense"
          onAction={() => navigate(`/trips/${tripId}/add-expense`)}
        />
      ) : (
        grouped.map((group, gi) => (
          <div key={gi}>
            <h2 className="date-group-heading" style={gi > 0 ? { marginTop: 18 } : undefined}>
              {group.label}
            </h2>
            {group.expenses.map(exp => (
              <ExpenseRow
                key={exp.id}
                expense={exp}
                members={members}
                onClick={() => navigate(`/trips/${tripId}/expenses/${exp.id}`)}
                showPayer={true}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
