import React, { memo } from 'react';
import { Coffee, MapPin, Edit3, QrCode } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { formatLocationDisplay } from '../utils/formatters';
import '../styles/navbar.css';

export const Navbar = memo(({ onOpenTableModal, onGoHome, activeOrder, onOpenTicketModal }) => {
  const { tableNumber } = useOrder();

  const brandContent = (
    <>
      <div className="brand-logo-icon" aria-hidden="true">
        <Coffee size={19} strokeWidth={2.2} />
      </div>
      <div className="brand-text">
        <span className="brand-title">
          BlueSukan <span className="brand-title-accent">Cafe</span>
        </span>
        <div className="brand-subtitle">
          <span className="status-dot" aria-hidden="true" />
          <span className="brand-badge-text">Guest Self-Order</span>
        </div>
      </div>
    </>
  );

  return (
    <header className="navbar-header" role="banner">
      {onGoHome ? (
        <button
          type="button"
          className="brand-container brand-interactive"
          onClick={onGoHome}
          title="Kembali ke Halaman Utama"
          aria-label="BlueSukan Cafe - Kembali ke Halaman Utama"
        >
          {brandContent}
        </button>
      ) : (
        <div className="brand-container brand-static">
          {brandContent}
        </div>
      )}

      <div className="navbar-actions" role="toolbar" aria-label="Aksi Navigasi">
        {activeOrder && onOpenTicketModal && (
          <button
            type="button"
            className="navbar-ticket-btn table-badge-btn"
            onClick={onOpenTicketModal}
            title={`Lihat Tiket QR Pesanan Aktif (${activeOrder.order_code})`}
            aria-label={`Lihat Tiket QR Pesanan Aktif nomor ${activeOrder.order_code}`}
          >
            <span className="ticket-icon-wrap" aria-hidden="true">
              <QrCode size={15} strokeWidth={2.2} />
            </span>
            <span className="ticket-label">
              Tiket <span className="tabular ticket-code">{activeOrder.order_code}</span>
            </span>
            <span className="ticket-pulse-beacon" aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          className="navbar-table-btn table-badge-btn"
          onClick={onOpenTableModal}
          title="Klik untuk mengubah lokasi duduk"
          aria-label={`Ubah lokasi meja saat ini: ${formatLocationDisplay(tableNumber)}`}
        >
          <MapPin size={15} strokeWidth={2.2} className="table-pin-icon" aria-hidden="true" />
          <div className="table-text-group">
            <span className="table-prefix">Area</span>
            <span className="table-number-val tabular">{formatLocationDisplay(tableNumber)}</span>
          </div>
          <Edit3 size={13} strokeWidth={2} className="table-edit-icon" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
});

Navbar.displayName = 'Navbar';
