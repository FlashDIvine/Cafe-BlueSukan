import React, { useState, useEffect, lazy, Suspense } from 'react';
import { OrderProvider } from './context/OrderContext';
import { useOrder } from './hooks/useOrder';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { CartDrawer } from './components/CartDrawer';
import { submitOrderApi } from './services/api';

const CashierPage = lazy(() =>
  import('./pages/CashierPage').then((m) => ({ default: m.CashierPage }))
);
const OrderTicket = lazy(() =>
  import('./components/OrderTicket').then((m) => ({ default: m.OrderTicket }))
);

const PageLoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--color-primary)' }}>
    <div style={{ width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTopColor: 'var(--color-royal-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

function AppContent() {
  const [appMode, setAppMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      if (hash === '#cashier' || window.location.pathname.includes('cashier')) {
        return 'cashier';
      }
      if (hash === '#menu' || search.includes('table=')) {
        return 'menu';
      }
    }
    return 'home';
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const { showToast, clearCart } = useOrder();

  // Listen to browser hash changes (e.g. #cashier, #menu, #home)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#cashier') {
        setAppMode('cashier');
      } else if (hash === '#menu') {
        setAppMode('menu');
      } else if (hash === '#home' || hash === '' || hash === '#') {
        if (!window.location.search.includes('table=')) {
          setAppMode('home');
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleGoToMenu = () => {
    setActiveOrder(null);
    setAppMode('menu');
    window.location.hash = '#menu';
  };

  const handleGoToHome = () => {
    setActiveOrder(null);
    clearCart();
    setAppMode('home');
    if (window.location.hash) {
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch {
        window.location.hash = '';
      }
    }
  };

  const handleGoToCashier = () => {
    setAppMode('cashier');
    window.location.hash = '#cashier';
  };

  const handleProceedToCheckout = async (orderPayload) => {
    try {
      setIsCartOpen(false);
      const createdOrder = await submitOrderApi(orderPayload);
      setActiveOrder(createdOrder);
      clearCart();
      showToast(`Pesanan ${createdOrder.order_code} berhasil dibuat!`, 'success');
    } catch (err) {
      console.error('Failed to submit order:', err);
      showToast(err.message || 'Terjadi kesalahan saat memproses pesanan.', 'warning');
    }
  };

  const handleBackToMenu = () => {
    setActiveOrder(null);
    setAppMode('menu');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh', minWidth: 0, overflowX: 'hidden' }}>
      {/* 1. Cashier Dashboard Mode */}
      {appMode === 'cashier' ? (
        <Suspense fallback={<PageLoadingFallback />}>
          <CashierPage />
        </Suspense>
      ) : appMode === 'menu' ? (
        /* 2. Customer Self-Order Menu Mode */
        <div className="app-container">
          {activeOrder ? (
            <Suspense fallback={<PageLoadingFallback />}>
              <OrderTicket
                order={activeOrder}
                onBackToMenu={handleBackToMenu}
                onGoHome={handleGoToHome}
              />
            </Suspense>
          ) : (
            <>
              <MenuPage
                onOpenCart={() => setIsCartOpen(true)}
                onGoHome={handleGoToHome}
              />
              <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                onProceedToCheckout={handleProceedToCheckout}
              />
            </>
          )}
        </div>
      ) : (
        /* 3. Default Cafe Landing Page (Homepage) */
        <HomePage
          onGoToMenu={handleGoToMenu}
          onGoToCashier={handleGoToCashier}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <OrderProvider>
      <AppContent />
    </OrderProvider>
  );
}

export default App;
