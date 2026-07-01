import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '../db'
import TransactionItem from '../components/TransactionItem'

export default function Transactions() {
  const navigate = useNavigate()
  const [filterKind, setFilterKind] = useState('')
  const [filterSource, setFilterSource] = useState('')

  const sources = useLiveQuery(() => db.sources.toArray(), [])
  const txns = useLiveQuery(() => db.transactions.toArray(), [])

  const filtered = (txns || [])
    .filter(t => !filterKind || t.kind === filterKind)
    .filter(t => !filterSource || String(t.sourceId) === filterSource)
    .sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt)

  async function handleDelete(id) {
    if (confirm('Hapus transaksi ini?')) await db.transactions.delete(id)
  }

  return (
    <div className="page">
      <div style={{ background: 'var(--ground-dark)', paddingTop: 'calc(var(--safe-top) + 20px)', paddingBottom: 20, paddingInline: 20 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--text-on-dark)', marginBottom: 14 }}>Semua Transaksi</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={filterKind}
            onChange={e => setFilterKind(e.target.value)}
            style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.12)', color: 'var(--text-on-dark)', fontSize: 13, fontFamily: 'inherit', appearance: 'none' }}
          >
            <option value="">Semua jenis</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
            <option value="transfer">Transfer</option>
          </select>
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.12)', color: 'var(--text-on-dark)', fontSize: 13, fontFamily: 'inherit', appearance: 'none' }}
          >
            <option value="">Semua sumber</option>
            {(sources || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Tidak ada transaksi.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {filtered.map((txn, i) => (
              <div key={txn.id}>
                {i > 0 && <div className="divider" />}
                <TransactionItem txn={txn} onDelete={handleDelete} />
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => navigate('/add')} aria-label="Tambah transaksi">+</button>
    </div>
  )
}
