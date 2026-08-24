import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import '../styles/modal.css';

export const TableModal = ({ isOpen, onClose }) => {
  const { tableNumber, setTableNumber, showToast } = useOrder();
  const [tempTable, setTempTable] = useState(tableNumber || '');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const trimmed = tempTable.trim();
    if (!trimmed) {
      showToast('Nomor meja tidak boleh kosong', 'warning');
      return;
    }
    setTableNumber(trimmed);
    showToast(`Nomor meja diubah ke Meja ${trimmed}`, 'success');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <MapPin size={18} color="var(--color-primary)" />
            <h2 className="modal-title">Ganti Nomor Meja</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            <p className="modal-desc">
              Masukkan nomor meja sesuai dengan stiker QR code yang ada di meja tempat Anda duduk.
            </p>
            <div className="table-input-group">
              <label htmlFor="table-input" className="table-input-label">Nomor Meja</label>
              <input
                id="table-input"
                type="text"
                className="table-input"
                value={tempTable}
                onChange={(e) => setTempTable(e.target.value)}
                placeholder="Contoh: 04"
                maxLength={5}
                autoFocus
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn-primary">
              Simpan Meja
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
