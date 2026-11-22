import React, { useState, useEffect, memo } from 'react';
import { Clock, ChefHat, CheckCircle2, AlertCircle, CreditCard, X } from 'lucide-react';
import { formatRupiah, formatLocationDisplay } from '../utils/formatters';
import { fetchOrderStatusApi } from '../services/api';
import '../styles/active-order-tracker.css';

export const ActiveOrderTracker = memo(({ order, onOpenTicket, onDismiss, onStatusChange }) => {
  const [currentStatus, setCurrentStatus] = useState(order?.status || 'waiting_payment');

  // Sync internal state when order prop changes
  useEffect(() => {
    if (order?.status && order.status !== currentStatus) {
      setCurrentStatus(order.status);
    }
  }, [order?.status]);

  // Fallback Polling of Order Status (every 30 seconds as fallback to SSE)
  useEffect(() => {
    if (!order?.order_code || currentStatus === 'completed' || currentStatus === 'cancelled') {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        if (typeof document !== 'undefined' && document.hidden) return;

        const result = await fetchOrderStatusApi(order.order_code);
        if (result && result.status && result.status !== currentStatus) {
          setCurrentStatus(result.status);
          if (onStatusChange) {
            onStatusChange(result.status);
          }
        }
      } catch {
        // Network hiccup — continue next poll
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [order?.order_code, currentStatus, onStatusChange]);

  if (!order) return null;

  // Status Presentation configuration - Anti-Slop Vintage Riverside Warung
  const getStatusConfig = () => {
    switch (currentStatus) {
      case 'paid_processing':
        return {
          icon: <ChefHat size={16} strokeWidth={2.2} />,
          pillClass: 'processing',
          label: 'Sedang dibuat',
          badgeClass: 'processing',
        };
      case 'completed':
        return {
          icon: <CheckCircle2 size={16} strokeWidth={2.4} />,
          pillClass: 'completed',
          label: 'Siap diambil',
          badgeClass: 'completed',
        };
      case 'cancelled':
        return {
          icon: <AlertCircle size={16} strokeWidth={2.2} />,
          pillClass: 'cancelled',
          label: 'Dibatalkan',
          badgeClass: 'cancelled',
        };
      case 'waiting_qris_verification':
        return {
          icon: <CreditCard size={16} strokeWidth={2.2} />,
          pillClass: 'waiting-qris',
          label: 'Menunggu cek kasir',
          badgeClass: 'waiting-qris',
        };
      case 'waiting_payment':
      default:
        return {
          icon: <Clock size={16} strokeWidth={2.2} />,
          pillClass: 'waiting',
          label: 'Menunggu pembayaran',
          badgeClass: 'waiting',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const isTerminalState = currentStatus === 'completed' || currentStatus === 'cancelled';
  const displayCode = order.order_code?.startsWith('#') ? order.order_code : '#' + (order.order_code || '');

  return (
    <aside
      className="active-order-floating-bar"
      aria-label="Status Pesanan Aktif Anda"
    >
      <div className="active-order-tracker-card">
        {/* Left: Live status icon & order info */}
        <div className="tracker-left-group" onClick={onOpenTicket} style={{ cursor: 'pointer' }}>
          <div className={`tracker-icon-badge ${statusConfig.badgeClass}`}>
            {statusConfig.icon}
          </div>

          <div className="tracker-text-block">
            <div className={`tracker-status-pill ${statusConfig.pillClass}`}>
              <span className="tracker-pulse-dot" />
              <span>{statusConfig.label}</span>
            </div>

            <div className="tracker-meta-line">
              <span className="tracker-order-code">{displayCode}</span>
              <span className="tracker-sep">•</span>
              <span className="tracker-table-badge">{formatLocationDisplay(order.table_number)}</span>
              <span className="tracker-sep">•</span>
              <span className="tracker-total-price">{formatRupiah(order.total_price)}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="tracker-actions-group">
          <button
            type="button"
            className="btn-tracker-view-ticket"
            onClick={onOpenTicket}
            aria-label="Lihat tiket pesanan"
          >
            <span>Tiket</span>
          </button>

          {isTerminalState && onDismiss && (
            <button
              type="button"
              className="btn-tracker-dismiss"
              onClick={onDismiss}
              aria-label="Tutup notifikasi pesanan"
              title="Tutup"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
});

ActiveOrderTracker.displayName = 'ActiveOrderTracker';
