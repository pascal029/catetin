import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Beranda', icon: '◉' },
  { to: '/transactions', label: 'Transaksi', icon: '↕' },
  { to: '/categories', label: 'Kategori', icon: '⊞' },
]

export default function BottomNav() {
  return (
    <nav style={{
      display: 'flex',
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      paddingBottom: 'var(--safe-bottom)',
      height: 'calc(var(--nav-height) + var(--safe-bottom))',
      position: 'sticky',
      bottom: 0,
      zIndex: 20,
    }}>
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: isActive ? 'var(--ground-dark)' : 'var(--text-secondary)',
            transition: 'color 0.15s',
          })}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
