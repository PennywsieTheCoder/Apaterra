import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import BackToTop from './components/BackToTop'
import CartDrawer from './components/CartDrawer'
import Footer, { CompactFooter } from './components/Footer'
import Header from './components/Header'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'
import HairNeedsPage from './pages/HairNeedsPage'
import ProductPage from './pages/ProductPage'
import RoutinesPage from './pages/RoutinesPage'
import ShopPage from './pages/ShopPage'
import StoryPage from './pages/StoryPage'
import CheckoutPage from './pages/CheckoutPage'
import AccountPage from './pages/AccountPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'

function App() {
  const { pathname } = useLocation()

  return (
    <div className="site-shell">
      <ScrollToTop />
      {pathname !== '/login' && <Header />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/products/:productId" element={<ProductPage />} />
        <Route path="/routines" element={<RoutinesPage />} />
        <Route path="/hair-needs" element={<HairNeedsPage />} />
        <Route path="/story" element={<StoryPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {pathname === '/account' && <CompactFooter />}
      {pathname !== '/account' && pathname !== '/checkout' && pathname !== '/login' && <Footer />}
      {pathname !== '/login' && <BackToTop />}
      <CartDrawer />
    </div>
  )
}

export default App
