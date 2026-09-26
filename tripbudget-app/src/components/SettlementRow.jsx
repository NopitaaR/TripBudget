import { useState } from 'react';
import './SettlementRow.css';
import Avatar from './Avatar';
import { formatRupiah } from '../utils/money';

export default function SettlementRow({ fromName, toName, amount, isPaid, onMarkPaid, label, details }) {
  const [open, setOpen] = useState(false);
  const hasDetails = Array.isArray(details);

  return (
    <div
      className={`settlement-row ${isPaid ? 'settlement-row-done' : ''} ${hasDetails ? 'settlement-row-extended' : ''}`}
    >
      <div className="settlement-row-left">
        <Avatar name={fromName} />
        <div>
          <div className="settlement-row-title">{label || `${fromName} → ${toName}`}</div>
          <div className="settlement-row-amount">{formatRupiah(amount)}</div>
        </div>
      </div>

      {!hasDetails && (
        <button
          className={`pill-btn ${isPaid ? 'pill-btn-done' : ''}`}
          onClick={onMarkPaid}
          disabled={isPaid}
        >
          {isPaid ? '✓ Paid' : 'Mark as paid'}
        </button>
      )}

      {hasDetails && (
        <>
          <div className="settlement-row-actions">
            <button
              type="button"
              className={`pill-btn ${open ? 'pill-btn-open' : ''}`}
              onClick={() => setOpen(o => !o)}
              aria-expanded={open}
              aria-label={`${open ? 'Hide' : 'Show'} payment detail for ${fromName} to ${toName}`}
            >
              {open ? '▾ Detail' : '▸ Detail'}
            </button>
            <button
              className={`pill-btn ${isPaid ? 'pill-btn-done' : ''}`}
              onClick={onMarkPaid}
              disabled={isPaid}
            >
              {isPaid ? '✓ Paid' : 'Mark as paid'}
            </button>
          </div>

          {open && (
            <div className="settlement-details">
              <div className="settlement-details-title muted">Details</div>

              {details.length === 0 ? (
                <div className="settlement-details-empty muted">
                  This payment comes from the trip-wide net balance — there is no direct expense between these two members.
                </div>
              ) : (
                details.map((d, i) => (
                  <div key={d.id || i} className="settlement-detail-item">
                    <div className="settlement-detail-title">{d.title}</div>
                    {d.parentName && (
                      <div className="settlement-detail-parent muted">{d.parentName}</div>
                    )}
                    <div className="settlement-detail-line muted">
                      Total: <b>{formatRupiah(d.total)}</b>
                    </div>
                    <div className="settlement-detail-line muted">
                      Participants: <b>{d.participants.join(', ')}</b>
                    </div>
                    <div className="settlement-detail-line muted">
                      {fromName}'s share: <b>{formatRupiah(d.share)}</b>
                    </div>
                    <div className="settlement-detail-line muted">
                      Paid by: <b>{d.payerName}</b>
                    </div>
                  </div>
                ))
              )}

              <div className="settlement-details-total">
                <span>Total to pay</span>
                <b>{formatRupiah(amount)}</b>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
