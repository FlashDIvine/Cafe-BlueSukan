import React, { useState, useEffect } from 'react';
import { X, Sparkles, Image, Check, AlertCircle } from 'lucide-react';

const PRESET_IMAGES = [
  { label: 'Es Kopi', url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80' },
  { label: 'Kopi Susu', url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80' },
  { label: 'Matcha', url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cokelat', url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80' },
  { label: 'Snack / Fries', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80' },
  { label: 'Pastry / Croissant', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80' },
  { label: 'Nasi Goreng', url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80' },
  { label: 'Pasta', url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80' },
];

export const MenuFormModal = ({ isOpen, onClose, onSubmit, initialMenu, categories }) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('coffee');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialMenu) {
      setName(initialMenu.name || '');
      setCategoryId(initialMenu.category_id || 'coffee');
      setPrice(String(initialMenu.price || ''));
      setStock(String(initialMenu.stock ?? 10));
      setImageUrl(initialMenu.image_url || '');
      setDescription(initialMenu.description || '');
      setIsAvailable(Boolean(initialMenu.is_available));
      setIsPopular(Boolean(initialMenu.is_popular));
    } else {
      setName('');
      setCategoryId('coffee');
      setPrice('');
      setStock('15');
      setImageUrl(PRESET_IMAGES[0].url);
      setDescription('');
      setIsAvailable(true);
      setIsPopular(false);
    }
    setErrorMsg('');
  }, [initialMenu, isOpen]);

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
      image_url: imageUrl.trim() || PRESET_IMAGES[0].url,
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
        style={{ maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}
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
          <div className="form-error-msg" style={{ marginBottom: '12px' }}>
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
                <option value="coffee">Kopi & Espresso</option>
                <option value="non-coffee">Non-Coffee</option>
                <option value="snacks">Makanan Ringan</option>
                <option value="food">Makanan Utama</option>
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

          {/* Preset Foto & Image URL */}
          <div className="form-group">
            <label className="form-label" htmlFor="menu-image-url">
              URL Foto Menu
            </label>
            <input
              id="menu-image-url"
              type="url"
              className="form-input"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-slate)' }}>Pilih Cepat Foto Preset:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {PRESET_IMAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-pill)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: imageUrl === preset.url ? 'var(--color-sky)' : 'var(--color-bg)',
                      color: imageUrl === preset.url ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      fontWeight: imageUrl === preset.url ? '700' : '500',
                      cursor: 'pointer',
                    }}
                    onClick={() => setImageUrl(preset.url)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
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
