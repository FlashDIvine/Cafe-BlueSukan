import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Upload, Image as ImageIcon, Trash2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { convertImageToWebP } from '../utils/imageConverter';

const PRESET_IMAGES = [
  { label: 'Es Kopi', url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80&fm=webp' },
  { label: 'Kopi Susu', url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80&fm=webp' },
  { label: 'Matcha', url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80&fm=webp' },
  { label: 'Cokelat', url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80&fm=webp' },
  { label: 'Snack / Fries', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80&fm=webp' },
  { label: 'Pastry', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80&fm=webp' },
  { label: 'Nasi Goreng', url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80&fm=webp' },
  { label: 'Pasta', url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80&fm=webp' },
];

export const MenuFormModal = ({ isOpen, onClose, onSubmit, initialMenu, categories }) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('coffee');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  const [imageSizeText, setImageSizeText] = useState('');
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef(null);

  const validCategories = (categories || []).filter((c) => c.id !== 'all');
  const defaultCatId = validCategories.length > 0 ? validCategories[0].id : 'coffee';

  useEffect(() => {
    if (initialMenu) {
      setName(initialMenu.name || '');
      setCategoryId(initialMenu.category_id || defaultCatId);
      setPrice(String(initialMenu.price || ''));
      setStock(String(initialMenu.stock ?? 10));
      setImageUrl(initialMenu.image_url || '');
      setImageSizeText('');
      setDescription(initialMenu.description || '');
      setIsAvailable(Boolean(initialMenu.is_available));
      setIsPopular(Boolean(initialMenu.is_popular));
    } else {
      setName('');
      setCategoryId(defaultCatId);
      setPrice('');
      setStock('15');
      setImageUrl(PRESET_IMAGES[0].url);
      setImageSizeText('');
      setDescription('');
      setIsAvailable(true);
      setIsPopular(false);
    }
    setErrorMsg('');
    setImageError('');
    setIsConverting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [initialMenu, isOpen, defaultCatId]);

  if (!isOpen) return null;

  const isEditMode = Boolean(initialMenu?.id);

  // Client-Side Image Conversion & Optimization to WebP (JPG, PNG, WebP -> WebP <= 2MB)
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');
    setIsConverting(true);

    try {
      const result = await convertImageToWebP(file);
      setImageUrl(result.dataUrl);
      setImageSizeText(result.sizeText);
      setImageError('');
    } catch (err) {
      setImageError(err.message || 'Gagal memproses gambar');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsConverting(false);
    }
  };

  const handleClearImage = () => {
    setImageUrl('');
    setImageSizeText('');
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
    if (isConverting) {
      setErrorMsg('Sedang mengonversi gambar, mohon tunggu sebentar');
      return;
    }
    if (imageError) {
      setErrorMsg('Perbaiki kesalahan pada file gambar sebelum menyimpan');
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

          {/* Upload Foto Menu (JPG, PNG, WebP -> Auto Convert to WebP <= 2MB) */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">
                Foto Menu <span className="form-optional-tag">(JPG / PNG / WebP, maks. 2 MB)</span>
              </label>
              {imageUrl && !isConverting && (
                <button
                  type="button"
                  onClick={handleClearImage}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-danger)',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Trash2 size={12} />
                  <span>Hapus Gambar</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              id="menu-webp-upload-input"
              style={{ display: 'none' }}
              onChange={handleImageFileChange}
              disabled={isConverting}
            />

            {isConverting ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '20px',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--color-primary)',
                  color: 'var(--color-primary)',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                <Loader2 size={18} className="animate-spin" />
                <span>Mengonversi & mengompresi gambar ke format WebP...</span>
              </div>
            ) : imageUrl ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '10px 14px',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                  <img
                    src={imageUrl}
                    alt="Preview Menu"
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: 'var(--radius-sm)',
                      objectFit: 'cover',
                      border: '1.5px solid var(--color-primary)',
                      backgroundColor: 'var(--color-sky)',
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = PRESET_IMAGES[0].url;
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--color-text-main)' }}>
                      Format WebP Siap
                    </span>
                    {imageSizeText && (
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: '800',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: '#D1FAE5',
                          color: '#065F46',
                        }}
                      >
                        {imageSizeText}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-slate)' }}>
                    Otomatis dikonversi ke WebP terkompresi
                  </span>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-sm)',
                        width: 'auto',
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <RefreshCw size={12} />
                      <span>Ganti Gambar</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  textAlign: 'center',
                  backgroundColor: 'var(--color-bg)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-sky)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Upload size={18} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)' }}>
                  Pilih / Unggah Gambar (JPG, PNG, WebP)
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-slate)' }}>
                  Otomatis dikonversi ke WebP berkualitas tinggi (maks. 2 MB)
                </div>
              </div>
            )}

            {/* Error Message for WebP Image Validation */}
            {imageError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--color-danger-dark)',
                  backgroundColor: 'var(--color-danger-light)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginTop: '4px',
                }}
              >
                <AlertCircle size={14} />
                <span>{imageError}</span>
              </div>
            )}

            {/* Quick Preset Photos (WebP) */}
            <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-slate)' }}>Atau pilih cepat foto preset (WebP):</span>
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
                    onClick={() => {
                      setImageUrl(preset.url);
                      setImageSizeText('');
                      setImageError('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
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
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting || isConverting}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting || isConverting}>
              {isSubmitting ? 'Menyimpan...' : isConverting ? 'Mengonversi...' : isEditMode ? 'Simpan Perubahan' : 'Tambah Menu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



