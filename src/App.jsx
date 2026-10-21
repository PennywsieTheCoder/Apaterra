import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import BackToTop from './components/BackToTop'
import CartDrawer from './components/CartDrawer'
import Footer from './components/Footer'
import Header from './components/Header'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
import RouteSkeleton from './components/RouteSkeleton'

const HomePage = lazy(() => import('./pages/HomePage'))
const HairNeedsPage = lazy(() => import('./pages/HairNeedsPage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const RoutinesPage = lazy(() => import('./pages/RoutinesPage'))
const ShopPage = lazy(() => import('./pages/ShopPage'))
const StoryPage = lazy(() => import('./pages/StoryPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

function App() {
  const { pathname } = useLocation()

  return (
    <div className="site-shell">
      <ScrollToTop />
      {pathname !== '/login' && <Header />}
      <Suspense fallback={<RouteSkeleton pathname={pathname} />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/products/:productId" element={<ProductPage />} />
          <Route path="/routines" element={<RoutinesPage />} />
          <Route path="/hair-needs" element={<HairNeedsPage />} />
          <Route path="/story" element={<StoryPage />} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      {pathname !== '/account' && pathname !== '/checkout' && pathname !== '/login' && pathname !== '/admin' && <Footer />}
      {pathname !== '/login' && <BackToTop />}
      <CartDrawer />
    </div>
  )
}

export default App
