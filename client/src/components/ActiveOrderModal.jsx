import React, { useEffect, Suspense, lazy } from 'react';
import { X, ChevronLeft, ReceiptText, ChefHat, CheckCircle2, AlertCircle, CreditCard, Clock } from 'lucide-react';
import { formatRupiah, formatLocationDisplay } from '../utils/formatters';
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
        borderTopColor: 'var(--blue, #1B3B64)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  </div>
);

const getStatusConfig = (status) => {
  switch (status) {
    case 'paid_processing':
      return {
        icon: <ChefHat size={14} strokeWidth={2.2} />,
        pillClass: 'processing',
        label: 'Sedang dibuat',
      };
    case 'completed':
      return {
        icon: <CheckCircle2 size={14} strokeWidth={2.4} />,
        pillClass: 'completed',
        label: 'Siap diambil',
      };
    case 'cancelled':
      return {
        icon: <AlertCircle size={14} strokeWidth={2.2} />,
        pillClass: 'cancelled',
        label: 'Dibatalkan',
      };
    case 'waiting_qris_verification':
      return {
        icon: <CreditCard size={14} strokeWidth={2.2} />,
        pillClass: 'waiting-qris',
        label: 'Menunggu cek kasir',
      };
    case 'waiting_payment':
    default:
      return {
        icon: <Clock size={14} strokeWidth={2.2} />,
        pillClass: 'waiting',
        label: 'Menunggu pembayaran',
      };
  }
};

export const ActiveOrderModal = ({
  isOpen,
  onClose,
  orders = [],
  order,
  selectedOrderCode,
  onSelectOrderCode,
  onGoToMenu,
  onCancelOrder,
  onOrderUpdate,
}) => {
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

  if (!isOpen) return null;

  const showListSheet = orders.length > 1 && !selectedOrderCode;
  const currentOrder = order || (orders.length > 0 ? orders[orders.length - 1] : null);

  if (!showListSheet && !currentOrder) return null;

  return (
    <div
      className="ticket-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-title"
    >
      <div
        className={`ticket-modal-window ${showListSheet ? 'active-orders-sheet-window' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 3. Tampilan Sheet Daftar Pesanan Aktif jika lebih dari satu dan belum memilih satu tiket */}
        {showListSheet ? (
          <div className="active-orders-sheet-content">
            <div className="sheet-top-bar">
              <div className="sheet-title-group">
                <ReceiptText size={18} />
                <h2 id="ticket-modal-title" className="sheet-title">
                  Pesanan Aktif ({orders.length})
                </h2>
              </div>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={onClose}
                aria-label="Tutup daftar pesanan"
              >
                <X size={16} />
              </button>
            </div>

            <div className="sheet-body">
              <p className="sheet-caption">Ketuk baris untuk membuka tiket pesanan:</p>
              <div className="sheet-list">
                {orders.map((ord) => {
                  const cfg = getStatusConfig(ord.status);
                  const displayCode = ord.order_code?.startsWith('#')
                    ? ord.order_code
                    : '#' + (ord.order_code || '');

                  return (
                    <div
                      key={ord.order_code}
                      className="sheet-item-row"
                      onClick={() => onSelectOrderCode && onSelectOrderCode(ord.order_code)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          onSelectOrderCode && onSelectOrderCode(ord.order_code);
                        }
                      }}
                    >
                      <div className="sheet-item-left">
                        <span className="sheet-item-code">{displayCode}</span>
                        <span className="sheet-item-meta">
                          {formatLocationDisplay(ord.table_number)}
                          {ord.customer_name ? ` • ${ord.customer_name}` : ''}
                        </span>
                      </div>

                      <div className="sheet-item-right">
                        <div className={`tracker-status-pill ${cfg.pillClass}`}>
                          <span className="tracker-pulse-dot" />
                          <span>{cfg.label}</span>
                        </div>
                        <span className="sheet-item-total">{formatRupiah(ord.total_price)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Tampilan Tiket Pesanan Tunggal */
          <>
            {orders.length > 1 && (
              <div className="ticket-multi-back-bar">
                <button
                  type="button"
                  className="btn-back-to-orders-list"
                  onClick={() => onSelectOrderCode && onSelectOrderCode(null)}
                >
                  <ChevronLeft size={16} />
                  <span>Daftar Pesanan ({orders.length})</span>
                </button>
              </div>
            )}
            <Suspense fallback={<ModalLoadingFallback />}>
              <OrderTicket
                order={currentOrder}
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
          </>
        )}
      </div>
    </div>
  );
};
