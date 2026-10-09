import React, { useState } from 'react';
import { X, MapPin, Coffee, Trees, Building2, Check } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { SEATING_AREAS } from '../utils/formatters';
import '../styles/modal.css';

export const TableModal = ({ isOpen, onClose }) => {
  const { tableNumber, setTableNumber, showToast } = useOrder();
  const [selectedArea, setSelectedArea] = useState(tableNumber || 'Indoor');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setTableNumber(selectedArea);
    showToast(`Lokasi duduk diubah ke ${selectedArea}`, 'success');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <MapPin size={18} className="modal-title-icon" />
            <h2 className="modal-title">Pilih Lokasi Duduk</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            <p className="modal-desc">
              Pilih area tempat Anda duduk di BlueSukan Cafe untuk mempermudah barista mengantarkan pesanan.
            </p>
            <div className="seating-selector-grid">
              {SEATING_AREAS.map((area) => {
                const isSelected = selectedArea === area.name;
                return (
                  <button
                    key={area.id}
                    type="button"
                    className={`seating-choice-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedArea(area.name)}
                    aria-pressed={isSelected}
                  >
                    <div className="seating-choice-icon-wrap">
                      {area.id === 'indoor' && <Coffee size={18} />}
                      {area.id === 'outdoor' && <Trees size={18} />}
                      {area.id === 'lt2' && <Building2 size={18} />}
                    </div>
                    <div className="seating-choice-text">
                      <strong className="seating-choice-title">{area.label}</strong>
                      <span className="seating-choice-desc">{area.desc}</span>
                    </div>
                    {isSelected && (
                      <div className="seating-choice-check">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn-primary">
              Simpan Lokasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
