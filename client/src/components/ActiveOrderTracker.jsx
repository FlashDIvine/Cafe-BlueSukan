import React, { useState, useEffect, memo } from 'react';
import {
  Clock,
  ChefHat,
  CheckCircle2,
  AlertCircle,
  QrCode,
  X,
  Sparkles,
} from 'lucide-react';
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

  // Realtime Polling of Order Status (every 3 seconds per PRD Task 4)
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
    }, 3000);

    return () => clearInterval(intervalId);
  }, [order?.order_code, currentStatus, onStatusChange]);

  if (!order) return null;

  // Status Presentation configuration
  const getStatusConfig = () => {
    switch (currentStatus) {
      case 'paid_processing':
        return {
          icon: <ChefHat size={20} strokeWidth={2.2} />,
          pillClass: 'processing',
          label: 'Sedang Diracik Barista',
          badgeClass: 'processing',
        };
      case 'completed':
        return {
          icon: <CheckCircle2 size={20} strokeWidth={2.4} />,
          pillClass: 'completed',
          label: 'Pesanan Selesai / Siap',
          badgeClass: 'completed',
        };
      case 'cancelled':
        return {
          icon: <AlertCircle size={20} strokeWidth={2.2} />,
          pillClass: 'cancelled',
          label: 'Pesanan Dibatalkan',
          badgeClass: 'cancelled',
        };
      case 'waiting_payment':
      default:
        return {
          icon: <Clock size={20} strokeWidth={2.2} />,
          pillClass: 'waiting',
          label: 'Menunggu Pembayaran Kasir',
          badgeClass: 'waiting',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const isTerminalState = currentStatus === 'completed' || currentStatus === 'cancelled';

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
              <span className="tracker-order-code">{order.order_code}</span>
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
            aria-label="Tampilkan Tiket QR Pesanan"
            title="Buka QR Code untuk di-scan kasir"
          >
            <QrCode size={16} />
            <span>Tiket QR</span>
          </button>

          {isTerminalState && onDismiss && (
            <button
              type="button"
              className="btn-tracker-dismiss"
              onClick={onDismiss}
              aria-label="Tutup notifikasi pesanan"
              title="Tutup notifikasi"
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
