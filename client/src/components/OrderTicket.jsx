import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Coffee,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  ChefHat,
  Home,
  Timer,
  X,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { fetchOrderStatusApi } from '../services/api';
import '../styles/order-ticket.css';

export const OrderTicket = ({ order, onBackToMenu, onGoHome }) => {
  const [currentStatus, setCurrentStatus] = useState(order?.status || 'waiting_payment');
  const [countdown, setCountdown] = useState(null); // null when inactive
  const [isCountdownCancelled, setIsCountdownCancelled] = useState(false);

  // Polling status interval (every 3 seconds per PRD Task 4)
  useEffect(() => {
    if (!order?.order_code || currentStatus === 'paid_processing' || currentStatus === 'completed') {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const result = await fetchOrderStatusApi(order.order_code);
        if (result && result.status && result.status !== currentStatus) {
          setCurrentStatus(result.status);
        }
      } catch {
        // Network hiccup — keep polling
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [order?.order_code, currentStatus]);

  // Optional post-order countdown redirect when order is completed
  useEffect(() => {
    if (currentStatus === 'completed' && !isCountdownCancelled && countdown === null) {
      setCountdown(5);
    }
  }, [currentStatus, isCountdownCancelled, countdown]);

  useEffect(() => {
    if (countdown === null || isCountdownCancelled) return;

    if (countdown <= 0) {
      if (onGoHome) onGoHome();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isCountdownCancelled, onGoHome]);

  const isProcessing = currentStatus === 'paid_processing' || currentStatus === 'completed';

  // Value encoded in the QR code for cashier scanning
  const qrPayload = JSON.stringify({
    order_code: order?.order_code,
    table: order?.table_number,
    total: order?.total_price,
    time: order?.created_at,
  });

  return (
    <div className="ticket-page-container">
      {/* Top Header */}
      <header className="ticket-header-bar">
        <button
          type="button"
          className="ticket-back-btn"
          onClick={onGoHome || onBackToMenu}
          aria-label="Kembali ke Beranda"
        >
          <ArrowLeft size={16} />
          <span>Beranda</span>
        </button>
        <span className="ticket-header-title">Tiket Pesanan Digital</span>
      </header>

      {/* Post-Order Success Confirmation Banner */}
      <div className="ticket-success-alert">
        <div className="ticket-success-icon">
          <CheckCircle2 size={20} />
        </div>
        <div className="ticket-success-text">
          <span className="ticket-success-title">Pesanan Berhasil Dibuat!</span>
          <span className="ticket-success-desc">
            Kode pesanan Anda adalah <strong>{order?.order_code}</strong>. Simpan tiket ini untuk verifikasi kasir.
          </span>
        </div>
      </div>

      {/* Auto-redirect countdown notification when completed */}
      {countdown !== null && !isCountdownCancelled && (
        <div className="ticket-countdown-bar">
          <div className="countdown-info">
            <Timer size={14} color="var(--color-royal-blue)" />
            <span>
              Kembali ke Beranda dalam <span className="countdown-number">{countdown}s</span>
            </span>
          </div>
          <button
            type="button"
            className="countdown-cancel-btn"
            onClick={() => setIsCountdownCancelled(true)}
          >
            <X size={12} style={{ display: 'inline', marginRight: '2px' }} />
            Tetap di sini
          </button>
        </div>
      )}

      {/* Main Ticket */}
      <div className="ticket-card">
        {/* Brand Banner */}
        <div className="ticket-brand-banner">
          <div className="ticket-cafe-logo">
            <Coffee size={24} color="#FFFFFF" />
          </div>
          <span className="ticket-cafe-name">BlueSukan Cafe</span>
          <div className="ticket-order-code-badge" title="Kode Pesanan Anda">
            <span>{order?.order_code || '#BC-100'}</span>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="ticket-qr-section">
          <div className="qr-code-frame">
            <QRCodeSVG
              value={qrPayload}
              size={170}
              level="H"
              includeMargin={false}
              fgColor="#0F3E7D"
              bgColor="#FFFFFF"
            />
          </div>
          <p className="qr-scan-hint">
            <Sparkles size={14} color="var(--color-royal-blue)" />
            Tunjukkan QR ini ke kasir saat memesan
          </p>
        </div>

        {/* Dynamic Status Box */}
        {isProcessing ? (
          <div className="ticket-status-box processing" role="status">
            <div className="status-icon-wrap" style={{ color: '#2563EB' }}>
              <ChefHat size={18} />
            </div>
            <div className="status-text-content">
              <div className="status-title-row">
                <CheckCircle2 size={16} color="#2563EB" />
                <span>Pembayaran Sukses • Sedang Diproses</span>
              </div>
              <p className="status-desc-row">
                Pesanan Anda telah dikonfirmasi dan sedang diracik oleh barista BlueSukan Cafe.
              </p>
            </div>
          </div>
        ) : (
          <div className="ticket-status-box waiting" role="status">
            <div className="status-icon-wrap" style={{ color: '#D97706' }}>
              <Clock size={18} />
            </div>
            <div className="status-text-content">
              <div className="status-title-row">
                <span className="live-poll-indicator" title="Polling aktif"></span>
                <span>Menunggu Pembayaran di Kasir</span>
              </div>
              <p className="status-desc-row">
                Silakan menuju ke kasir fisik untuk verifikasi pesanan dan melakukan pembayaran (Cash/QRIS).
              </p>
            </div>
          </div>
        )}

        {/* Perforated separator */}
        <div className="ticket-perforated-line"></div>

        {/* Order Details & Summary */}
        <div className="ticket-details-section">
          {/* Metadata Grid */}
          <div className="ticket-meta-grid">
            <div className="meta-field">
              <span className="meta-field-label">Nama Pemesan</span>
              <span className="meta-field-value">{order?.customer_name || 'Pelanggan'}</span>
            </div>
            <div className="meta-field">
              <span className="meta-field-label">Nomor Meja</span>
              <span className="meta-field-value">Meja {order?.table_number || '04'}</span>
            </div>
          </div>

          {/* Special Notes if provided */}
          {order?.notes && (
            <div className="ticket-notes-box">
              <strong>Catatan:</strong> {order.notes}
            </div>
          )}

          {/* Items List */}
          <div className="ticket-items-list">
            <span className="meta-field-label">Rincian Menu</span>
            {order?.items?.map((item, idx) => (
              <div key={idx} className="ticket-item-row">
                <div className="ticket-item-qty-name">
                  <span className="ticket-item-qty-badge">{item.quantity}x</span>
                  <span>{item.name}</span>
                </div>
                <span className="ticket-item-price">{formatRupiah(item.subtotal || item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Total Box */}
          <div className="ticket-total-box">
            <span className="ticket-total-label">Total Pembayaran</span>
            <span className="ticket-total-val">{formatRupiah(order?.total_price || 0)}</span>
          </div>
        </div>
      </div>

      {/* Bottom Actions with Direct Redirection */}
      <div className="ticket-actions-bottom">
        <button
          type="button"
          className="btn-go-home"
          onClick={onGoHome || onBackToMenu}
          aria-label="Kembali ke Halaman Utama"
        >
          <Home size={18} />
          <span>Kembali ke Halaman Utama</span>
        </button>

        <button
          type="button"
          className="btn-order-again"
          onClick={onBackToMenu}
          aria-label="Pesan Menu Lain"
        >
          <ShoppingBag size={17} />
          <span>{isProcessing ? 'Pesan Menu Tambahan' : 'Kembali ke Katalog Menu'}</span>
        </button>
      </div>
    </div>
  );
};
