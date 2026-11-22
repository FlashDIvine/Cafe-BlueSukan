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
  QrCode,
  CreditCard,
  Banknote,
  AlertCircle,
  Ban,
} from 'lucide-react';
import { formatRupiah, formatLocationDisplay } from '../utils/formatters';
import {
  fetchOrderStatusApi,
  fetchQrisSettingsApi,
  confirmQrisPaymentApi,
  cancelOrderApi,
} from '../services/api';
import '../styles/order-ticket.css';

export const OrderTicket = ({ order, onBackToMenu, onGoHome, onCancelOrder }) => {
  const [currentStatus, setCurrentStatus] = useState(order?.status || 'waiting_payment');
  const [countdown, setCountdown] = useState(null); // null when inactive
  const [isCountdownCancelled, setIsCountdownCancelled] = useState(false);
  const [qrisSettings, setQrisSettings] = useState(null);
  const [isConfirmingQris, setIsConfirmingQris] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch Merchant QRIS settings
  useEffect(() => {
    let isMounted = true;
    fetchQrisSettingsApi()
      .then((data) => {
        if (isMounted && data) {
          setQrisSettings(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load QRIS info:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync internal state when order prop changes (via SSE in parent)
  useEffect(() => {
    if (order?.status && order.status !== currentStatus) {
      setCurrentStatus(order.status);
    }
  }, [order?.status]);

  // Fallback polling interval (every 30 seconds as fallback to SSE)
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
    }, 30000);

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
  const isQrisClaim = currentStatus === 'waiting_qris_verification';
  const isCancelled = currentStatus === 'cancelled';
  const isCanCancel = currentStatus === 'waiting_payment' || currentStatus === 'waiting_qris_verification';

  const handleConfirmQrisPayment = async () => {
    if (!order?.order_code) return;
    try {
      setIsConfirmingQris(true);
      await confirmQrisPaymentApi(order.order_code);
      setCurrentStatus('waiting_qris_verification');
    } catch (err) {
      alert(err.message || 'Gagal mengirim konfirmasi QRIS');
    } finally {
      setIsConfirmingQris(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    const confirmMsg = `Yakin ingin membatalkan pesanan ${order.order_code}?\n\nPesanan belum dikonfirmasi kasir dan tindakan ini tidak dapat diurungkan.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setIsCancelling(true);
      const identifier = order.order_code || order.id;
      const cancelled = await cancelOrderApi(identifier, true);
      setCurrentStatus('cancelled');
      if (onCancelOrder) {
        onCancelOrder(cancelled || { ...order, status: 'cancelled' });
      }
    } catch (err) {
      alert(err.message || 'Gagal membatalkan pesanan');
    } finally {
      setIsCancelling(false);
    }
  };

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

      {/* Post-Order Confirmation or Cancelled Alert */}
      {isCancelled ? (
        <div
          className="ticket-success-alert"
          style={{ backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }}
        >
          <div
            className="ticket-success-icon"
            style={{ backgroundColor: '#DC2626', color: '#FFFFFF' }}
          >
            <Ban size={20} />
          </div>
          <div className="ticket-success-text">
            <span className="ticket-success-title" style={{ color: '#991B1B' }}>
              Pesanan Telah Dibatalkan
            </span>
            <span className="ticket-success-desc" style={{ color: '#7F1D1D' }}>
              Pesanan <strong>{order?.order_code}</strong> telah dibatalkan sebelum dikonfirmasi penjual.
            </span>
          </div>
        </div>
      ) : (
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
      )}

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
          <span className="ticket-cafe-name">Angkringan Blue'sukan Kopi</span>
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
              fgColor="#1B3B64"
              bgColor="#FFFFFF"
            />
          </div>
          <p className="qr-scan-hint">
            <Sparkles size={14} color="var(--accent-amber)" />
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
                Pesanan Anda telah dikonfirmasi dan sedang disiapkan oleh tim Angkringan Blue'sukan Kopi.
              </p>
            </div>
          </div>
        ) : isQrisClaim ? (
          <div
            className="ticket-status-box waiting"
            role="status"
            style={{
              backgroundColor: '#FEF3C7',
              borderColor: '#F59E0B',
            }}
          >
            <div className="status-icon-wrap" style={{ color: '#B45309' }}>
              <CreditCard size={18} />
            </div>
            <div className="status-text-content">
              <div className="status-title-row">
                <span
                  className="live-poll-indicator"
                  style={{ backgroundColor: '#F59E0B' }}
                  title="Menunggu Kasir"
                ></span>
                <span style={{ color: '#92400E', fontWeight: '800' }}>
                  Menunggu Verifikasi Pembayaran QRIS oleh Kasir
                </span>
              </div>
              <p className="status-desc-row" style={{ color: '#B45309' }}>
                Klaim pembayaran Anda telah dikirim ke kasir. Mohon tunggu sebentar selagi kasir memeriksa mutasi pembayaran.
              </p>
            </div>
          </div>
        ) : order?.payment_method === 'qris' ? (
          <div className="ticket-status-box waiting" role="status">
            <div className="status-icon-wrap" style={{ color: '#D97706' }}>
              <QrCode size={18} />
            </div>
            <div className="status-text-content">
              <div className="status-title-row">
                <span className="live-poll-indicator" title="Polling aktif"></span>
                <span>Menunggu Pembayaran QRIS</span>
              </div>
              <p className="status-desc-row">
                Silakan scan barcode QRIS di bawah ini, cantumkan Kode Pesanan pada catatan transfer, lalu konfirmasi.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="ticket-status-box waiting"
            role="status"
            style={{
              backgroundColor: '#F0FDF4',
              borderColor: '#86EFAC',
            }}
          >
            <div className="status-icon-wrap" style={{ color: '#166534' }}>
              <Banknote size={18} />
            </div>
            <div className="status-text-content">
              <div className="status-title-row">
                <span
                  className="live-poll-indicator"
                  style={{ backgroundColor: '#22C55E' }}
                  title="Polling aktif"
                ></span>
                <span style={{ color: '#166534', fontWeight: '800' }}>
                  Menunggu Pembayaran Tunai di Kasir
                </span>
              </div>
              <p className="status-desc-row" style={{ color: '#15803D' }}>
                Silakan menuju meja kasir dan lakukan pembayaran tunai sebesar {formatRupiah(order?.total_price || 0)}.
              </p>
            </div>
          </div>
        )}

        {/* Section Pembayaran QRIS Mandiri (Saat status waiting_payment & metode qris) */}
        {currentStatus === 'waiting_payment' && order?.payment_method === 'qris' && (
          <div
            style={{
              margin: '14px 16px',
              padding: '16px',
              backgroundColor: '#FBF7EF',
              border: '1.5px solid var(--color-border, #D5C7B2)',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: 'var(--brand-navy, #1B3B64)',
                fontWeight: '800',
                fontSize: '13px',
                marginBottom: '2px',
              }}
            >
              <QrCode size={16} />
              <span>Bayar Langsung via QRIS Dagang</span>
            </div>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary, #5A4D41)',
                display: 'block',
                marginBottom: '10px',
              }}
            >
              {qrisSettings?.qris_merchant_name || "Angkringan Blue'sukan Kopi"}
            </span>

            {qrisSettings?.qris_image ? (
              <div
                style={{
                  width: '180px',
                  height: '180px',
                  margin: '0 auto 10px',
                  backgroundColor: '#FFFFFF',
                  padding: '8px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--color-border, #D5C7B2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                }}
              >
                <img
                  src={qrisSettings.qris_image}
                  alt="QRIS Dagang Blue'sukan Kopi"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#FFFBEB',
                  border: '1px dashed #F59E0B',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#92400E',
                  marginBottom: '10px',
                }}
              >
                Gambar barcode QRIS toko sedang disiapkan kasir. Tunjukkan kode tiket ini ke kasir.
              </div>
            )}

            {/* Banner Instruksi Wajib Catatan Transfer */}
            <div
              style={{
                backgroundColor: '#FEF3C7',
                border: '1.5px dashed #F59E0B',
                borderRadius: '8px',
                padding: '10px 12px',
                margin: '10px 0 12px',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: '#92400E',
                  fontWeight: '800',
                  fontSize: '11.5px',
                  marginBottom: '3px',
                }}
              >
                <AlertCircle size={14} />
                <span>PENTING SAAT TRANSFER:</span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#78350F', lineHeight: 1.35 }}>
                Harap cantumkan <strong>Kode Pesanan</strong> berikut pada catatan/berita transfer Anda:
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #FCD34D',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  marginTop: '6px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: '800',
                    fontSize: '14px',
                    color: '#1B3B64',
                  }}
                >
                  {order?.order_code}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator?.clipboard) {
                      navigator.clipboard.writeText(order?.order_code || '');
                      alert(`Kode ${order?.order_code} disalin ke clipboard!`);
                    }
                  }}
                  style={{
                    backgroundColor: '#1B3B64',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Salin Kode
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary, #5A4D41)' }}>
                Total Tagihan:
              </span>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: '800',
                  color: 'var(--brand-navy, #1B3B64)',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {formatRupiah(order?.total_price || 0)}
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmQrisPayment}
              disabled={isConfirmingQris}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'var(--accent-amber, #C96A2B)',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: '800',
                cursor: isConfirmingQris ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(201, 106, 43, 0.3)',
              }}
            >
              <CheckCircle2 size={16} />
              <span>
                {isConfirmingQris ? 'Mengirim Konfirmasi...' : '✅ Konfirmasi Sudah Bayar QRIS'}
              </span>
            </button>
          </div>
        )}

        {/* Section Pembayaran Tunai (Saat status waiting_payment & metode cash/tunai) */}
        {currentStatus === 'waiting_payment' && order?.payment_method !== 'qris' && (
          <div
            style={{
              margin: '14px 16px',
              padding: '16px',
              backgroundColor: '#F0FDF4',
              border: '1.5px solid #86EFAC',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: '#166534',
                fontWeight: '800',
                fontSize: '13.5px',
                marginBottom: '6px',
              }}
            >
              <Banknote size={18} />
              <span>Pembayaran Tunai di Kasir</span>
            </div>
            <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#15803D', lineHeight: 1.45 }}>
              Silakan langsung menuju ke meja kasir dan sebutkan Kode Pesanan <strong>{order?.order_code}</strong> atau tunjukkan QR Tiket di atas.
            </p>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px dashed #86EFAC',
                borderRadius: '8px',
                padding: '8px 12px',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '11px', color: '#4B5563', display: 'block' }}>
                Total Tagihan Tunai:
              </span>
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: '800',
                  color: '#166534',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {formatRupiah(order?.total_price || 0)}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#15803D' }}>
              Kasir akan mengonfirmasi pesanan Anda setelah pembayaran tunai diterima.
            </span>
          </div>
        )}

        {/* Tombol Batalkan Pesanan oleh Pembeli (Hanya jika belum dikonfirmasi penjual) */}
        {isCanCancel && (
          <div
            style={{
              margin: '12px 16px 6px',
              textAlign: 'center',
            }}
          >
            <button
              type="button"
              onClick={handleCancelOrder}
              disabled={isCancelling}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: isCancelling ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <Ban size={15} />
              <span>{isCancelling ? 'Membatalkan...' : 'Batalkan Pesanan Ini'}</span>
            </button>
            <span style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginTop: '4px' }}>
              Pesanan hanya dapat dibatalkan selama belum dikonfirmasi penjual / kasir.
            </span>
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
              <span className="meta-field-label">Lokasi Duduk</span>
              <span className="meta-field-value">{formatLocationDisplay(order?.table_number)}</span>
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
