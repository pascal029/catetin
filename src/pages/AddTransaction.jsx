import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '../db'
import AmountInput from '../components/AmountInput'

const KINDS = [
  { key: 'income', label: 'Pemasukan' },
  { key: 'expense', label: 'Pengeluaran' },
  { key: 'transfer', label: 'Transfer' },
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function AddTransaction() {
  const navigate = useNavigate()
  const [kind, setKind] = useState('expense')
  const [sourceId, setSourceId] = useState('')
  const [targetSourceId, setTargetSourceId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(todayStr())
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const sources = useLiveQuery(() => db.sources.toArray(), [])
  const categories = useLiveQuery(
    () => kind === 'transfer' ? Promise.resolve([]) : db.categories.where('kind').equals(kind).toArray(),
    [kind]
  )

  async function handleSave() {
    if (!amount || !sourceId) return
    if (kind === 'transfer' && !targetSourceId) return
    if (kind !== 'transfer' && !categoryId) return
    setSaving(true)
    await db.transactions.add({
      kind,
      sourceId: parseInt(sourceId, 10),
      targetSourceId: kind === 'transfer' ? parseInt(targetSourceId, 10) : null,
      categoryId: kind !== 'transfer' ? parseInt(categoryId, 10) : null,
      amount,
      date,
      note: note.trim(),
      createdAt: Date.now(),
    })
    navigate('/')
  }

  const canSave = amount > 0 && sourceId && (kind === 'transfer' ? targetSourceId && sourceId !== targetSourceId : categoryId)

  return (
    <div className="page">
      <div style={{ background: 'var(--ground-dark)', paddingTop: 'calc(var(--safe-top) + 20px)', paddingBottom: 24, paddingInline: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate(-1)} style={{ color: 'var(--text-on-dark)', fontSize: 22 }} aria-label="Kembali">‹</button>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--text-on-dark)' }}>Tambah Transaksi</h1>
        </div>

        {/* Kind selector */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 3, gap: 2 }}>
          {KINDS.map(k => (
            <button
              key={k.key}
              onClick={() => { setKind(k.key); setCategoryId('') }}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 13, fontWeight: 600, transition: 'background 0.15s, color 0.15s',
                background: kind === k.key ? 'var(--surface)' : 'transparent',
                color: kind === k.key ? 'var(--ground-dark)' : 'var(--text-on-dark-muted)',
              }}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Amount */}
        <div className="form-group">
          <label className="form-label">Jumlah</label>
          <AmountInput value={amount || ''} onChange={setAmount} />
        </div>

        {/* Source */}
        <div className="form-group">
          <label className="form-label">{kind === 'transfer' ? 'Dari' : 'Sumber Dana'}</label>
          <select className="form-input" value={sourceId} onChange={e => setSourceId(e.target.value)}>
            <option value="">Pilih sumber...</option>
            {(sources || []).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Target source (transfer only) */}
        {kind === 'transfer' && (
          <div className="form-group">
            <label className="form-label">Ke</label>
            <select className="form-input" value={targetSourceId} onChange={e => setTargetSourceId(e.target.value)}>
              <option value="">Pilih tujuan...</option>
              {(sources || []).filter(s => String(s.id) !== String(sourceId)).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Category */}
        {kind !== 'transfer' && (
          <div className="form-group">
            <label className="form-label">Kategori</label>
            <select className="form-input" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">Pilih kategori...</option>
              {(categories || []).map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Date */}
        <div className="form-group">
          <label className="form-label">Tanggal</label>
          <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} max={todayStr()} />
        </div>

        {/* Note */}
        <div className="form-group">
          <label className="form-label">Catatan (opsional)</label>
          <input type="text" className="form-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Keterangan singkat..." maxLength={120} />
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={!canSave || saving}>
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </div>
  )
}
