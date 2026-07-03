import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

export default function Grocery() {
  const [name, setName] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [importItems, setImportItems] = useState(null) // array of names to import
  const [copied, setCopied] = useState(false)

  const raw = useLiveQuery(() => db.groceries.orderBy('createdAt').toArray(), [])

  // unchecked first (newest first), checked last (newest first)
  const items = raw ? [
    ...raw.filter(i => !i.checked).reverse(),
    ...raw.filter(i => i.checked).reverse(),
  ] : []

  // Detect ?g= import param on mount
  useEffect(() => {
    const param = new URLSearchParams(location.search).get('g')
    if (!param) return
    try {
      const names = JSON.parse(decodeURIComponent(param))
      if (Array.isArray(names) && names.length > 0) setImportItems(names)
    } catch {}
    // Clean URL without reloading
    history.replaceState(null, '', location.pathname)
  }, [])

  async function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) return
    await db.groceries.add({ name: trimmed, checked: false, createdAt: Date.now() })
    setName('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd()
  }

  async function handleToggle(item) {
    await db.groceries.update(item.id, { checked: !item.checked })
  }

  async function handleDelete(id) {
    await db.groceries.delete(id)
  }

  async function handleClearAll() {
    await db.groceries.clear()
    setConfirmClear(false)
  }

  async function handleShare() {
    const names = (raw || []).map(i => i.name)
    if (!names.length) return
    const encoded = encodeURIComponent(JSON.stringify(names))
    const url = `${location.origin}/grocery?g=${encoded}`
    if (navigator.share) {
      await navigator.share({ title: 'Daftar Belanja', url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleImport() {
    const now = Date.now()
    await db.groceries.bulkAdd(
      importItems.map((name, i) => ({ name, checked: false, createdAt: now + i }))
    )
    setImportItems(null)
  }

  const hasItems = items.length > 0

  return (
    <div className="page">
      <div style={{ background: 'var(--ground-dark)', paddingTop: 'calc(var(--safe-top) + 20px)', paddingBottom: 20, paddingInline: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--text-on-dark)' }}>
            Daftar Belanja
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {hasItems && (
              <button
                onClick={handleShare}
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-on-dark-muted)', background: 'rgba(255,255,255,0.12)', padding: '6px 12px', borderRadius: 8 }}
              >
                {copied ? '✓ Disalin' : '↗ Bagikan'}
              </button>
            )}
            {hasItems && (
              <button
                onClick={() => setConfirmClear(true)}
                style={{ fontSize: 12, fontWeight: 600, color: 'rgba(212,74,42,0.85)', background: 'rgba(212,74,42,0.15)', padding: '6px 12px', borderRadius: 8 }}
              >
                Hapus Semua
              </button>
            )}
          </div>
        </div>
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
        {!hasItems ? (
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <p>Daftar belanja kosong.<br />Ketik item dan tekan Enter.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {items.map((item, i) => (
              <div key={item.id}>
                {i > 0 && <div className="divider" />}
                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 }}>
                  <span
                    onClick={() => handleToggle(item)}
                    style={{
                      flex: 1, fontSize: 15, cursor: 'pointer',
                      textDecoration: item.checked ? 'line-through' : 'none',
                      color: item.checked ? 'var(--text-secondary)' : 'var(--text-primary)',
                      transition: 'color 0.15s',
                    }}
                  >
                    {item.name}
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{ color: 'var(--text-secondary)', fontSize: 20, padding: 4, lineHeight: 1, flexShrink: 0 }}
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

      {/* Import prompt */}
      {importItems && (
        <div
          onClick={() => setImportItems(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0', padding: '24px 24px calc(24px + var(--safe-bottom))', width: '100%', maxWidth: 480 }}
          >
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Impor daftar belanja?</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
              {importItems.length} item akan ditambahkan ke daftar kamu:
            </div>
            <div style={{ maxHeight: 160, overflowY: 'auto', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {importItems.map((n, i) => (
                <div key={i} style={{ fontSize: 14, padding: '6px 10px', background: 'var(--surface-2)', borderRadius: 8 }}>{n}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setImportItems(null)}
                style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', fontWeight: 600, fontSize: 15 }}
              >
                Batal
              </button>
              <button
                onClick={handleImport}
                style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-sm)', background: 'var(--ground-dark)', color: '#fff', fontWeight: 600, fontSize: 15 }}
              >
                Impor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm clear modal */}
      {confirmClear && (
        <div
          onClick={() => setConfirmClear(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0', padding: '24px 24px calc(24px + var(--safe-bottom))', width: '100%', maxWidth: 480 }}
          >
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Hapus semua item?</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Seluruh daftar belanja akan dihapus dan tidak bisa dikembalikan.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmClear(false)}
                style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', fontWeight: 600, fontSize: 15 }}
              >
                Batal
              </button>
              <button
                onClick={handleClearAll}
                style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-sm)', background: 'var(--accent-red)', color: '#fff', fontWeight: 600, fontSize: 15 }}
              >
                Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
