import React, { memo } from 'react';
import { Coffee, MapPin, Edit3 } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import '../styles/navbar.css';

export const Navbar = memo(({ onOpenTableModal, onGoHome }) => {
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
        <button
          type="button"
          className="table-badge-btn"
          onClick={onOpenTableModal}
          title="Klik untuk mengubah nomor meja"
        >
          <MapPin size={14} className="text-primary" />
          <span>
            Meja <strong className="table-number-val">{tableNumber || '--'}</strong>
          </span>
          <Edit3 size={12} style={{ opacity: 0.6 }} />
        </button>
      </div>
    </header>
  );
});

Navbar.displayName = 'Navbar';
