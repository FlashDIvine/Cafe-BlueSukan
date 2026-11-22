import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Bell } from 'lucide-react';
import { OrderProvider } from './context/OrderContext';
import { useOrder } from './hooks/useOrder';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { CartDrawer } from './components/CartDrawer';
import { ActiveOrderModal } from './components/ActiveOrderModal';
import { ActiveOrderTracker } from './components/ActiveOrderTracker';
import { FloatingCartBar } from './components/FloatingCartBar';
import { submitOrderApi } from './services/api';
import { playCustomerChime } from './utils/bellSound';
import { formatLocationDisplay } from './utils/formatters';

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
  const [ringNotification, setRingNotification] = useState(null);

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

  // Realtime SSE stream for active order status updates & ring customer alerts
  useEffect(() => {
    if (!activeOrder?.order_code || activeOrder.status === 'cancelled') {
      return;
    }

    let eventSource = null;
    try {
      eventSource = new EventSource('/api/orders/stream');

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          // 1. Ring customer signal from Cashier POS
          if (payload?.type === 'RING_CUSTOMER' && payload.order_code === activeOrder.order_code) {
            playCustomerChime();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              try {
                navigator.vibrate([300, 150, 300, 150, 400]);
              } catch (_) {}
            }
            setRingNotification({
              order_code: payload.order_code,
              customer_name: payload.customer_name || activeOrder.customer_name,
              table_number: payload.table_number || activeOrder.table_number,
              timestamp: Date.now(),
            });
          }

          // 2. Order status update / QRIS confirmation
          if (
            payload?.order_code === activeOrder.order_code &&
            payload?.status &&
            payload.status !== activeOrder.status
          ) {
            setActiveOrder((prev) => (prev ? { ...prev, status: payload.status } : prev));
          }
        } catch {
          // Heartbeat or malformed comment
        }
      };

      eventSource.onerror = () => {
        // Auto-reconnect silently
      };
    } catch (err) {
      console.warn('Failed to initialize SSE EventSource in App:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [activeOrder?.order_code, activeOrder?.status]);

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
          onOpenCart={() => setIsCartOpen(true)}
        />
      )}

      {/* Customer Mode: Bottom Dock (Active Order Tracker + Floating Cart Bar) */}
      {appMode !== 'cashier' && (
        <div className="bottom-dock">
          {activeOrder && (
            <ActiveOrderTracker
              order={activeOrder}
              onOpenTicket={() => setIsTicketModalOpen(true)}
              onDismiss={handleDismissActiveOrder}
              onStatusChange={handleOrderStatusChange}
            />
          )}
          <FloatingCartBar onOpenCart={() => setIsCartOpen(true)} />
        </div>
      )}

      {/* Customer Cart Drawer (available in both Home & Menu modes) */}
      {appMode !== 'cashier' && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onProceedToCheckout={handleProceedToCheckout}
        />
      )}

      {/* Global Digital Ticket & QR Code Modal */}
      <ActiveOrderModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        order={activeOrder}
        onGoToMenu={handleGoToMenu}
        onCancelOrder={(cancelledOrder) => {
          setActiveOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : cancelledOrder));
        }}
      />

      {/* Prominent Ring Customer Notification Dialog (Bell Chime & Vibrate alert from Cashier/Barista) */}
      {ringNotification && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(6px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface, #FBF7EF)',
              border: '2px solid var(--accent-amber, #C96A2B)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '380px',
              padding: '28px 22px 22px',
              textAlign: 'center',
              boxShadow: '0 25px 35px -5px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                backgroundColor: '#FEF3C7',
                border: '2.5px solid #F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-amber, #C96A2B)',
                boxShadow: '0 0 25px rgba(201, 106, 43, 0.4)',
              }}
            >
              <Bell size={36} />
            </div>

            <div>
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: '19px',
                  fontWeight: '800',
                  color: 'var(--brand-navy, #1B3B64)',
                  fontFamily: 'var(--font-display, serif)',
                }}
              >
                Panggilan dari Kasir / Pelayan!
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '13.5px',
                  color: 'var(--text-secondary, #5A4D41)',
                  lineHeight: 1.55,
                }}
              >
                Pesanan <strong>{ringNotification.order_code}</strong> atas nama{' '}
                <strong>{ringNotification.customer_name}</strong> siap diambil / sedang diantar menuju area{' '}
                <strong>{formatLocationDisplay(ringNotification.table_number)}</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setRingNotification(null)}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '13px 20px',
                backgroundColor: 'var(--accent-amber, #C96A2B)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(201, 106, 43, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              Oke, Mengerti
            </button>
          </div>
        </div>
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
