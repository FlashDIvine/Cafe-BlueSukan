import React, { useState, useEffect, lazy, Suspense } from 'react';
import { OrderProvider } from './context/OrderContext';
import { useOrder } from './hooks/useOrder';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { CartDrawer } from './components/CartDrawer';
import { ActiveOrderModal } from './components/ActiveOrderModal';
import { submitOrderApi } from './services/api';

const CashierPage = lazy(() =>
  import('./pages/CashierPage').then((m) => ({ default: m.CashierPage }))
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
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Initialize activeOrder from localStorage for persistent tracking
  const [activeOrder, setActiveOrder] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('bluesukan_active_order');
        if (saved) return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to load active order from localStorage', err);
      }
    }
    return null;
  });

  const { showToast, clearCart } = useOrder();

  // Sync activeOrder changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (activeOrder) {
          localStorage.setItem('bluesukan_active_order', JSON.stringify(activeOrder));
        } else {
          localStorage.removeItem('bluesukan_active_order');
        }
      } catch (err) {
        console.error('Failed to save active order to localStorage', err);
      }
    }
  }, [activeOrder]);

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
    // Preserve activeOrder so customer can track their order or add additional items
    setAppMode('menu');
    window.location.hash = '#menu';
  };

  const handleGoToHome = () => {
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

  // Submit order & immediately transition back to Beranda (HomePage) with Ticket automatically opened
  const handleProceedToCheckout = async (orderPayload) => {
    try {
      setIsCartOpen(false);
      const createdOrder = await submitOrderApi(orderPayload);
      setActiveOrder(createdOrder);
      clearCart();
      showToast(`Pesanan ${createdOrder.order_code} berhasil dibuat!`, 'success');

      // Direct transition to Beranda (HomePage) & automatically open Digital Ticket modal
      setAppMode('home');
      setIsTicketModalOpen(true);
      if (window.location.hash) {
        try {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch {
          window.location.hash = '';
        }
      }
    } catch (err) {
      console.error('Failed to submit order:', err);
      showToast(err.message || 'Terjadi kesalahan saat memproses pesanan.', 'warning');
    }
  };

  const handleDismissActiveOrder = () => {
    setActiveOrder(null);
  };

  const handleOrderStatusChange = (newStatus) => {
    setActiveOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
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
          <MenuPage
            onOpenCart={() => setIsCartOpen(true)}
            onGoHome={handleGoToHome}
            activeOrder={activeOrder}
            onOpenTicketModal={() => setIsTicketModalOpen(true)}
          />
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            onProceedToCheckout={handleProceedToCheckout}
          />
        </div>
      ) : (
        /* 3. Default Cafe Landing Page (Homepage) with Active Order Integration */
        <HomePage
          onGoToMenu={handleGoToMenu}
          onGoToCashier={handleGoToCashier}
          activeOrder={activeOrder}
          onOpenTicketModal={() => setIsTicketModalOpen(true)}
          onDismissActiveOrder={handleDismissActiveOrder}
          onStatusChange={handleOrderStatusChange}
        />
      )}

      {/* Global Digital Ticket & QR Code Modal */}
      <ActiveOrderModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        order={activeOrder}
        onGoToMenu={handleGoToMenu}
      />
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
