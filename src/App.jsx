import { Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import AddTransaction from './pages/AddTransaction'
import Sources from './pages/Sources'
import Categories from './pages/Categories'
import Grocery from './pages/Grocery'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/add" element={<AddTransaction />} />
        <Route path="/sources" element={<Sources />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/grocery" element={<Grocery />} />
      </Routes>
      <BottomNav />
    </>
  )
}
