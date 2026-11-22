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
import { submitOrderApi, fetchOrderByCodeApi } from './services/api';
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
  const [selectedOrderCode, setSelectedOrderCode] = useState(null);
  const [ringNotification, setRingNotification] = useState(null);

  // 1 & 2. State activeOrders (array kode saja) & migrasi sekali jalan dari bluesukan_active_order
  const [activeOrders, setActiveOrders] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const migratedCodes = [];
      const legacy = localStorage.getItem('bluesukan_active_order');
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          if (parsed?.order_code) {
            migratedCodes.push(parsed.order_code);
          }
        } catch (e) {
          console.error('Failed to parse legacy active order', e);
        }
        localStorage.removeItem('bluesukan_active_order');
      }

      const saved = localStorage.getItem('bluesukan_active_orders');
      const existingCodes = saved ? JSON.parse(saved) : [];
      const combined = Array.from(new Set([...migratedCodes, ...existingCodes]));
      if (migratedCodes.length > 0) {
        localStorage.setItem('bluesukan_active_orders', JSON.stringify(combined));
      }
      return combined;
    } catch (err) {
      console.error('Failed to load active orders from localStorage', err);
      return [];
    }
  });

  // Map data pesanan: { [kode]: order }
  const [ordersMap, setOrdersMap] = useState({});

  const { showToast, clearCart } = useOrder();

  // Simpan activeOrders ke localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bluesukan_active_orders', JSON.stringify(activeOrders));
      } catch (err) {
        console.error('Failed to save active orders to localStorage', err);
      }
    }
  }, [activeOrders]);

  // 4. Saat aplikasi dibuka, ambil setiap kode di daftar. Hapus status completed, cancelled, atau 404
  useEffect(() => {
    if (!activeOrders || activeOrders.length === 0) return;

    let isMounted = true;
    const loadOrders = async () => {
      const validCodes = [];
      const newMap = {};

      for (const code of activeOrders) {
        try {
          const order = await fetchOrderByCodeApi(code);
          if (order && order.status !== 'completed' && order.status !== 'cancelled') {
            validCodes.push(code);
            newMap[code] = order;
          }
        } catch (err) {
          console.warn(`Pesanan ${code} tidak ditemukan atau sudah selesai:`, err);
        }
      }

      if (isMounted) {
        setOrdersMap((prev) => ({ ...prev, ...newMap }));
        if (validCodes.length !== activeOrders.length) {
          setActiveOrders(validCodes);
        }
      }
    };

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  // Ambil ulang satu pesanan secara penuh
  const refreshSingleOrder = async (orderCode) => {
    try {
      const freshOrder = await fetchOrderByCodeApi(orderCode);
      if (freshOrder) {
        if (freshOrder.status === 'completed' || freshOrder.status === 'cancelled') {
          setActiveOrders((prev) => prev.filter((c) => c !== orderCode));
          setOrdersMap((prev) => {
            const next = { ...prev };
            delete next[orderCode];
            return next;
          });
        } else {
          setOrdersMap((prev) => ({ ...prev, [orderCode]: freshOrder }));
        }
      }
    } catch (err) {
      console.error(`Failed to refresh order ${orderCode}:`, err);
      setActiveOrders((prev) => prev.filter((c) => c !== orderCode));
      setOrdersMap((prev) => {
        const next = { ...prev };
        delete next[orderCode];
        return next;
      });
    }
  };

  // Realtime SSE stream for active order status updates & ring customer alerts
  useEffect(() => {
    if (!activeOrders || activeOrders.length === 0) {
      return;
    }

    let eventSource = null;
    try {
      eventSource = new EventSource('/api/orders/stream');

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const eventCode = payload?.order_code;

          // Event SSE hanya memperbarui pesanan yang cocok dengan event.order_code
          if (!eventCode || !activeOrders.includes(eventCode)) {
            return;
          }

          // 1. Ring customer signal from Cashier POS
          if (payload?.type === 'RING_CUSTOMER') {
            playCustomerChime();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              try {
                navigator.vibrate([300, 150, 300, 150, 400]);
              } catch (_) {}
            }
            const targetOrder = ordersMap[eventCode];
            setRingNotification({
              order_code: eventCode,
              customer_name: payload.customer_name || targetOrder?.customer_name || '',
              table_number: payload.table_number || targetOrder?.table_number || '',
              timestamp: Date.now(),
            });
          }

          // 2. Order status / items update: hanya mengambil ulang pesanan yang cocok
          if (
            payload?.type === 'ORDER_UPDATED' ||
            payload?.type === 'STATUS_UPDATED' ||
            payload?.type === 'QRIS_CONFIRMED'
          ) {
            refreshSingleOrder(eventCode);
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
  }, [activeOrders, ordersMap]);

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

  // 3. handleProceedToCheckout: tambahkan kode pesanan baru ke daftar tanpa menimpa daftar
  const handleProceedToCheckout = async (orderPayload) => {
    try {
      setIsCartOpen(false);
      const createdOrder = await submitOrderApi(orderPayload);
      const code = createdOrder.order_code;

      setOrdersMap((prev) => ({ ...prev, [code]: createdOrder }));
      setActiveOrders((prev) => (prev.includes(code) ? prev : [...prev, code]));
      clearCart();
      showToast(`Pesanan ${code} berhasil dibuat!`, 'success');

      // Tampilkan tiket untuk pesanan baru ini
      setSelectedOrderCode(code);
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

  // 5. Dismiss satu pesanan hanya menghapus kode itu dari daftar
  const handleDismissActiveOrder = (orderCode) => {
    const codeToDismiss = orderCode || selectedOrderCode || activeOrders[0];
    if (!codeToDismiss) return;
    setActiveOrders((prev) => prev.filter((c) => c !== codeToDismiss));
    setOrdersMap((prev) => {
      const next = { ...prev };
      delete next[codeToDismiss];
      return next;
    });
    if (selectedOrderCode === codeToDismiss) {
      setSelectedOrderCode(null);
    }
  };

  const activeOrderList = activeOrders.map((code) => ordersMap[code]).filter(Boolean);
  const latestActiveOrder = activeOrderList[activeOrderList.length - 1] || null;
  const currentSelectedOrder = (selectedOrderCode && ordersMap[selectedOrderCode]) || latestActiveOrder;

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
            activeOrder={latestActiveOrder}
            onOpenTicketModal={() => {
              setSelectedOrderCode(null);
              setIsTicketModalOpen(true);
            }}
          />
        </div>
      ) : (
        /* 3. Default Cafe Landing Page (Homepage) with Active Order Integration */
        <HomePage
          onGoToMenu={handleGoToMenu}
          onGoToCashier={handleGoToCashier}
          activeOrder={latestActiveOrder}
          onOpenTicketModal={() => {
            setSelectedOrderCode(null);
            setIsTicketModalOpen(true);
          }}
          onDismissActiveOrder={handleDismissActiveOrder}
          onStatusChange={(newStatus) => {
            if (latestActiveOrder?.order_code) {
              setOrdersMap((prev) => ({
                ...prev,
                [latestActiveOrder.order_code]: { ...latestActiveOrder, status: newStatus },
              }));
            }
          }}
          onOpenCart={() => setIsCartOpen(true)}
        />
      )}

      {/* Customer Mode: Bottom Dock (Active Order Tracker + Floating Cart Bar) */}
      {appMode !== 'cashier' && (
        <div className="bottom-dock">
          {activeOrderList.length > 0 && (
            <ActiveOrderTracker
              orders={activeOrderList}
              order={latestActiveOrder}
              onOpenTicket={(targetOrder) => {
                if (targetOrder?.order_code) {
                  setSelectedOrderCode(targetOrder.order_code);
                } else if (latestActiveOrder?.order_code) {
                  setSelectedOrderCode(latestActiveOrder.order_code);
                }
                setIsTicketModalOpen(true);
              }}
              onOpenList={() => {
                setSelectedOrderCode(null);
                setIsTicketModalOpen(true);
              }}
              onDismiss={handleDismissActiveOrder}
              onStatusChange={(code, newStatus) => {
                if (newStatus === 'completed' || newStatus === 'cancelled') {
                  handleDismissActiveOrder(code);
                } else {
                  setOrdersMap((prev) =>
                    prev[code] ? { ...prev, [code]: { ...prev[code], status: newStatus } } : prev
                  );
                }
              }}
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

      {/* Global Digital Ticket & Active Orders Sheet Modal */}
      <ActiveOrderModal
        isOpen={isTicketModalOpen}
        onClose={() => {
          setIsTicketModalOpen(false);
          setSelectedOrderCode(null);
        }}
        orders={activeOrderList}
        order={currentSelectedOrder}
        selectedOrderCode={selectedOrderCode}
        onSelectOrderCode={(code) => setSelectedOrderCode(code)}
        onGoToMenu={handleGoToMenu}
        onOrderUpdate={(updated) => {
          if (updated?.order_code) {
            setOrdersMap((prev) => ({ ...prev, [updated.order_code]: updated }));
          }
        }}
        onCancelOrder={(cancelledOrder) => {
          const code = cancelledOrder?.order_code;
          if (code) {
            handleDismissActiveOrder(code);
          }
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
