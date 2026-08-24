import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  User,
  MapPin,
  FileText,
  AlertCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { formatRupiah } from '../utils/formatters';
import '../styles/cart-drawer.css';

export const CartDrawer = ({ isOpen, onClose, onProceedToCheckout }) => {
  const {
    cartItems,
    updateQty,
    removeFromCart,
    clearCart,
    totalItemsCount,
    grandTotalPrice,
    customerName,
    setCustomerName,
    tableNumber,
    setTableNumber,
    notes,
    setNotes,
    showToast,
  } = useOrder();

  const [touched, setTouched] = useState({
    name: false,
    table: false,
  });

  if (!isOpen) return null;

  const isNameValid = customerName.trim().length >= 2;
  const isTableValid = tableNumber.trim().length >= 1;
  const isCartValid = cartItems.length > 0;
  const canSubmit = isCartValid && isNameValid && isTableValid;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, table: true });

    if (!isCartValid) {
      showToast('Keranjang belanja Anda masih kosong', 'warning');
      return;
    }

    if (!isNameValid) {
      showToast('Mohon masukkan nama pemesan (minimal 2 karakter)', 'warning');
      return;
    }

    if (!isTableValid) {
      showToast('Mohon masukkan nomor meja', 'warning');
      return;
    }

    const orderPayload = {
      customer_name: customerName.trim(),
      table_number: tableNumber.trim(),
      notes: notes.trim() || null,
      total_price: grandTotalPrice,
      items: cartItems.map((item) => ({
        menu_id: item.menuId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })),
    };

    if (onProceedToCheckout) {
      onProceedToCheckout(orderPayload);
    } else {
      showToast('Pesanan siap diproses!', 'success');
    }
  };

  const handleClear = () => {
    if (window.confirm('Kosongkan semua item di keranjang?')) {
      clearCart();
      showToast('Keranjang telah dikosongkan', 'info');
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        {/* Pull bar */}
        <div className="drawer-pull-bar-wrap">
          <div className="drawer-pull-bar"></div>
        </div>

        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-header-left">
            <h2 className="drawer-header-title">Keranjang Pesanan</h2>
            {cartItems.length > 0 && (
              <span className="drawer-items-count-badge">{totalItemsCount} Item</span>
            )}
          </div>

          <div className="drawer-header-right">
            {cartItems.length > 0 && (
              <button
                type="button"
                className="btn-clear-cart"
                onClick={handleClear}
                title="Kosongkan Keranjang"
              >
                Kosongkan
              </button>
            )}
            <button
              type="button"
              className="drawer-close-btn"
              onClick={onClose}
              aria-label="Tutup Keranjang"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="drawer-scroll-body">
          {cartItems.length === 0 ? (
            <div className="cart-drawer-empty">
              <div className="cart-drawer-empty-icon">
                <ShoppingBag size={28} />
              </div>
              <h3 className="cart-drawer-empty-title">Keranjang Anda Masih Kosong</h3>
              <p className="cart-drawer-empty-desc">
                Yuk pilih menu kopi, minuman segar, atau makanan favoritmu dari katalog!
              </p>
              <button type="button" className="btn-primary" onClick={onClose} style={{ marginTop: '8px' }}>
                Lihat Menu
              </button>
            </div>
          ) : (
            <>
              {/* Section 1: Selected Items */}
              <section aria-label="Daftar Menu yang Dipilih">
                <h3 className="drawer-section-title">
                  <ShoppingBag size={15} color="var(--color-primary)" />
                  Menu yang Dipilih
                </h3>
                <div className="cart-items-list">
                  {cartItems.map((item) => (
                    <div key={item.menuId} className="cart-item-card">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="cart-item-thumbnail"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=200&q=80';
                        }}
                      />
                      <div className="cart-item-details">
                        <span className="cart-item-name">{item.name}</span>
                        <span className="cart-item-unit-price">{formatRupiah(item.price)}</span>
                        <span className="cart-item-subtotal">{formatRupiah(item.subtotal)}</span>
                      </div>

                      <div className="cart-item-controls">
                        <div className="cart-stepper">
                          <button
                            type="button"
                            className="cart-stepper-btn"
                            onClick={() => updateQty(item.menuId, item.quantity - 1)}
                            aria-label={`Kurangi kuantitas ${item.name}`}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="cart-stepper-qty">{item.quantity}</span>
                          <button
                            type="button"
                            className="cart-stepper-btn"
                            onClick={() => updateQty(item.menuId, item.quantity + 1)}
                            disabled={item.quantity >= item.maxStock}
                            aria-label={`Tambah kuantitas ${item.name}`}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <button
                          type="button"
                          className="btn-remove-item"
                          onClick={() => removeFromCart(item.menuId)}
                          aria-label={`Hapus ${item.name} dari keranjang`}
                          title="Hapus menu"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 2: Checkout Identity Form */}
              <form id="checkout-form" onSubmit={handleSubmit} className="checkout-form-container">
                <h3 className="drawer-section-title" style={{ marginBottom: 0 }}>
                  <User size={15} color="var(--color-primary)" />
                  Informasi Pemesan
                </h3>

                {/* Input Nama Pemesan */}
                <div className="form-group">
                  <div className="form-label-row">
                    <label htmlFor="customer-name-input" className="form-label">
                      Nama Pemesan <span className="required-star">*</span>
                    </label>
                  </div>
                  <input
                    id="customer-name-input"
                    type="text"
                    className={`form-input ${touched.name && !isNameValid ? 'input-error' : ''}`}
                    placeholder="Masukkan nama Anda (misal: Budi)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                    autoComplete="name"
                    required
                  />
                  {touched.name && !isNameValid && (
                    <div className="form-error-msg" role="alert">
                      <AlertCircle size={13} />
                      <span>Nama pemesan wajib diisi (minimal 2 huruf)</span>
                    </div>
                  )}
                </div>

                {/* Input Nomor Meja */}
                <div className="form-group">
                  <div className="form-label-row">
                    <label htmlFor="drawer-table-input" className="form-label">
                      Nomor Meja <span className="required-star">*</span>
                    </label>
                    <span className="table-badge-tip">Sesuai stiker meja</span>
                  </div>
                  <div className="table-input-compact-wrap">
                    <input
                      id="drawer-table-input"
                      type="text"
                      className={`form-input table-input-compact ${
                        touched.table && !isTableValid ? 'input-error' : ''
                      }`}
                      placeholder="04"
                      maxLength={5}
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, table: true }))}
                      required
                    />
                    <span className="table-badge-tip">Otomatis dari scan QR</span>
                  </div>
                  {touched.table && !isTableValid && (
                    <div className="form-error-msg" role="alert">
                      <AlertCircle size={13} />
                      <span>Nomor meja wajib diisi</span>
                    </div>
                  )}
                </div>

                {/* Textarea Catatan Tambahan */}
                <div className="form-group">
                  <div className="form-label-row">
                    <label htmlFor="order-notes-input" className="form-label">
                      Catatan Tambahan
                    </label>
                    <span className="form-optional-tag">Opsional</span>
                  </div>
                  <textarea
                    id="order-notes-input"
                    className="form-textarea"
                    placeholder="Contoh: Kopi gula aren less sugar, sambal dipisah..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </form>

              {/* Section 3: Bill Breakdown */}
              <section className="bill-summary-box" aria-label="Rincian Pembayaran">
                <div className="bill-row">
                  <span>Subtotal ({totalItemsCount} Menu)</span>
                  <strong>{formatRupiah(grandTotalPrice)}</strong>
                </div>
                <div className="bill-row">
                  <span>Pajak & Layanan</span>
                  <span>Termasuk</span>
                </div>
                <div className="bill-row total-row">
                  <span>Total Pembayaran</span>
                  <span>{formatRupiah(grandTotalPrice)}</span>
                </div>
                <div className="bill-info-notice">
                  <Info size={14} flexShrink={0} />
                  <span>Verifikasi & pembayaran dilakukan langsung di kasir (Cash/QRIS).</span>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Drawer Sticky Footer Checkout CTA */}
        {cartItems.length > 0 && (
          <div className="drawer-footer">
            <button
              type="submit"
              form="checkout-form"
              className="btn-checkout-submit"
              disabled={!canSubmit}
              aria-label="Pesan Sekarang dan Lanjut ke Pembayaran"
            >
              <div className="checkout-btn-left">
                <ShoppingBag size={18} />
                <span>Pesan Sekarang</span>
              </div>
              <div className="checkout-btn-right">
                <span>{formatRupiah(grandTotalPrice)}</span>
                <ArrowRight size={18} />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
