import React, { useEffect, memo } from 'react';
import { Clock, ChefHat, CheckCircle2, AlertCircle, CreditCard, X } from 'lucide-react';
import { formatRupiah, formatLocationDisplay } from '../utils/formatters';
import { fetchOrderStatusApi } from '../services/api';
import '../styles/active-order-tracker.css';

export const ActiveOrderTracker = memo(({
  orders = [],
  order,
  onOpenTicket,
  onOpenList,
  onDismiss,
  onStatusChange,
}) => {
  const effectiveOrders = orders.length > 0 ? orders : (order ? [order] : []);
  const count = effectiveOrders.length;

  // Fallback Polling of Order Status (every 30 seconds as fallback to SSE)
  useEffect(() => {
    if (effectiveOrders.length === 0) return;

    const intervalId = setInterval(async () => {
      try {
        if (typeof document !== 'undefined' && document.hidden) return;

        for (const ord of effectiveOrders) {
          if (!ord?.order_code || ord.status === 'completed' || ord.status === 'cancelled') continue;
          const result = await fetchOrderStatusApi(ord.order_code);
          if (result && result.status && result.status !== ord.status) {
            if (onStatusChange) {
              onStatusChange(ord.order_code, result.status);
            }
          }
        }
      } catch {
        // Network hiccup — continue next poll
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [effectiveOrders, onStatusChange]);

  if (count === 0) return null;

  // Status presentation config - Anti-Slop Vintage
  const getStatusConfig = (status) => {
    switch (status) {
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

  // 1. Jika hanya satu pesanan, tampilan seperti sekarang
  if (count === 1) {
    const singleOrder = effectiveOrders[0];
    const statusConfig = getStatusConfig(singleOrder.status);
    const isTerminalState = singleOrder.status === 'completed' || singleOrder.status === 'cancelled';
    const displayCode = singleOrder.order_code?.startsWith('#')
      ? singleOrder.order_code
      : '#' + (singleOrder.order_code || '');

    return (
      <aside
        className="active-order-floating-bar"
        aria-label="Status Pesanan Aktif Anda"
      >
        <div className="active-order-tracker-card">
          <div
            className="tracker-left-group"
            onClick={() => onOpenTicket && onOpenTicket(singleOrder)}
            style={{ cursor: 'pointer' }}
          >
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
                <span className="tracker-table-badge">{formatLocationDisplay(singleOrder.table_number)}</span>
                <span className="tracker-sep">•</span>
                <span className="tracker-total-price">{formatRupiah(singleOrder.total_price)}</span>
              </div>
            </div>
          </div>

          <div className="tracker-actions-group">
            <button
              type="button"
              className="btn-tracker-view-ticket"
              onClick={() => onOpenTicket && onOpenTicket(singleOrder)}
              aria-label="Lihat tiket pesanan"
            >
              <span>Tiket</span>
            </button>

            {isTerminalState && onDismiss && (
              <button
                type="button"
                className="btn-tracker-dismiss"
                onClick={() => onDismiss(singleOrder.order_code)}
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
  }

  // 2. Jika lebih dari satu, tracker menampilkan ringkasan: "2 pesanan aktif" dengan status pesanan terbaru
  const latestOrder = effectiveOrders[effectiveOrders.length - 1];
  const latestStatusConfig = getStatusConfig(latestOrder.status);
  const totalAll = effectiveOrders.reduce((acc, ord) => acc + (Number(ord.total_price) || 0), 0);

  const handleOpenMulti = () => {
    if (onOpenList) {
      onOpenList();
    } else if (onOpenTicket) {
      onOpenTicket(latestOrder);
    }
  };

  return (
    <aside
      className="active-order-floating-bar"
      aria-label="Status Pesanan Aktif Anda"
    >
      <div className="active-order-tracker-card">
        <div
          className="tracker-left-group"
          onClick={handleOpenMulti}
          style={{ cursor: 'pointer' }}
        >
          <div className={`tracker-icon-badge ${latestStatusConfig.badgeClass}`}>
            {latestStatusConfig.icon}
          </div>

          <div className="tracker-text-block">
            <div className={`tracker-status-pill ${latestStatusConfig.pillClass}`}>
              <span className="tracker-pulse-dot" />
              <span>{latestStatusConfig.label}</span>
            </div>

            <div className="tracker-meta-line">
              <span className="tracker-order-code">{count} pesanan aktif</span>
              <span className="tracker-sep">•</span>
              <span className="tracker-total-price">{formatRupiah(totalAll)}</span>
            </div>
          </div>
        </div>

        <div className="tracker-actions-group">
          <button
            type="button"
            className="btn-tracker-view-ticket"
            onClick={handleOpenMulti}
            aria-label="Buka daftar pesanan aktif"
          >
            <span>Daftar ({count})</span>
          </button>
        </div>
      </div>
    </aside>
  );
});

ActiveOrderTracker.displayName = 'ActiveOrderTracker';
