import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSourceBalance } from '../db'
import { formatIDR } from '../utils/format'
import AmountInput from '../components/AmountInput'

const SOURCE_TYPES = [
  { value: 'savings', label: 'Tabungan' },
  { value: 'checking', label: 'Giro / Harian' },
  { value: 'cash', label: 'Tunai' },
  { value: 'e-wallet', label: 'Dompet Digital' },
  { value: 'other', label: 'Lainnya' },
]

const DEFAULT_COLORS = ['#1E6BB0', '#F5A623', '#2E7D32', '#7B1FA2', '#C62828', '#00695C']

function SourceCard({ source, onDelete }) {
  const balance = useLiveQuery(() => getSourceBalance(source.id), [source.id])
  const typeLabel = SOURCE_TYPES.find(t => t.value === source.type)?.label || source.type

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: source.color || 'var(--ground-dark)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 18, fontWeight: 700,
      }}>
        {source.name.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{source.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{typeLabel}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontWeight: 700, fontSize: 15, fontVariantNumeric: 'tabular-nums',
          color: (balance || 0) >= 0 ? 'var(--text-primary)' : 'var(--accent-red)',
        }}>
          {formatIDR(balance || 0)}
        </div>
        <button className="btn-danger" style={{ marginTop: 6, padding: '4px 10px', fontSize: 12 }} onClick={() => onDelete(source)}>
          Hapus
        </button>
      </div>
    </div>
  )
}

export default function Sources() {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('savings')
  const [color, setColor] = useState(DEFAULT_COLORS[0])
  const [initialBalance, setInitialBalance] = useState(0)

  const sources = useLiveQuery(() => db.sources.toArray(), [])

  async function handleAdd() {
    if (!name.trim()) return
    await db.sources.add({ name: name.trim(), type, color, initialBalance })
    setName(''); setType('savings'); setColor(DEFAULT_COLORS[0]); setInitialBalance(0)
    setShowForm(false)
  }

  async function handleDelete(source) {
    const balance = await getSourceBalance(source.id)
    const txnCount = await db.transactions.where('sourceId').equals(source.id).count()
    const msg = txnCount > 0
      ? `Sumber "${source.name}" memiliki ${txnCount} transaksi. Hapus semua data ini?`
      : `Hapus sumber "${source.name}"?`
    if (!confirm(msg)) return
    await db.transactions.where('sourceId').equals(source.id).delete()
    await db.sources.delete(source.id)
  }

  return (
    <div className="page">
      <div style={{ background: 'var(--ground-dark)', paddingTop: 'calc(var(--safe-top) + 20px)', paddingBottom: 20, paddingInline: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--text-on-dark)' }}>Sumber Dana</h1>
          <button onClick={() => setShowForm(!showForm)} style={{ color: 'var(--text-on-dark)', fontSize: 24, lineHeight: 1 }} aria-label="Tambah sumber">
            {showForm ? '×' : '+'}
          </button>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {showForm && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Nama Sumber</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: BCA, GoPay..." autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Jenis</label>
              <select className="form-input" value={type} onChange={e => setType(e.target.value)}>
                {SOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Saldo Awal</label>
              <AmountInput value={initialBalance} onChange={setInitialBalance} />
            </div>
            <div className="form-group">
              <label className="form-label">Warna</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DEFAULT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', background: c,
                      border: color === c ? '3px solid var(--text-primary)' : '2px solid transparent',
                      outline: color === c ? '2px solid white' : 'none',
                    }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
            <button className="btn-primary" onClick={handleAdd} disabled={!name.trim()}>Tambah</button>
          </div>
        )}

        {(sources || []).length === 0 && !showForm ? (
          <div className="empty-state">
            <div className="empty-icon">🏦</div>
            <p>Belum ada sumber dana.<br />Ketuk + untuk menambahkan.</p>
          </div>
        ) : (
          (sources || []).map(s => <SourceCard key={s.id} source={s} onDelete={handleDelete} />)
        )}
      </div>
    </div>
  )
}
