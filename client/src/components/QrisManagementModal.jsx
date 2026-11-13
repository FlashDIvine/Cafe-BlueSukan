import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Upload, Trash2, X, Check, AlertCircle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { fetchQrisSettingsApi, updateQrisSettingsApi, deleteQrisSettingsApi } from '../services/api';

/**
 * Client-side Canvas Image Compressor
 * Resizes image to max 500px width and compresses to webp/jpeg (quality 0.8)
 * Keeps payload strictly under 300KB.
 */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak valid'));
      img.onload = () => {
        const MAX_WIDTH = 500;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first; fallback to jpeg
        let dataUrl = canvas.toDataURL('image/webp', 0.82);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        }

        // If still > 350,000 characters, compress further
        if (dataUrl.length > 350000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.65);
        }

        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export const QrisManagementModal = ({ isOpen, onClose, onSuccess }) => {
  const [merchantName, setMerchantName] = useState("Angkringan Blue'sukan Kopi");
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Load existing QRIS settings when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setStatusMessage(null);

    fetchQrisSettingsApi()
      .then((data) => {
        if (!isMounted) return;
        if (data?.qris_merchant_name) setMerchantName(data.qris_merchant_name);
        if (data?.qris_image) setPreviewImage(data.qris_image);
      })
      .catch((err) => {
        console.error('Failed to load QRIS settings:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Harap pilih file gambar (JPG, PNG, atau WebP).' });
      return;
    }

    try {
      setIsLoading(true);
      const compressed = await compressImage(file);
      setPreviewImage(compressed);
      setStatusMessage({ type: 'info', text: 'Gambar berhasil dimuat dan dikompresi (< 300KB).' });
    } catch (err) {
      console.error('Error compressing image:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Gagal memproses gambar.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      await updateQrisSettingsApi({
        qris_image: previewImage || null,
        qris_merchant_name: merchantName.trim() || "Angkringan Blue'sukan Kopi",
      });

      setStatusMessage({ type: 'success', text: 'Pengaturan QRIS berhasil disimpan!' });
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error('Failed to save QRIS:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Gagal menyimpan QRIS.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!window.confirm('Hapus gambar QRIS dagang ini? Pelanggan tidak akan melihat opsi bayar QRIS langsung.')) {
      return;
    }

    try {
      setIsSaving(true);
      await deleteQrisSettingsApi();
      setPreviewImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setStatusMessage({ type: 'info', text: 'Gambar QRIS berhasil dihapus.' });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to delete QRIS:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Gagal menghapus QRIS.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface, #FBF7EF)',
          border: '1.5px solid var(--color-border, #D5C7B2)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '460px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border, #D5C7B2)',
            backgroundColor: 'var(--brand-navy, #1B3B64)',
            color: '#FFFFFF',
            borderTopLeftRadius: '14px',
            borderTopRightRadius: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode size={18} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', fontFamily: 'inherit' }}>
                Pengaturan QRIS Dagang
              </h3>
              <span style={{ fontSize: '11px', opacity: 0.85 }}>
                Tampilkan barcode pembayaran di tiket pelanggan
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              opacity: 0.8,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {statusMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor:
                  statusMessage.type === 'error'
                    ? '#FEE2E2'
                    : statusMessage.type === 'success'
                    ? '#DCFCE7'
                    : '#E0F2FE',
                color:
                  statusMessage.type === 'error'
                    ? '#991B1B'
                    : statusMessage.type === 'success'
                    ? '#166534'
                    : '#075985',
                border: '1px solid currentColor',
              }}
            >
              {statusMessage.type === 'error' ? (
                <AlertCircle size={15} />
              ) : (
                <Check size={15} />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Merchant Name Field */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--text-primary, #1E1915)',
                marginBottom: '6px',
              }}
            >
              Nama Toko / Akun QRIS
            </label>
            <input
              type="text"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="Contoh: Angkringan Blue'sukan Kopi"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid var(--color-border, #D5C7B2)',
                backgroundColor: '#FFFFFF',
                fontSize: '13px',
                color: 'var(--text-primary, #1E1915)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* QRIS Image Upload & Preview Box */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--text-primary, #1E1915)',
                marginBottom: '6px',
              }}
            >
              Foto / Barcode QRIS Resmi
            </label>

            {previewImage ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1.5px dashed var(--color-border, #D5C7B2)',
                }}
              >
                <div
                  style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border, #D5C7B2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FAFAFA',
                  }}
                >
                  <img
                    src={previewImage}
                    alt="Preview QRIS"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: '600',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border, #D5C7B2)',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Upload size={13} />
                    <span>Ganti Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    style={{
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: '600',
                      borderRadius: '8px',
                      border: '1px solid #FCA5A5',
                      backgroundColor: '#FEF2F2',
                      color: '#B91C1C',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--color-border, #D5C7B2)',
                  borderRadius: '12px',
                  padding: '28px 16px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(27, 59, 100, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-navy, #1B3B64)',
                  }}
                >
                  <ImageIcon size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--brand-navy, #1B3B64)' }}>
                    Pilih File QRIS (Galeri / Foto)
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-secondary, #5A4D41)' }}>
                    Mendukung JPG, PNG, WebP • Otomatis dikompresi &lt; 300KB
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                flex: 1,
                padding: '11px 16px',
                borderRadius: '8px',
                border: '1.5px solid var(--color-border, #D5C7B2)',
                backgroundColor: '#FFFFFF',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-secondary, #5A4D41)',
                cursor: 'pointer',
              }}
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSaving || isLoading}
              style={{
                flex: 2,
                padding: '11px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--accent-amber, #C96A2B)',
                fontSize: '13px',
                fontWeight: '700',
                color: '#FFFFFF',
                cursor: isSaving || isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(201, 106, 43, 0.3)',
              }}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>Simpan Pengaturan QRIS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

