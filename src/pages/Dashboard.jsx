import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db, getSourceBalance } from '../db'
import { formatIDR } from '../utils/format'
import MonthSelector from '../components/MonthSelector'
import TransactionItem from '../components/TransactionItem'
import AmountInput from '../components/AmountInput'

const SOURCE_TYPES = [
  { value: 'savings', label: 'Tabungan' },
  { value: 'checking', label: 'Giro / Harian' },
  { value: 'cash', label: 'Tunai' },
  { value: 'e-wallet', label: 'Dompet Digital' },
  { value: 'other', label: 'Lainnya' },
]
const DEFAULT_COLORS = ['#1E6BB0', '#F5A623', '#2E7D32', '#7B1FA2', '#C62828', '#00695C']

function SourceCard({ source }) {
  const balance = useLiveQuery(() => getSourceBalance(source.id), [source.id])
  return (
    <div style={{
      background: 'rgba(255,255,255,0.1)',
      borderRadius: 14,
      padding: '12px 16px',
      minWidth: 140,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: source.color || 'rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#fff',
          flexShrink: 0,
        }}>
          {source.name.charAt(0).toUpperCase()}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-on-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {source.name}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-on-dark-muted)', marginBottom: 2 }}>
        {SOURCE_TYPES.find(t => t.value === source.type)?.label || source.type}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: (balance || 0) >= 0 ? 'var(--text-on-dark)' : '#F47A5A', fontVariantNumeric: 'tabular-nums' }}>
        {formatIDR(balance || 0)}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [showAddSource, setShowAddSource] = useState(false)
  const [srcName, setSrcName] = useState('')
  const [srcType, setSrcType] = useState('savings')
  const [srcColor, setSrcColor] = useState(DEFAULT_COLORS[0])
  const [srcInitial, setSrcInitial] = useState(0)
  const navigate = useNavigate()

  const allTxns = useLiveQuery(() => db.transactions.toArray(), [])
  const allSources = useLiveQuery(() => db.sources.toArray(), [])

  const totalBalance = (() => {
    const sources = allSources || []
    const txns = allTxns || []
    let bal = sources.reduce((sum, s) => sum + (s.initialBalance || 0), 0)
    for (const t of txns) {
      if (t.kind === 'income') bal += t.amount
      if (t.kind === 'expense') bal -= t.amount
    }
    return bal
  })()

  const monthTxns = (allTxns || []).filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === year && d.getMonth() === month
  })

  let income = 0, expense = 0
  for (const t of monthTxns) {
    if (t.kind === 'income') income += t.amount
    if (t.kind === 'expense') expense += t.amount
  }

  const recent = [...monthTxns]
    .sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt)
    .slice(0, 5)

  async function handleDeleteTxn(id) {
    if (confirm('Hapus transaksi ini?')) await db.transactions.delete(id)
  }

  async function handleAddSource() {
    if (!srcName.trim()) return
    await db.sources.add({ name: srcName.trim(), type: srcType, color: srcColor, initialBalance: srcInitial })
    setSrcName(''); setSrcType('savings'); setSrcColor(DEFAULT_COLORS[0]); setSrcInitial(0)
    setShowAddSource(false)
  }

  return (
    <div className="page">
      <div style={{
        background: 'var(--ground-dark)',
        paddingTop: 'calc(var(--safe-top) + 24px)',
        paddingBottom: 24,
        paddingInline: 24,
      }}>
        <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />

        <div style={{ marginTop: 28, marginBottom: 4, fontSize: 13, fontWeight: 500, color: 'var(--text-on-dark-muted)', letterSpacing: '0.06em' }}>
          TOTAL SALDO
        </div>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: totalBalance >= 1e10 ? 32 : totalBalance >= 1e9 ? 36 : 44,
          fontWeight: 600,
          color: totalBalance >= 0 ? 'var(--text-on-dark)' : '#F47A5A',
          lineHeight: 1.1,
          letterSpacing: '-0.5px',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {totalBalance < 0 ? '−' : ''}{formatIDR(Math.abs(totalBalance))}
        </div>

        <div style={{ marginTop: 6, marginBottom: 16, fontSize: 12, color: 'var(--text-on-dark-muted)' }}>Bulan ini</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, background: 'rgba(61,175,110,0.15)', borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 700, letterSpacing: '0.06em' }}>PEMASUKAN</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-on-dark)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{formatIDR(income)}</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(212,146,42,0.15)', borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--accent-gold)', fontWeight: 700, letterSpacing: '0.06em' }}>PENGELUARAN</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-on-dark)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{formatIDR(expense)}</div>
          </div>
        </div>

        {/* Source cards */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-on-dark-muted)' }}>AKUN</span>
          <button
            onClick={() => setShowAddSource(!showAddSource)}
            style={{ fontSize: 20, color: 'var(--text-on-dark-muted)', lineHeight: 1, padding: '0 4px' }}
            aria-label="Tambah akun"
          >
            {showAddSource ? '×' : '+'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginInline: -24, paddingInline: 24, paddingBottom: 4, scrollbarWidth: 'none' }}>
          {(allSources || []).map(s => <SourceCard key={s.id} source={s} />)}
          {(allSources || []).length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text-on-dark-muted)', paddingBlock: 12 }}>
              Belum ada akun. Ketuk + untuk menambahkan.
            </div>
          )}
        </div>

        {/* Add source inline form */}
        {showAddSource && (
          <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-on-dark-muted)' }}>Nama Akun</label>
              <input className="form-input" value={srcName} onChange={e => setSrcName(e.target.value)} placeholder="Contoh: BCA, GoPay..." autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-on-dark-muted)' }}>Jenis</label>
              <select className="form-input" value={srcType} onChange={e => setSrcType(e.target.value)}>
                {SOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-on-dark-muted)' }}>Saldo Awal</label>
              <AmountInput value={srcInitial} onChange={setSrcInitial} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DEFAULT_COLORS.map(c => (
                <button key={c} onClick={() => setSrcColor(c)} style={{
                  width: 28, height: 28, borderRadius: '50%', background: c, flexShrink: 0,
                  border: srcColor === c ? '3px solid #fff' : '2px solid transparent',
                  outline: srcColor === c ? '2px solid rgba(255,255,255,0.4)' : 'none',
                }} aria-label={c} />
              ))}
            </div>
            <button className="btn-primary" onClick={handleAddSource} disabled={!srcName.trim()}>Tambah Akun</button>
          </div>
        )}
      </div>

      <div style={{ height: 24, background: 'var(--ground-light)', marginTop: -1 }} />

      <div style={{ paddingInline: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span className="section-label" style={{ padding: 0 }}>Transaksi Terkini</span>
          <button onClick={() => navigate('/transactions')} style={{ fontSize: 13, color: 'var(--ground-dark)', fontWeight: 600 }}>Lihat semua</button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {recent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📒</div>
              <p>Belum ada transaksi bulan ini.<br />Ketuk + untuk menambahkan.</p>
            </div>
          ) : (
            recent.map((txn, i) => (
              <div key={txn.id}>
                {i > 0 && <div className="divider" />}
                <TransactionItem txn={txn} onDelete={handleDeleteTxn} />
              </div>
            ))
          )}
        </div>
      </div>

      <button className="fab" onClick={() => navigate('/add')} aria-label="Tambah transaksi">+</button>
    </div>
  )
}
