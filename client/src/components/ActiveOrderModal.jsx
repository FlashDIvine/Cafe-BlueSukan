import React, { useEffect, Suspense, lazy } from 'react';
import '../styles/active-order-tracker.css';

const OrderTicket = lazy(() =>
  import('./OrderTicket').then((m) => ({ default: m.OrderTicket }))
);

const ModalLoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '280px' }}>
    <div
      style={{
        width: '32px',
        height: '32px',
        border: '3px solid #E2E8F0',
        borderTopColor: 'var(--color-royal-blue)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  </div>
);

export const ActiveOrderModal = ({ isOpen, onClose, order, onGoToMenu, onCancelOrder, onOrderUpdate }) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  return (
    <div
      className="ticket-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-title"
    >
      <div
        className="ticket-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        <Suspense fallback={<ModalLoadingFallback />}>
          <OrderTicket
            order={order}
            onBackToMenu={() => {
              onClose();
              if (onGoToMenu) onGoToMenu();
            }}
            onGoHome={onClose}
            onClose={onClose}
            onCancelOrder={onCancelOrder}
            onOrderUpdate={onOrderUpdate}
          />
        </Suspense>
      </div>
    </div>
  );
};
