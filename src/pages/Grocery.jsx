import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { formatIDR } from '../utils/format'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function Grocery() {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [importItems, setImportItems] = useState(null)
  const [copied, setCopied] = useState(false)
  const [price, setPrice] = useState('')
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [sourceId, setSourceId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(todayStr())
  const [saving, setSaving] = useState(false)

  const raw = useLiveQuery(() => db.groceries.orderBy('createdAt').toArray(), [])
  const sources = useLiveQuery(() => db.sources.toArray(), [])
  const categories = useLiveQuery(() => db.categories.where('kind').equals('expense').toArray(), [])

  const items = raw ? [
    ...raw.filter(i => !i.checked).reverse(),
    ...raw.filter(i => i.checked).reverse(),
  ] : []

  useEffect(() => {
    const param = new URLSearchParams(location.search).get('g')
    if (!param) return
    try {
      const parsed = JSON.parse(decodeURIComponent(param))
      if (Array.isArray(parsed) && parsed.length > 0) setImportItems(parsed)
    } catch {}
    history.replaceState(null, '', location.pathname)
  }, [])

  async function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) return
    await db.groceries.add({
      name: trimmed,
      amount: amount.trim(),
      estimationPrice: Number(price) || 0,
      actualPrice: 0,
      checked: false,
      createdAt: Date.now(),
    })
    setName('')
    setAmount('')
    setPrice('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  async function handleActualPrice(item, value) {
    await db.groceries.update(item.id, { actualPrice: Number(value.replace(/\D/g, '')) || 0 })
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
    const payload = (raw || []).map(i => ({ name: i.name, amount: i.amount || '', estimationPrice: i.estimationPrice || 0 }))
    if (!payload.length) return
    const encoded = encodeURIComponent(JSON.stringify(payload))
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
      importItems.map((item, i) => ({
        name: typeof item === 'string' ? item : item.name,
        amount: typeof item === 'string' ? '' : (item.amount || ''),
        estimationPrice: typeof item === 'string' ? 0 : (Number(item.estimationPrice) || 0),
        actualPrice: 0,
        checked: false,
        createdAt: now + i,
      }))
    )
    setImportItems(null)
  }

  const hasItems = items.length > 0
  const totalEstimate = items.reduce((sum, i) => sum + (i.estimationPrice || 0), 0)
  const totalActual = items.reduce((sum, i) => sum + (i.actualPrice || 0), 0)

  async function handleSaveExpense() {
    if (!totalActual || !sourceId || !categoryId) return
    setSaving(true)
    await db.transactions.add({
      kind: 'expense',
      sourceId: parseInt(sourceId, 10),
      targetSourceId: null,
      categoryId: parseInt(categoryId, 10),
      amount: totalActual,
      date,
      note: `Belanja ${items.length} item`,
      createdAt: Date.now(),
    })
    await db.groceries.clear()
    setSaving(false)
    setExpenseOpen(false)
  }

  return (
    <div className="page">
      <div style={{ background: 'var(--ground-dark)', paddingTop: 'calc(var(--safe-top) + 20px)', paddingBottom: 20, paddingInline: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--text-on-dark)' }}>
            Daftar Belanja
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {hasItems && (
              <button onClick={handleShare} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-on-dark-muted)', background: 'rgba(255,255,255,0.12)', padding: '6px 12px', borderRadius: 8 }}>
                {copied ? '✓ Disalin' : '↗ Bagikan'}
              </button>
            )}
            {hasItems && (
              <button onClick={() => setConfirmClear(true)} style={{ fontSize: 12, fontWeight: 600, color: 'rgba(212,74,42,0.85)', background: 'rgba(212,74,42,0.15)', padding: '6px 12px', borderRadius: 8 }}>
                Hapus Semua
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
            <input
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nama item..."
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Jumlah"
                style={{ flex: 1, minWidth: 0 }}
              />
              <input
                className="form-input"
                type="number"
                inputMode="numeric"
                value={price}
                onChange={e => setPrice(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Perkiraan harga"
                style={{ flex: 1.4, minWidth: 0 }}
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            style={{
              padding: '12px 18px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
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
                  <div onClick={() => handleToggle(item)} style={{ flex: 1, cursor: 'pointer' }}>
                    <span style={{
                      fontSize: 15,
                      textDecoration: item.checked ? 'line-through' : 'none',
                      color: item.checked ? 'var(--text-secondary)' : 'var(--text-primary)',
                      transition: 'color 0.15s',
                    }}>
                      {item.name}
                    </span>
                    {item.amount ? (
                      <span style={{
                        marginLeft: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        color: item.checked ? 'var(--text-secondary)' : 'var(--accent-gold)',
                        textDecoration: item.checked ? 'line-through' : 'none',
                      }}>
                        {item.amount}
                      </span>
                    ) : null}
                    {item.estimationPrice ? (
                      <div style={{
                        fontSize: 13,
                        marginTop: 2,
                        color: 'var(--text-secondary)',
                        textDecoration: item.checked ? 'line-through' : 'none',
                      }}>
                        {formatIDR(item.estimationPrice)}
                      </div>
                    ) : null}
                  </div>
                  <input
                    className="form-input"
                    inputMode="numeric"
                    value={item.actualPrice ? item.actualPrice.toLocaleString('id-ID') : ''}
                    onChange={e => handleActualPrice(item, e.target.value)}
                    placeholder="Harga asli"
                    style={{ width: 104, flexShrink: 0, padding: '8px 10px', fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                    aria-label={`Harga asli ${item.name}`}
                  />
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
            {(totalEstimate > 0 || totalActual > 0) && (
              <>
                <div className="divider" />
                <div style={{ padding: '14px 16px', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {totalEstimate > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Total perkiraan</span>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{formatIDR(totalEstimate)}</span>
                    </div>
                  )}
                  {totalActual > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Total belanja</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-green)' }}>{formatIDR(totalActual)}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {totalActual > 0 && (
          <button
            className="btn-primary"
            onClick={() => setExpenseOpen(true)}
            style={{ marginTop: 16 }}
          >
            Catat sebagai pengeluaran
          </button>
        )}
      </div>

      {/* Record as expense */}
      {expenseOpen && (
        <div onClick={() => setExpenseOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0', padding: '24px 24px calc(24px + var(--nav-height) + var(--safe-bottom))', width: '100%', maxWidth: 480 }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Catat sebagai pengeluaran</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              {formatIDR(totalActual)} dari {items.length} item. Daftar belanja akan dikosongkan setelah disimpan.
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Sumber Dana</label>
              <select className="form-input" value={sourceId} onChange={e => setSourceId(e.target.value)}>
                <option value="">Pilih sumber...</option>
                {(sources || []).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Kategori</label>
              <select className="form-input" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                <option value="">Pilih kategori...</option>
                {(categories || []).map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Tanggal</label>
              <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} max={todayStr()} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setExpenseOpen(false)} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', fontWeight: 600, fontSize: 15 }}>Batal</button>
              <button
                onClick={handleSaveExpense}
                disabled={!sourceId || !categoryId || saving}
                style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-sm)', background: sourceId && categoryId ? 'var(--accent-green)' : 'var(--surface-2)', color: sourceId && categoryId ? '#fff' : 'var(--text-secondary)', fontWeight: 600, fontSize: 15 }}
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import prompt */}
      {importItems && (
        <div onClick={() => setImportItems(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0', padding: '24px 24px calc(24px + var(--nav-height) + var(--safe-bottom))', width: '100%', maxWidth: 480 }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Impor daftar belanja?</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
              {importItems.length} item akan ditambahkan ke daftar kamu:
            </div>
            <div style={{ maxHeight: 160, overflowY: 'auto', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {importItems.map((item, i) => {
                const n = typeof item === 'string' ? item : item.name
                const a = typeof item === 'string' ? '' : item.amount
                const p = typeof item === 'string' ? 0 : Number(item.estimationPrice) || 0
                return (
                  <div key={i} style={{ fontSize: 14, padding: '6px 10px', background: 'var(--surface-2)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span>{n}</span>
                    <span style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      {a && <span style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{a}</span>}
                      {p > 0 && <span style={{ color: 'var(--text-secondary)' }}>{formatIDR(p)}</span>}
                    </span>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setImportItems(null)} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', fontWeight: 600, fontSize: 15 }}>Batal</button>
              <button onClick={handleImport} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-sm)', background: 'var(--ground-dark)', color: '#fff', fontWeight: 600, fontSize: 15 }}>Impor</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm clear modal */}
      {confirmClear && (
        <div onClick={() => setConfirmClear(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0', padding: '24px 24px calc(24px + var(--nav-height) + var(--safe-bottom))', width: '100%', maxWidth: 480 }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Hapus semua item?</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Seluruh daftar belanja akan dihapus dan tidak bisa dikembalikan.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmClear(false)} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', fontWeight: 600, fontSize: 15 }}>Batal</button>
              <button onClick={handleClearAll} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-sm)', background: 'var(--accent-red)', color: '#fff', fontWeight: 600, fontSize: 15 }}>Hapus Semua</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
