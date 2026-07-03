import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

export default function Grocery() {
  const [name, setName] = useState('')
  const items = useLiveQuery(() => db.groceries.orderBy('createdAt').reverse().toArray(), [])

  async function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) return
    await db.groceries.add({ name: trimmed, createdAt: Date.now() })
    setName('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd()
  }

  async function handleDelete(id) {
    await db.groceries.delete(id)
  }

  return (
    <div className="page">
      <div style={{ background: 'var(--ground-dark)', paddingTop: 'calc(var(--safe-top) + 20px)', paddingBottom: 20, paddingInline: 20 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--text-on-dark)', marginBottom: 14 }}>
          Daftar Belanja
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tambah item..."
            style={{ flex: 1 }}
          />
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            style={{
              padding: '12px 18px', borderRadius: 'var(--radius-sm)',
              background: name.trim() ? 'var(--accent-green)' : 'rgba(255,255,255,0.15)',
              color: '#fff', fontWeight: 700, fontSize: 20, lineHeight: 1,
              transition: 'background 0.15s',
            }}
            aria-label="Tambah"
          >
            +
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {(items || []).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <p>Daftar belanja kosong.<br />Ketik item dan tekan Enter.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {(items || []).map((item, i) => (
              <div key={item.id}>
                {i > 0 && <div className="divider" />}
                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 }}>
                  <span style={{ flex: 1, fontSize: 15 }}>{item.name}</span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{ color: 'var(--text-secondary)', fontSize: 20, padding: 4, lineHeight: 1 }}
                    aria-label="Hapus"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
