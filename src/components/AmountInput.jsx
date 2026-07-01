import { useState } from 'react'

// Displays IDR-formatted value while keeping raw number for form state
export default function AmountInput({ value, onChange, placeholder = '0' }) {
  const [raw, setRaw] = useState(value ? String(value) : '')

  function handle(e) {
    const digits = e.target.value.replace(/\D/g, '')
    setRaw(digits)
    onChange(digits ? parseInt(digits, 10) : 0)
  }

  const display = raw ? parseInt(raw, 10).toLocaleString('id-ID') : ''

  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        fontSize: 16, color: 'var(--text-secondary)', pointerEvents: 'none',
      }}>Rp</span>
      <input
        className="form-input"
        inputMode="numeric"
        value={display}
        onChange={handle}
        placeholder={placeholder}
        style={{ paddingLeft: 40, fontVariantNumeric: 'tabular-nums' }}
      />
    </div>
  )
}
