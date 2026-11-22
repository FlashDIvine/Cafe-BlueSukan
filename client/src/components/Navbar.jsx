import React, { memo } from 'react';
import { useOrder } from '../hooks/useOrder';
import { formatLocationDisplay } from '../utils/formatters';
import '../styles/navbar.css';

export const Navbar = memo(({ onOpenTableModal, onGoHome, activeOrder, onOpenTicketModal }) => {
  const { tableNumber } = useOrder();

  // Strip leading '#' to prevent double '#' like '##BC-101'
  const cleanOrderCode = activeOrder?.order_code
    ? activeOrder.order_code.replace(/^#+/, '')
    : '';

  const brandContent = (
    <span className="brand-title">
      Blue’sukan Kopi
    </span>
  );

  return (
    <header className="navbar-header" role="banner">
      {onGoHome ? (
        <button
          type="button"
          className="brand-container brand-interactive"
          onClick={onGoHome}
          title="Kembali ke Beranda"
          aria-label="Blue’sukan Kopi - Kembali ke Beranda"
        >
          {brandContent}
        </button>
      ) : (
        <div className="brand-container">
          {brandContent}
        </div>
      )}

      <div className="navbar-actions" role="toolbar" aria-label="Aksi Navigasi">
        {activeOrder && onOpenTicketModal ? (
          <button
            type="button"
            className="navbar-pill-btn"
            onClick={onOpenTicketModal}
            title={`Lihat Tiket QR Pesanan (${cleanOrderCode})`}
            aria-label={`Lihat Tiket QR Pesanan nomor ${cleanOrderCode}`}
          >
            <span>Meja {cleanOrderCode}</span>
          </button>
        ) : (
          <button
            type="button"
            className="navbar-pill-btn"
            onClick={onOpenTableModal}
            title="Klik untuk mengubah lokasi duduk"
            aria-label={`Lokasi meja saat ini: ${formatLocationDisplay(tableNumber)}`}
          >
            <span>Meja {formatLocationDisplay(tableNumber)}</span>
          </button>
        )}
      </div>
    </header>
  );
});

Navbar.displayName = 'Navbar';
