import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AddExpense.css';
import { useTripContext } from '../context/TripContext';
import { formatRupiah, parseRupiah, splitEqual } from '../utils/money';
import { CATEGORIES } from '../utils/categories';
import { generateId } from '../utils/id';
import {
  SPLIT_EQUAL,
  SPLIT_ITEMIZED,
  isItemizedExpense,
  validateItems,
  itemsTotal,
  itemMemberShares,
  itemsMismatch,
  participantsFromItems,
  getItemParticipants,
  getItemPayer,
} from '../utils/items';
import ScreenHeader from '../components/ScreenHeader';
import Button from '../components/Button';
import CategoryChip from '../components/CategoryChip';
import MemberChip from '../components/MemberChip';

export default function AddExpense() {
  const navigate = useNavigate();
  const { tripId, expenseId } = useParams();
  const { state, dispatch, showToast } = useTripContext();

  // Edit mode
  const existingExpense = expenseId ? state.expenses.find(e => e.id === expenseId) : null;

  // Resolve trip ID: route param, or existing expense trip, or activeTripId, or first available trip
  const initialTripId = tripId || existingExpense?.tripId || state.activeTripId || (state.trips.length > 0 ? state.trips[0].id : '');
  const [selectedTripId, setSelectedTripId] = useState(initialTripId);

  const trip = state.trips.find(t => t.id === selectedTripId);
  const members = useMemo(() => state.members.filter(m => m.tripId === selectedTripId), [state.members, selectedTripId]);

  const [name, setName] = useState(existingExpense?.name || '');
  const [amountStr, setAmountStr] = useState(existingExpense ? formatRupiah(existingExpense.amount) : '');
  const [category, setCategory] = useState(existingExpense?.category || 'food');
  const [paidBy, setPaidBy] = useState(existingExpense?.paidBy || '');
  // A new expense defaults to every trip member selected (PRD 7.6).
  // An existing expense always uses its own recorded split.
  const [splitBetween, setSplitBetween] = useState(() =>
    existingExpense ? existingExpense.splitBetween || [] : members.map(m => m.id)
  );
  // Split method: 'equal' (default) or 'itemized'. Existing expenses without a
  // splitMethod are treated as 'equal' so legacy data is never broken.
  const [splitMethod, setSplitMethod] = useState(
    isItemizedExpense(existingExpense) ? SPLIT_ITEMIZED : SPLIT_EQUAL
  );
  const [items, setItems] = useState(() =>
    isItemizedExpense(existingExpense)
      ? (existingExpense.items || []).map(it => ({
          id: it.id || generateId(),
          name: it.name || '',
          amount: Number(it.amount) || 0,
          // Legacy single-owner items become a one-participant list; their
          // payer came from the expense level.
          participantIds: getItemParticipants(it),
          paidBy: getItemPayer(it, existingExpense) || '',
        }))
      : []
  );
  const isItemized = splitMethod === SPLIT_ITEMIZED;
  const [errors, setErrors] = useState({});

  // Sync default payer and split members when the trip's member set changes
  // (e.g. members added/removed, or trip switched). Only re-defaults when
  // the current selection is actually invalid — never when the user has
  // intentionally unchecked everyone (the "select at least one member"
  // validation handles the empty case).
  const memberIds = useMemo(() => new Set(members.map(m => m.id)), [members]);

  useEffect(() => {
    if (existingExpense) return;
    if (members.length === 0) {
      setPaidBy(prev => (prev === '' ? prev : ''));
      setSplitBetween(prev => (prev.length === 0 ? prev : []));
      return;
    }
    if (!paidBy || !memberIds.has(paidBy)) {
      setPaidBy(members[0].id);
    }
  }, [members, memberIds, paidBy, existingExpense]);

  const handleTripChange = (newTripId) => {
    setSelectedTripId(newTripId);
    dispatch({ type: 'SET_ACTIVE_TRIP', payload: newTripId });
    // Reset payer/split to the new trip's members (defaults to all selected).
    const newMembers = state.members.filter(m => m.tripId === newTripId);
    setPaidBy(newMembers.length > 0 ? newMembers[0].id : '');
    setSplitBetween(newMembers.map(m => m.id));
  };

  const amount = parseRupiah(amountStr);

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw === '') {
      setAmountStr('');
      return;
    }
    const num = parseInt(raw, 10);
    setAmountStr(formatRupiah(num));
  };

  const toggleMember = (memberId) => {
    setSplitBetween(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSplitMethodChange = (method) => {
    setSplitMethod(method);
    // Seed one empty row so the editor is immediately usable.
    // Participants start EMPTY and no payer is assumed — the payer must be
    // chosen explicitly and is never auto-added as a participant.
    if (method === SPLIT_ITEMIZED && items.length === 0) {
      setItems([{ id: generateId(), name: '', amount: 0, participantIds: [], paidBy: '' }]);
    }
    setErrors(prev => ({ ...prev, split: undefined, items: undefined }));
  };

  const handleItemChange = (updatedItem) => {
    setItems(prev => prev.map(it => (it.id === updatedItem.id ? updatedItem : it)));
  };

  const handleItemRemove = (itemId) => {
    setItems(prev => prev.filter(it => it.id !== itemId));
  };

  const handleItemAdd = () => {
    setItems(prev => [...prev, { id: generateId(), name: '', amount: 0, participantIds: [], paidBy: '' }]);
  };

  const shares = useMemo(() => {
    if (splitBetween.length === 0 || amount === 0) return [];
    return splitEqual(amount, splitBetween.length);
  }, [amount, splitBetween]);

  const itemsSum = useMemo(() => itemsTotal(items), [items]);
  const itemsDiff = useMemo(() => itemsMismatch(items, amount), [items, amount]);
  // Each member's automatically-calculated share from the items assigned to them.
  const itemShares = useMemo(() => {
    const totals = itemMemberShares(items);
    return members
      .map(m => ({ member: m, total: totals.get(m.id) || 0 }))
      .filter(({ total }) => total > 0);
  }, [items, members]);

  // Per-item share preview (each item split equally among ITS participants).
  const itemSharePreview = useMemo(() =>
    items.map(item => {
      const ps = getItemParticipants(item);
      const amt = Number(item.amount) || 0;
      if (ps.length === 0 || amt === 0) return [];
      const base = Math.floor(amt / ps.length);
      const rem = amt - base * ps.length;
      return ps.map((id, i) => ({ memberId: id, share: base + (i < rem ? 1 : 0) }));
    }),
  [items]);

  const validate = () => {
    const errs = {};
    if (!selectedTripId) errs.trip = 'Please select a trip';
    if (!name.trim()) errs.name = 'Expense name is required';
    if (amount <= 0) errs.amount = 'Enter a valid amount';
    if (splitMethod === SPLIT_EQUAL) {
      if (!paidBy) errs.paidBy = 'Select who paid';
      if (splitBetween.length === 0) errs.split = 'Select at least one member';
    } else {
      const itemErr = validateItems(items, amount);
      if (itemErr) errs.items = itemErr;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const today = new Date().toISOString().split('T')[0];

    const expenseData = {
      tripId: selectedTripId,
      name: name.trim(),
      amount,
      category,
      paidBy,
      splitMethod,
      date: existingExpense?.date || today,
    };

    if (splitMethod === SPLIT_ITEMIZED) {
      expenseData.items = items.map(({ id, name: itemName, amount: itemAmount, participantIds, paidBy }) => ({
        id,
        name: itemName.trim(),
        amount: Number(itemAmount) || 0,
        participantIds,
        paidBy,
      }));
      // Keep participants populated (derived from item participants) so existing
      // screens reading splitBetween keep working. No expense-level paidBy.
      expenseData.splitBetween = participantsFromItems(expenseData.items);
      expenseData.paidBy = null;
    } else {
      expenseData.splitBetween = splitBetween;
    }

    if (existingExpense) {
      dispatch({ type: 'UPDATE_EXPENSE', payload: { ...expenseData, id: existingExpense.id } });
      dispatch({ type: 'RESET_SETTLEMENTS', payload: selectedTripId });
    } else {
      dispatch({ type: 'ADD_EXPENSE', payload: expenseData });
      dispatch({ type: 'RESET_SETTLEMENTS', payload: selectedTripId });
    }

    showToast(existingExpense ? 'Expense updated' : 'Expense added');
    navigate(`/trips/${selectedTripId}`);
  };

  if (state.trips.length === 0) {
    return (
      <div className="add-expense-screen">
        <ScreenHeader title="Add Expense" />
        <div className="muted" style={{ textAlign: 'center', padding: 40 }}>
          No trips exist yet. Create a trip first before adding expenses.
        </div>
        <Button onClick={() => navigate('/trips/create')}>+ Create Trip</Button>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="add-expense-screen">
        <ScreenHeader title="Add Expense" />
        <div className="muted" style={{ textAlign: 'center', padding: 40 }}>
          Trip not found.
        </div>
        <Button onClick={() => navigate('/trips')} variant="ghost">View All Trips</Button>
      </div>
    );
  }

  return (
    <div className="add-expense-screen">
      <ScreenHeader
        title={existingExpense ? 'Edit Expense' : 'Add Expense'}
        onBack={() => navigate(tripId ? `/trips/${tripId}` : -1)}
      />

      {/* Trip selector: only shown if not in a scoped /trips/:tripId route and multiple trips exist */}
      {!tripId && !existingExpense && state.trips.length > 1 && (
        <div className="field">
          <label>Trip</label>
          <select
            className="paid-by-select"
            value={selectedTripId}
            onChange={(e) => handleTripChange(e.target.value)}
          >
            {state.trips.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} {t.destination ? `(${t.destination})` : ''}
              </option>
            ))}
          </select>
          {errors.trip && <div className="field-error">{errors.trip}</div>}
        </div>
      )}

      <div className="field">
        <label>What did you spend on?</label>
        <input
          placeholder="Dinner"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        {errors.name && <div className="field-error">{errors.name}</div>}
      </div>

      <div className="amount-wrap">
        <div className="muted" style={{ marginBottom: 6 }}>Amount</div>
        <input
          className="amount-input"
          value={amountStr}
          onChange={handleAmountChange}
          placeholder="Rp0"
          inputMode="numeric"
        />
        {errors.amount && <div className="field-error" style={{ marginTop: 8 }}>{errors.amount}</div>}
      </div>

      <div className="field">
        <label>Category</label>
        <div className="cat-grid">
          {CATEGORIES.map(cat => (
            <CategoryChip
              key={cat.id}
              emoji={cat.emoji}
              label={cat.label}
              active={category === cat.id}
              onClick={() => setCategory(cat.id)}
            />
          ))}
        </div>
      </div>

{members.length === 0 && (
        <div className="field">
          <label>Members</label>
          <div className="muted" style={{ fontSize: 13 }}>
            No members in this trip yet.{' '}
            <span
              className="link-sm"
              onClick={() => navigate(`/trips/${selectedTripId}/members`)}
            >
              + Add members
            </span>
          </div>
        </div>
      )}

      {members.length > 0 && !isItemized && (
        <div className="field">
          <label>Paid by</label>
          <select
            className="paid-by-select"
            value={paidBy}
            onChange={e => setPaidBy(e.target.value)}
          >
            <option value="">Select payer</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          {errors.paidBy && <div className="field-error">{errors.paidBy}</div>}
        </div>
      )}

      <div className="field">
        <label>How do you want to split?</label>
        <div className="split-toggle" role="group" aria-label="Split method">
          <button
            type="button"
            className={`split-toggle-btn ${!isItemized ? 'split-toggle-btn-active' : ''}`}
            onClick={() => handleSplitMethodChange(SPLIT_EQUAL)}
            aria-pressed={!isItemized}
          >
            Equal
          </button>
          <button
            type="button"
            className={`split-toggle-btn ${isItemized ? 'split-toggle-btn-active' : ''}`}
            onClick={() => handleSplitMethodChange(SPLIT_ITEMIZED)}
            aria-pressed={isItemized}
          >
            By item
          </button>
        </div>
      </div>

      {isItemized ? (
        <div className="field">
          <label>Items</label>
          {items.map((item, index) => (
            <ItemRow
              key={item.id}
              item={item}
              index={index}
              members={members}
              shares={itemSharePreview[index] || []}
              onChange={handleItemChange}
              onRemove={handleItemRemove}
            />
          ))}
          <button type="button" className="add-item-btn" onClick={handleItemAdd}>
            + Add item
          </button>
          {errors.items && <div className="field-error">{errors.items}</div>}
          {items.length > 0 && itemsDiff !== 0 && (
            <div className="field-error">
              Items total <b>{formatRupiah(itemsSum)}</b> vs expense total{' '}
              <b>{formatRupiah(amount)}</b> — difference{' '}
              <b>{formatRupiah(Math.abs(itemsDiff))}</b>
            </div>
          )}
          {itemShares.length > 0 && amount > 0 && (
            <div className="item-share-summary">
              <div className="item-share-title muted">Per member share</div>
              {itemShares.map(({ member, total }) => (
                <div key={member.id} className="item-share-row">
                  <span>{member.name}</span>
                  <b>{formatRupiah(total)}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="field">
          <label>Split between ({members.length} trip members)</label>
          {members.map((m) => (
            <MemberChip
              key={m.id}
              name={m.name}
              showCheckbox={true}
              checked={splitBetween.includes(m.id)}
              onToggle={() => toggleMember(m.id)}
            />
          ))}
          {errors.split && <div className="field-error">{errors.split}</div>}
        </div>
      )}

      {!isItemized && splitBetween.length > 0 && amount > 0 && (
        <div className="share-note">
          Split {splitBetween.length} ways — <b>{formatRupiah(shares[0] || 0)} each</b>
        </div>
      )}

      <Button onClick={handleSubmit}>
        {existingExpense ? 'Save Changes' : 'Add Expense'}
      </Button>
    </div>
  );
}

function ItemRow({ item, index, members, shares, onChange, onRemove }) {
  const [priceStr, setPriceStr] = useState(item.amount > 0 ? formatRupiah(item.amount) : '');

  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw === '') {
      setPriceStr('');
      onChange({ ...item, amount: 0 });
      return;
    }
    const num = parseInt(raw, 10);
    setPriceStr(formatRupiah(num));
    onChange({ ...item, amount: num });
  };

  return (
    <div className="item-row">
      <div className="item-row-head">
        <input
          className="item-name-input"
          placeholder={`Item ${index + 1} name`}
          value={item.name}
          onChange={e => onChange({ ...item, name: e.target.value })}
        />
        <button
          type="button"
          className="item-remove-btn"
          onClick={onRemove}
          aria-label={`Remove item ${index + 1}`}
        >
          ×
        </button>
      </div>
      <div className="item-row-price-row">
        <input
          className="item-price-input"
          value={priceStr}
          onChange={handlePriceChange}
          placeholder="Rp0"
          inputMode="numeric"
        />
      </div>
      <div className="item-section-label muted">Bought by / Participants</div>
      <div className="item-select-row">
        <MemberSelect
          members={members}
          value={getItemParticipants(item)}
          multiple
          placeholder="Select members"
          onChange={(ids) => onChange({ ...item, participantIds: ids })}
        />
      </div>
      <div className="item-section-label muted">Paid by</div>
      <div className="item-select-row">
        <MemberSelect
          members={members}
          value={item.paidBy}
          placeholder="Select payer"
          onChange={(memberId) => onChange({ ...item, paidBy: memberId })}
        />
      </div>
      {shares.length > 0 && (
        <div className="item-share-preview">
          Per participant: {members.map(m => shares.find(s => s.memberId === m.id)).filter(Boolean).map(s => `${members.find(m => m.id === s.memberId)?.name} ${formatRupiah(s.share)}`).join(', ')}
        </div>
      )}
    </div>
  );
}

function MemberSelect({ members, value, onChange, multiple = false, placeholder = 'Select' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [open]);

  const selectedIds = multiple
    ? (Array.isArray(value) ? value : [])
    : (value ? [value] : []);
  const isSelected = (id) => selectedIds.includes(id);
  const label = (() => {
    const names = members.filter(m => isSelected(m.id)).map(m => m.name);
    if (names.length === 0) return placeholder;
    return names.join(', ');
  })();

  const handlePick = (id) => {
    if (multiple) {
      onChange(isSelected(id) ? selectedIds.filter(v => v !== id) : [...selectedIds, id]);
    } else {
      onChange(id);
      setOpen(false);
    }
  };

  return (
    <div className="item-member-select" ref={wrapRef}>
      <button
        type="button"
        className={`item-member-select-trigger ${selectedIds.length > 0 ? 'has-value' : ''} ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="item-member-select-value">{label}</span>
        <span className="item-member-select-chevron">▾</span>
      </button>
      {open && (
        <div className="item-member-select-panel" role="listbox" aria-multiselectable={multiple}>
          {members.map(m => {
            const sel = isSelected(m.id);
            return (
              <button
                key={m.id}
                type="button"
                role="option"
              aria-selected={sel}
                className={`item-member-select-option ${sel ? 'selected' : ''}`}
                onClick={() => handlePick(m.id)}
              >
                <span>{m.name}</span>
                {sel && <span className="item-member-select-check">✓</span>}
              </button>
            );
          })}
          {multiple && (
            <button
              type="button"
              className="item-member-select-done"
              onClick={() => setOpen(false)}
            >
              Done
            </button>
          )}
        </div>
      )}
    </div>
  );
}
