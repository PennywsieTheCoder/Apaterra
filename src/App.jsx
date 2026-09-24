import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import CartDrawer from './components/CartDrawer'
import Footer from './components/Footer'
import Header from './components/Header'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'
import HairNeedsPage from './pages/HairNeedsPage'
import ProductPage from './pages/ProductPage'
import RoutinesPage from './pages/RoutinesPage'
import ShopPage from './pages/ShopPage'
import StoryPage from './pages/StoryPage'

function App() {
  return (
    <div className="site-shell">
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/products/:productId" element={<ProductPage />} />
        <Route path="/routines" element={<RoutinesPage />} />
        <Route path="/hair-needs" element={<HairNeedsPage />} />
        <Route path="/story" element={<StoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
      <CartDrawer />
    </div>
  )
}

export default App
