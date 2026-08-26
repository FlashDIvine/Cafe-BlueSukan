import React, { useState, useEffect } from 'react';
import { OrderProvider } from './context/OrderContext';
import { useOrder } from './hooks/useOrder';
import { MenuPage } from './pages/MenuPage';
import { CartDrawer } from './components/CartDrawer';
import { OrderTicket } from './components/OrderTicket';
import { CashierPage } from './pages/CashierPage';
import { submitOrderApi } from './services/api';

function AppContent() {
  const [appMode, setAppMode] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#cashier' || window.location.pathname.includes('cashier')) {
        return 'cashier';
      }
    }
    return 'customer';
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const { showToast, clearCart } = useOrder();

  // Listen to hash changes (e.g. #cashier)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#cashier') {
        setAppMode('cashier');
      } else {
        setAppMode('customer');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);



  const handleProceedToCheckout = async (orderPayload) => {
    try {
      setIsCartOpen(false);
      // Submit order via API service
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
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh', minWidth: 0, overflowX: 'hidden' }}>
      {/* Main Content by Mode */}
      {appMode === 'cashier' ? (
        <CashierPage />
      ) : (
        <div className="app-container">
          {activeOrder ? (
            <OrderTicket order={activeOrder} onBackToMenu={handleBackToMenu} />
          ) : (
            <>
              <MenuPage onOpenCart={() => setIsCartOpen(true)} />
              <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                onProceedToCheckout={handleProceedToCheckout}
              />
            </>
          )}
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
