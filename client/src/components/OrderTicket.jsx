import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';
import { formatRupiah, formatLocationDisplay } from '../utils/formatters';
import {
  fetchOrderStatusApi,
  fetchOrderByCodeApi,
  fetchQrisSettingsApi,
  confirmQrisPaymentApi,
  cancelOrderApi,
} from '../services/api';
import '../styles/order-ticket.css';

export const OrderTicket = ({ order, onBackToMenu, onGoHome, onClose, onCancelOrder, onOrderUpdate }) => {
  const [localOrder, setLocalOrder] = useState(order);
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

  // Sync internal state when order prop changes (via SSE / parent refetch)
  useEffect(() => {
    if (order) {
      setLocalOrder(order);
      if (order.status && order.status !== currentStatus) {
        setCurrentStatus(order.status);
      }
    }
  }, [order]);

  // Fallback polling interval (every 15 seconds to fetch complete order as fallback to SSE)
  useEffect(() => {
    if (!order?.order_code || currentStatus === 'completed' || currentStatus === 'cancelled') {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const freshOrder = await fetchOrderByCodeApi(order.order_code);
        if (freshOrder) {
          setLocalOrder(freshOrder);
          if (freshOrder.status && freshOrder.status !== currentStatus) {
            setCurrentStatus(freshOrder.status);
          }
          if (onOrderUpdate) {
            onOrderUpdate(freshOrder);
          }
        }
      } catch (err) {
        console.warn('Fallback polling order fetch failed:', err);
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [order?.order_code, currentStatus, onOrderUpdate]);

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

  const isCanCancel = currentStatus === 'waiting_payment' || currentStatus === 'waiting_qris_verification';

  const handleConfirmQrisPayment = async () => {
    const code = (localOrder || order)?.order_code;
    if (!code) return;
    try {
      setIsConfirmingQris(true);
      await confirmQrisPaymentApi(code);
      setCurrentStatus('waiting_qris_verification');
    } catch (err) {
      alert(err.message || 'Gagal mengirim konfirmasi QRIS');
    } finally {
      setIsConfirmingQris(false);
    }
  };

  const handleCancelOrder = async () => {
    const currentActive = localOrder || order;
    if (!currentActive) return;
    const confirmMsg = `Yakin ingin membatalkan pesanan ${currentActive.order_code}?\n\nPesanan belum dikonfirmasi kasir dan tindakan ini tidak dapat diurungkan.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setIsCancelling(true);
      const identifier = currentActive.order_code || currentActive.id;
      const cancelled = await cancelOrderApi(identifier, true);
      setCurrentStatus('cancelled');
      if (onCancelOrder) {
        onCancelOrder(cancelled || { ...currentActive, status: 'cancelled' });
      }
    } catch (err) {
      alert(err.message || 'Gagal membatalkan pesanan');
    } finally {
      setIsCancelling(false);
    }
  };

  // Status badge config: Menunggu Pembayaran, Menunggu cek kasir, Diproses, Selesai, Dibatalkan
  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'paid_processing':
        return { label: 'Diproses', className: 'badge-processing' };
      case 'completed':
        return { label: 'Selesai', className: 'badge-completed' };
      case 'cancelled':
        return { label: 'Dibatalkan', className: 'badge-cancelled' };
      case 'waiting_qris_verification':
        return { label: 'Menunggu cek kasir', className: 'badge-waiting-qris' };
      case 'waiting_payment':
      default:
        return { label: 'Menunggu Pembayaran', className: 'badge-waiting' };
    }
  };

  const activeData = localOrder || order;
  const statusBadge = getStatusBadge();
  const displayCode = activeData?.order_code?.startsWith('#')
    ? activeData.order_code
    : '#' + (activeData?.order_code || 'BC-100');

  // Value encoded in the QR code for cashier scanning
  const qrPayload = JSON.stringify({
    order_code: activeData?.order_code,
    table: activeData?.table_number,
    total: activeData?.total_price,
    time: activeData?.created_at,
  });

  const handleClose = onClose || onGoHome || onBackToMenu;

  return (
    <div className="nota-warung-container">
      {/* 1. Judul kecil "Tiket Pesanan" dan tombol tutup */}
      <header className="nota-header">
        <span className="nota-header-title">Tiket Pesanan</span>
        {handleClose && (
          <button
            type="button"
            className="nota-close-btn"
            onClick={handleClose}
            aria-label="Tutup tiket"
          >
            <X size={16} />
          </button>
        )}
      </header>

      {/* 2. Status Badge & Kode pesanan besar, misalnya "#BC-102", di tengah dengan huruf Caprasimo */}
      <div className="nota-code-section">
        <div className={`nota-status-badge ${statusBadge.className}`}>
          <span>{statusBadge.label}</span>
        </div>
        <h1 className="nota-order-code">{displayCode}</h1>
      </div>

      {/* 3. Baris meja dan nama pemesan */}
      <div className="nota-meta-grid">
        <div className="nota-meta-item">
          <span className="nota-meta-label">Meja</span>
          <span className="nota-meta-val">{formatLocationDisplay(activeData?.table_number)}</span>
        </div>
        <div className="nota-meta-item">
          <span className="nota-meta-label">Pemesan</span>
          <span className="nota-meta-val">{activeData?.customer_name || 'Pelanggan'}</span>
        </div>
      </div>

      {activeData?.notes && (
        <div className="nota-notes-box">
          <span className="nota-meta-label">Catatan:</span> {activeData.notes}
        </div>
      )}

      {/* 4. Daftar menu dan total, menggunakan gaya daftar titik-titik */}
      <div className="nota-items-section">
        <div className="nota-items-list">
          {activeData?.items?.map((item, idx) => (
            <div key={idx} className="nota-item-row">
              <span className="nota-item-name">{item.name} ×{item.quantity}</span>
              <span className="nota-dots" aria-hidden="true" />
              <span className="nota-item-price">
                {formatRupiah(item.subtotal || item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="nota-total-row">
          <span className="nota-total-label">Total</span>
          <span className="nota-dots" aria-hidden="true" />
          <span className="nota-total-val">{formatRupiah(activeData?.total_price || 0)}</span>
        </div>
      </div>

      {/* 5. Garis sobekan */}
      <div className="nota-tear-line" aria-hidden="true">
        <span className="tear-cutout-left" />
        <span className="tear-dashed-line" />
        <span className="tear-cutout-right" />
      </div>

      {/* 6. QR tiket kecil (~140px) untuk kasir, dengan teks "Tunjukkan ke kasir saat memesan." */}
      <div className="nota-qr-section">
        <div className="nota-qr-frame">
          <QRCodeSVG
            value={qrPayload}
            size={140}
            level="M"
            fgColor="#3A2418"
            bgColor="#FBF4E2"
          />
        </div>
        <p className="nota-qr-hint">Tunjukkan ke kasir saat memesan.</p>
      </div>

      {/* 7. Bagian bayar, hanya jika metode QRIS */}
      {activeData?.payment_method === 'qris' && (
        <div className="nota-payment-box">
          <h2 className="nota-payment-title">Cara bayar</h2>
          <ol className="nota-steps-list">
            <li>Scan kode QR QRIS toko.</li>
            <li>Ketik nominal persis: <strong>{formatRupiah(activeData?.total_price || 0)}</strong>.</li>
            <li>Tekan "Sudah bayar".</li>
          </ol>

          {/* Gambar QRIS toko atau pesan belum tersedia */}
          {qrisSettings?.qris_image ? (
            <div className="nota-merchant-qris-wrap">
              <img
                src={qrisSettings.qris_image}
                alt="Kode QR QRIS Toko"
                className="nota-merchant-qris-img"
                loading="lazy"
              />
              <span className="nota-merchant-name">
                {qrisSettings.qris_merchant_name || "Angkringan Blue'sukan Kopi"}
              </span>
            </div>
          ) : (
            <p className="nota-qris-empty">
              Kode QR belum tersedia. Tunjukkan kode tiket ini ke kasir.
            </p>
          )}

          {/* Kotak Salin Kode */}
          <div className="nota-copy-code-box">
            <span className="nota-copy-label">Kode pesanan: <strong>{displayCode}</strong></span>
            <button
              type="button"
              className="btn-copy-code"
              onClick={() => {
                if (navigator?.clipboard) {
                  navigator.clipboard.writeText(activeData?.order_code || '');
                  alert(`Kode ${displayCode} disalin!`);
                }
              }}
            >
              Salin Kode
            </button>
          </div>

          {/* Tombol Sudah bayar (hanya saat waiting_payment) */}
          {currentStatus === 'waiting_payment' && (
            <button
              type="button"
              className="btn-sudah-bayar"
              onClick={handleConfirmQrisPayment}
              disabled={isConfirmingQris}
            >
              {isConfirmingQris ? 'Mengirim...' : 'Sudah bayar'}
            </button>
          )}

          {/* Teks status setelah diklik: Menunggu cek kasir */}
          {currentStatus === 'waiting_qris_verification' && (
            <div className="nota-waiting-qris-box">
              <span>Menunggu cek kasir</span>
            </div>
          )}
        </div>
      )}

      {/* 8. Bagian bayar, jika metode tunai */}
      {activeData?.payment_method !== 'qris' && (
        <div className="nota-cash-section">
          <p className="nota-cash-instruction">
            Bayar di kasir. Sebutkan kode <strong>{displayCode}</strong> atau tunjukkan layar ini.
          </p>
        </div>
      )}

      {/* Countdown notification when completed */}
      {countdown !== null && !isCountdownCancelled && (
        <div className="nota-countdown-box">
          <span>Kembali ke beranda dalam {countdown} detik</span>
          <button type="button" onClick={() => setIsCountdownCancelled(true)}>
            Tetap di sini
          </button>
        </div>
      )}

      {/* 9. Tombol aksi bawah */}
      <div className="nota-bottom-actions">
        <button
          type="button"
          className="btn-nota-home"
          onClick={onGoHome || onBackToMenu}
        >
          Kembali ke beranda
        </button>

        <button
          type="button"
          className="btn-nota-menu"
          onClick={onBackToMenu}
        >
          Pesan menu lagi
        </button>

        {isCanCancel && (
          <button
            type="button"
            className="btn-nota-cancel"
            onClick={handleCancelOrder}
            disabled={isCancelling}
          >
            {isCancelling ? 'Membatalkan...' : 'Batalkan pesanan'}
          </button>
        )}
      </div>
    </div>
  );
};
