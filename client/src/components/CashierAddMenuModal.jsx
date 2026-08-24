import React, { useState } from 'react';
import { X, Plus, Search, Check } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export const CashierAddMenuModal = ({ isOpen, onClose, allMenus, currentItems, onAddMenuItem }) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredMenus = allMenus.filter((menu) => {
    const matchesSearch =
      search.trim() === '' ||
      menu.name.toLowerCase().includes(search.toLowerCase()) ||
      menu.category_name?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleSelect = (menu) => {
    onAddMenuItem(menu);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content-card"
        style={{ maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Plus size={18} color="var(--color-primary)" />
            <h3 className="modal-title">Tambah Menu ke Pesanan</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        <div className="pos-search-wrapper" style={{ marginBottom: '14px' }}>
          <Search size={14} className="pos-search-icon" />
          <input
            type="text"
            className="pos-search-input"
            placeholder="Cari nama menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredMenus.map((menu) => {
            const isOutOfStock = !menu.is_available || menu.stock <= 0;
            const alreadyInOrder = currentItems.some((it) => (it.menu_id || it.menuId) === menu.id);

            return (
              <div
                key={menu.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: isOutOfStock ? '#F8FAFC' : 'var(--color-white)',
                  opacity: isOutOfStock ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-main)' }}>
                    {menu.name}
                  </span>
                  <span style={{ fontSize: '11.5px', color: 'var(--color-slate)' }}>
                    {formatRupiah(menu.price)} • Sisa stok: {menu.stock}
                  </span>
                </div>

                <button
                  type="button"
                  className="btn-add-item-modal"
                  disabled={isOutOfStock}
                  onClick={() => handleSelect(menu)}
                >
                  {alreadyInOrder ? (
                    <>
                      <Check size={12} />
                      <span>Tambah Lagi</span>
                    </>
                  ) : (
                    <>
                      <Plus size={12} />
                      <span>Pilih</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
