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
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { fetchOrderStatusApi } from '../services/api';
import '../styles/order-ticket.css';

export const OrderTicket = ({ order, onBackToMenu }) => {
  const [currentStatus, setCurrentStatus] = useState(order?.status || 'waiting_payment');
  const [pollCount, setPollCount] = useState(0);

  // Polling status interval (every 3 seconds per PRD Task 4)
  useEffect(() => {
    if (!order?.order_code || currentStatus === 'paid_processing' || currentStatus === 'completed') {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const result = await fetchOrderStatusApi(order.order_code);
        setPollCount((prev) => prev + 1);

        if (result && result.status && result.status !== currentStatus) {
          setCurrentStatus(result.status);
        }
      } catch {
        // Network hiccup — keep polling
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [order?.order_code, currentStatus]);



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
          onClick={onBackToMenu}
          aria-label="Kembali ke Beranda"
        >
          <ArrowLeft size={16} />
          <span>Menu Utama</span>
        </button>
        <span className="ticket-header-title">Tiket Pesanan Digital</span>
      </header>

      {/* Main Ticket */}
      <div className="ticket-card">
        {/* Brand Banner */}
        <div className="ticket-brand-banner">
          <div className="ticket-cafe-logo">
            <Coffee size={24} color="#FFFFFF" />
          </div>
          <span className="ticket-cafe-name">Bantu Cafe</span>
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
            <Sparkles size={14} color="var(--color-accent)" />
            Tunjukkan QR ini ke kasir saat memesan
          </p>
        </div>

        {/* Dynamic Status Box */}
        {isProcessing ? (
          <div className="ticket-status-box processing" role="status">
            <div className="status-icon-wrap" style={{ color: '#059669' }}>
              <ChefHat size={18} />
            </div>
            <div className="status-text-content">
              <div className="status-title-row">
                <CheckCircle2 size={16} color="#059669" />
                <span>Pembayaran Sukses • Sedang Diproses</span>
              </div>
              <p className="status-desc-row">
                Pesanan Anda telah dikonfirmasi dan sedang diracik oleh barista Bantu Cafe.
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



      {/* Bottom Action */}
      <div className="ticket-actions-bottom">
        <button
          type="button"
          className="btn-order-again"
          onClick={onBackToMenu}
        >
          <ShoppingBag size={18} />
          <span>{isProcessing ? 'Pesan Menu Lain' : 'Kembali ke Katalog Menu'}</span>
        </button>
      </div>
    </div>
  );
};
