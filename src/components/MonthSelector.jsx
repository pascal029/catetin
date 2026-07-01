import { monthLabel } from '../utils/format'

export default function MonthSelector({ year, month, onChange }) {
  function prev() {
    if (month === 0) onChange(year - 1, 11)
    else onChange(year, month - 1)
  }
  function next() {
    const now = new Date()
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth())) return
    if (month === 11) onChange(year + 1, 0)
    else onChange(year, month + 1)
  }

  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={prev} style={{ color: 'var(--text-on-dark-muted)', fontSize: 20, padding: '4px 8px' }}>‹</button>
      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 15, color: 'var(--text-on-dark)', minWidth: 140, textAlign: 'center' }}>
        {monthLabel(year, month)}
      </span>
      <button
        onClick={next}
        disabled={isCurrentMonth}
        style={{ color: isCurrentMonth ? 'var(--text-on-dark-muted)' : 'var(--text-on-dark-muted)', fontSize: 20, padding: '4px 8px', opacity: isCurrentMonth ? 0.3 : 1 }}
      >
        ›
      </button>
    </div>
  )
}
