import Dexie from 'dexie'

export const db = new Dexie('keuangan')

db.version(1).stores({
  sources: '++id, name, type, color',
  categories: '++id, name, kind, icon',
  transactions: '++id, kind, sourceId, targetSourceId, categoryId, amount, date, note, createdAt',
})

db.version(2).stores({
  sources: '++id, name, type, color',
  categories: '++id, name, kind, icon',
  transactions: '++id, kind, sourceId, targetSourceId, categoryId, amount, date, note, createdAt',
  groceries: '++id, name, createdAt',
})

// Seed default data on first open.
// ponytail: .then() instead of async/await — async breaks Dexie's transaction zone in populate hooks
db.on('populate', () =>
  db.categories.bulkAdd([
    { name: 'Gaji', kind: 'income', icon: '💼' },
    { name: 'Freelance', kind: 'income', icon: '💻' },
    { name: 'Belanja', kind: 'expense', icon: '🛒' },
    { name: 'Makan', kind: 'expense', icon: '🍜' },
    { name: 'Transportasi', kind: 'expense', icon: '🚗' },
    { name: 'Tagihan', kind: 'expense', icon: '📄' },
  ])
)

export async function getSourceBalance(sourceId) {
  const [source, txns] = await Promise.all([
    db.sources.get(sourceId),
    db.transactions.toArray(),
  ])
  let balance = source?.initialBalance || 0
  for (const t of txns) {
    if (t.kind === 'income' && t.sourceId === sourceId) balance += t.amount
    if (t.kind === 'expense' && t.sourceId === sourceId) balance -= t.amount
    if (t.kind === 'transfer' && t.sourceId === sourceId) balance -= t.amount
    if (t.kind === 'transfer' && t.targetSourceId === sourceId) balance += t.amount
  }
  return balance
}

export async function getMonthSummary(year, month) {
  const txns = await db.transactions.toArray()
  let income = 0
  let expense = 0
  for (const t of txns) {
    const d = new Date(t.date)
    if (d.getFullYear() !== year || d.getMonth() !== month) continue
    if (t.kind === 'income') income += t.amount
    if (t.kind === 'expense') expense += t.amount
  }
  return { income, expense, net: income - expense }
}

export async function getRecentTransactions(year, month, limit = 5) {
  const txns = await db.transactions.toArray()
  return txns
    .filter(t => {
      const d = new Date(t.date)
      return d.getFullYear() === year && d.getMonth() === month
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt)
    .slice(0, limit)
}
