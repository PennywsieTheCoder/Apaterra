import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CatalogProvider } from './context/CatalogContext.jsx'
import { FavoritesProvider } from './context/FavoritesContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { BusinessSettingsProvider } from './context/BusinessSettingsContext.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import { initializeMonitoring } from './lib/monitoring'

initializeMonitoring()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <ToastProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AuthProvider>
            <CatalogProvider>
              <BusinessSettingsProvider>
                <FavoritesProvider>
                  <CartProvider>
                    <App />
                  </CartProvider>
                </FavoritesProvider>
              </BusinessSettingsProvider>
            </CatalogProvider>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
