import React, { memo } from 'react';
import { Coffee, MapPin, Edit3, QrCode } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { formatLocationDisplay } from '../utils/formatters';
import '../styles/navbar.css';

export const Navbar = memo(({ onOpenTableModal, onGoHome, activeOrder, onOpenTicketModal }) => {
  const { tableNumber } = useOrder();

  return (
    <header className="navbar-header">
      <div
        className="brand-container"
        onClick={onGoHome}
        style={{ cursor: onGoHome ? 'pointer' : 'default' }}
        title="Kembali ke Halaman Utama"
      >
        <div className="brand-logo-icon">
          <Coffee size={20} strokeWidth={2.4} />
        </div>
        <div className="brand-text">
          <span className="brand-title">BlueSukan Cafe</span>
          <span className="brand-subtitle">
            <span className="status-dot"></span>
            Guest Self-Order
          </span>
        </div>
      </div>

      <div className="navbar-actions">
        {activeOrder && onOpenTicketModal && (
          <button
            type="button"
            className="table-badge-btn"
            onClick={onOpenTicketModal}
            title="Lihat Tiket QR Pesanan Aktif"
            style={{
              background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              borderColor: '#1E40AF',
              boxShadow: '0 2px 8px rgba(30, 64, 175, 0.3)',
            }}
          >
            <QrCode size={13} />
            <span>Tiket {activeOrder.order_code}</span>
          </button>
        )}

        <button
          type="button"
          className="table-badge-btn"
          onClick={onOpenTableModal}
          title="Klik untuk mengubah lokasi duduk"
        >
          <MapPin size={14} className="text-primary" />
          <span>
            Area <strong className="table-number-val">{formatLocationDisplay(tableNumber)}</strong>
          </span>
          <Edit3 size={12} style={{ opacity: 0.6 }} />
        </button>
      </div>
    </header>
  );
});

Navbar.displayName = 'Navbar';
