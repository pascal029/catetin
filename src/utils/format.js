export function formatIDR(amount) {
  const abs = Math.abs(Math.round(amount))
  const formatted = abs.toLocaleString('id-ID')
  return `Rp ${formatted}`
}

export function formatIDRSigned(amount) {
  const sign = amount < 0 ? '−' : '+'
  return `${sign} ${formatIDR(amount)}`
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })
}
