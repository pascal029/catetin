import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { formatIDR, formatDate } from '../utils/format'

export default function TransactionItem({ txn, onDelete }) {
  const source = useLiveQuery(() => db.sources.get(txn.sourceId), [txn.sourceId])
  const targetSource = useLiveQuery(
    () => txn.targetSourceId ? db.sources.get(txn.targetSourceId) : undefined,
    [txn.targetSourceId]
  )
  const category = useLiveQuery(
    () => txn.categoryId ? db.categories.get(txn.categoryId) : undefined,
    [txn.categoryId]
  )

  const kindChip = {
    income: <span className="chip chip-income">↑ Masuk</span>,
    expense: <span className="chip chip-expense">↓ Keluar</span>,
    transfer: <span className="chip chip-transfer">⇄ Transfer</span>,
  }[txn.kind]

  const amountColor = txn.kind === 'income' ? 'var(--accent-green)' : txn.kind === 'expense' ? 'var(--accent-gold)' : 'var(--text-secondary)'
  const amountPrefix = txn.kind === 'income' ? '+' : txn.kind === 'expense' ? '−' : ''

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px' }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: source?.color ? source.color + '22' : 'var(--surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>
        {category?.icon || (txn.kind === 'transfer' ? '⇄' : '•')}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
              {category?.name || (txn.kind === 'transfer' ? `${source?.name || '…'} → ${targetSource?.name || '…'}` : '—')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {txn.kind !== 'transfer' && <>{source?.name} · </>}
              {formatDate(txn.date)}
            </div>
            {txn.note && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, fontStyle: 'italic' }}>{txn.note}</div>}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: amountColor, fontVariantNumeric: 'tabular-nums' }}>
              {amountPrefix} {formatIDR(txn.amount)}
            </div>
            <div style={{ marginTop: 4 }}>{kindChip}</div>
          </div>
        </div>
      </div>
      {onDelete && (
        <button onClick={() => onDelete(txn.id)} style={{ color: 'var(--text-secondary)', fontSize: 18, padding: 4, flexShrink: 0 }} aria-label="Hapus">×</button>
      )}
    </div>
  )
}
