import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';

export const MenuFormModal = ({ isOpen, onClose, onSubmit, initialMenu, categories }) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('coffee');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const validCategories = (categories || []).filter((c) => c.id !== 'all');
  const defaultCatId = validCategories.length > 0 ? validCategories[0].id : 'coffee';

  useEffect(() => {
    if (initialMenu) {
      setName(initialMenu.name || '');
      setCategoryId(initialMenu.category_id || defaultCatId);
      setPrice(String(initialMenu.price || ''));
      setStock(String(initialMenu.stock ?? 10));
      setDescription(initialMenu.description || '');
      setIsAvailable(Boolean(initialMenu.is_available));
      setIsPopular(Boolean(initialMenu.is_popular));
    } else {
      setName('');
      setCategoryId(defaultCatId);
      setPrice('');
      setStock('15');
      setDescription('');
      setIsAvailable(true);
      setIsPopular(false);
    }
    setErrorMsg('');
  }, [initialMenu, isOpen, defaultCatId]);

  if (!isOpen) return null;

  const isEditMode = Boolean(initialMenu?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama menu wajib diisi');
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setErrorMsg('Harga menu harus berupa angka positif');
      return;
    }

    const payload = {
      name: name.trim(),
      category_id: categoryId,
      price: parseInt(price, 10),
      stock: Math.max(0, parseInt(stock, 10) || 0),
      description: description.trim(),
      is_available: isAvailable && (parseInt(stock, 10) || 0) > 0,
      is_popular: isPopular,
    };

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan menu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content-card"
        style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Sparkles size={18} color="var(--color-primary)" />
            <h3 className="modal-title">{isEditMode ? 'Edit Informasi Menu' : 'Tambah Menu Baru'}</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div className="form-error-msg" style={{ marginBottom: '12px', padding: '8px 12px', backgroundColor: '#FEE2E2', borderRadius: 'var(--radius-sm)' }}>
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Nama Menu */}
          <div className="form-group">
            <label className="form-label" htmlFor="menu-name">
              Nama Menu <span className="required-star">*</span>
            </label>
            <input
              id="menu-name"
              type="text"
              className="form-input"
              placeholder="Contoh: Kopi Pandan Latte"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Kategori & Harga */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="menu-category">
                Kategori <span className="required-star">*</span>
              </label>
              <select
                id="menu-category"
                className="form-input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {validCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="menu-price">
                Harga (Rp) <span className="required-star">*</span>
              </label>
              <input
                id="menu-price"
                type="number"
                min="0"
                step="500"
                className="form-input"
                placeholder="25000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Stok Awal */}
          <div className="form-group">
            <label className="form-label" htmlFor="menu-stock">
              Stok Porsi
            </label>
            <input
              id="menu-stock"
              type="number"
              min="0"
              className="form-input"
              placeholder="10"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>

          {/* Deskripsi */}
          <div className="form-group">
            <label className="form-label" htmlFor="menu-desc">
              Deskripsi Singkat
            </label>
            <textarea
              id="menu-desc"
              className="form-textarea"
              rows={2}
              placeholder="Jelaskan cita rasa atau bahan utama..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Switch Status & Checkbox Favorit */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
              />
              <span>Tersedia untuk Dipesan</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
              />
              <span>Tandai Menu Favorit</span>
            </label>
          </div>

          {/* Actions */}
          <div className="modal-actions" style={{ marginTop: '10px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Tambah Menu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
