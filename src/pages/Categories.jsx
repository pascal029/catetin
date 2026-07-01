import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

const COMMON_ICONS = ['🛒','🍜','🚗','📄','🎉','💊','✈️','📚','🎮','👗','💡','🏠','💼','💻','🎁','💰','📈','🏧']

function AddCategoryForm({ kind, onDone }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📦')

  async function handleAdd() {
    if (!name.trim()) return
    await db.categories.add({ name: name.trim(), kind, icon })
    onDone()
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="form-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nama kategori..."
          autoFocus
          style={{ flex: 1 }}
        />
        <button className="btn-primary" onClick={handleAdd} disabled={!name.trim()} style={{ width: 'auto', padding: '12px 20px' }}>
          Tambah
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {COMMON_ICONS.map(em => (
          <button
            key={em}
            onClick={() => setIcon(em)}
            style={{ fontSize: 22, padding: 4, borderRadius: 8, background: icon === em ? 'var(--surface-2)' : 'transparent', border: icon === em ? '2px solid var(--ground-dark)' : '2px solid transparent' }}
          >
            {em}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Ikon dipilih: {icon}</div>
    </div>
  )
}

function CategorySection({ kind, label }) {
  const [adding, setAdding] = useState(false)
  const cats = useLiveQuery(() => db.categories.where('kind').equals(kind).toArray(), [kind])

  async function handleDelete(cat) {
    const count = await db.transactions.where('categoryId').equals(cat.id).count()
    const msg = count > 0
      ? `Kategori "${cat.name}" digunakan di ${count} transaksi. Hapus?`
      : `Hapus kategori "${cat.name}"?`
    if (confirm(msg)) await db.categories.delete(cat.id)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 8 }}>
        <span className="section-label" style={{ padding: 0 }}>{label}</span>
        <button onClick={() => setAdding(!adding)} style={{ fontSize: 13, color: 'var(--ground-dark)', fontWeight: 600 }}>
          {adding ? 'Batal' : '+ Tambah'}
        </button>
      </div>

      <div style={{ paddingInline: 16 }}>
        {adding && <AddCategoryForm kind={kind} onDone={() => setAdding(false)} />}

        {(cats || []).length === 0 && !adding ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 16px', fontSize: 14 }}>
            Belum ada kategori.
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: adding ? 8 : 0 }}>
            {(cats || []).map((cat, i) => (
              <div key={cat.id}>
                {i > 0 && <div className="divider" />}
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12 }}>
                  <span style={{ fontSize: 22 }}>{cat.icon}</span>
                  <span style={{ flex: 1, fontWeight: 500, fontSize: 15 }}>{cat.name}</span>
                  <button onClick={() => handleDelete(cat)} style={{ color: 'var(--accent-red)', fontSize: 18, padding: 4 }} aria-label="Hapus">×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Categories() {
  return (
    <div className="page">
      <div style={{ background: 'var(--ground-dark)', paddingTop: 'calc(var(--safe-top) + 20px)', paddingBottom: 20, paddingInline: 20 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--text-on-dark)' }}>Kategori</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 20 }}>
        <CategorySection kind="income" label="Pemasukan" />
        <CategorySection kind="expense" label="Pengeluaran" />
      </div>
    </div>
  )
}
