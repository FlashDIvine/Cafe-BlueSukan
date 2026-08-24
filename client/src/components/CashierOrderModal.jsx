import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Ban,
  User,
  MapPin,
  FileText,
  Banknote,
  QrCode,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { CashierAddMenuModal } from './CashierAddMenuModal';

export const CashierOrderModal = ({
  isOpen,
  onClose,
  order,
  allMenus,
  onUpdateItems,
  onCancelOrder,
  onApproveOrder,
}) => {
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order?.items) {
      setItems(
        order.items.map((it) => ({
          menu_id: it.menu_id || it.menuId,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          subtotal: it.subtotal || it.price * it.quantity,
        }))
      );
    }
    if (order?.payment_method) {
      setPaymentMethod(order.payment_method);
    } else {
      setPaymentMethod('cash');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const isWaitingPayment = order.status === 'waiting_payment';

  // Calculate live total price from items
  const currentTotalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Stepper handlers
  const handleUpdateQty = (menuId, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(menuId);
      return;
    }

    const menuInfo = allMenus.find((m) => m.id === menuId);
    if (menuInfo && newQty > menuInfo.stock) {
      alert(`Maksimal pesanan ${menuInfo.name} adalah ${menuInfo.stock} porsi (sisa stok).`);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.menu_id === menuId) {
          return {
            ...item,
            quantity: newQty,
            subtotal: newQty * item.price,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (menuId) => {
    if (items.length <= 1) {
      alert('Pesanan harus memiliki minimal 1 item. Jika ingin menghapus seluruh pesanan, gunakan tombol "Batalkan Pesanan".');
      return;
    }
    setItems((prev) => prev.filter((item) => item.menu_id !== menuId));
  };

  const handleAddMenuItem = (menu) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.menu_id === menu.id);
      if (existing) {
        return prev.map((it) =>
          it.menu_id === menu.id
            ? { ...it, quantity: it.quantity + 1, subtotal: (it.quantity + 1) * it.price }
            : it
        );
      }
      return [
        ...prev,
        {
          menu_id: menu.id,
          name: menu.name,
          price: menu.price,
          quantity: 1,
          subtotal: menu.price,
        },
      ];
    });
  };

  // Submit approval flow
  const handleConfirmAndApprove = async () => {
    if (items.length === 0) {
      alert('Pesanan harus memiliki minimal 1 item');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update items in backend if changed
      await onUpdateItems(order.id, items);
      // 2. Approve payment & deduct stock
      await onApproveOrder(order.id, paymentMethod);
      onClose();
    } catch (err) {
      alert(err.message || 'Gagal memproses persetujuan pesanan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (window.confirm(`Yakin ingin membatalkan pesanan ${order.order_code}?`)) {
      setIsSubmitting(true);
      try {
        await onCancelOrder(order.id);
        onClose();
      } catch (err) {
        alert(err.message || 'Gagal membatalkan pesanan');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
        <div className="cashier-modal-container" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="cashier-modal-header">
            <div className="cashier-modal-title-group">
              <span style={{ fontSize: '18px', fontWeight: '800' }}>{order.order_code}</span>
              <span className={`status-badge ${order.status === 'paid_processing' ? 'processing' : order.status}`}>
                {order.status === 'waiting_payment'
                  ? 'Menunggu Pembayaran'
                  : order.status === 'paid_processing'
                  ? 'Sedang Diproses'
                  : order.status === 'completed'
                  ? 'Selesai'
                  : 'Dibatalkan'}
              </span>
            </div>
            <button type="button" className="cashier-modal-close-btn" onClick={onClose} aria-label="Tutup">
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="cashier-modal-body">
            {/* Customer & Table Info */}
            <div className="customer-summary-box">
              <div className="summary-meta-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-slate)' }}>
                  <User size={14} /> Pemesan:
                </span>
                <strong style={{ color: 'var(--color-text-main)' }}>{order.customer_name}</strong>
              </div>
              <div className="summary-meta-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-slate)' }}>
                  <MapPin size={14} /> Nomor Meja:
                </span>
                <strong style={{ color: 'var(--color-accent)' }}>Meja {order.table_number}</strong>
              </div>
              {order.notes && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#92400E', backgroundColor: '#FEF3C7', padding: '6px 8px', borderRadius: '4px' }}>
                  <strong>Catatan Pelanggan:</strong> {order.notes}
                </div>
              )}
            </div>

            {/* Editable Items */}
            <div className="editable-items-section">
              <div className="items-section-header">
                <span className="section-label">Daftar Menu Pesanan</span>
                {isWaitingPayment && (
                  <button
                    type="button"
                    className="btn-add-item-modal"
                    onClick={() => setIsAddMenuOpen(true)}
                  >
                    <Plus size={13} />
                    <span>Tambah Menu</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map((item) => {
                  const menuInfo = allMenus.find((m) => m.id === item.menu_id);
                  const maxStock = menuInfo ? menuInfo.stock : 99;

                  return (
                    <div key={item.menu_id} className="editable-item-row">
                      <div className="editable-item-info">
                        <span className="editable-item-name">{item.name}</span>
                        <span className="editable-item-price">
                          {formatRupiah(item.price)} x {item.quantity}
                        </span>
                        <span className="editable-item-subtotal">
                          {formatRupiah(item.price * item.quantity)}
                        </span>
                      </div>

                      {isWaitingPayment ? (
                        <div className="editable-controls">
                          <div className="cart-stepper">
                            <button
                              type="button"
                              className="cart-stepper-btn"
                              onClick={() => handleUpdateQty(item.menu_id, item.quantity - 1)}
                              aria-label="Kurangi kuantitas"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="cart-stepper-qty">{item.quantity}</span>
                            <button
                              type="button"
                              className="cart-stepper-btn"
                              onClick={() => handleUpdateQty(item.menu_id, item.quantity + 1)}
                              disabled={item.quantity >= maxStock}
                              aria-label="Tambah kuantitas"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <button
                            type="button"
                            className="btn-remove-item"
                            onClick={() => handleRemoveItem(item.menu_id)}
                            title="Hapus menu"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '13px' }}>
                          {item.quantity}x
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Bill Box */}
            <div className="bill-summary-box">
              <div className="bill-row total-row" style={{ borderTop: 'none', paddingTop: 0 }}>
                <span>Total Tagihan</span>
                <span>{formatRupiah(currentTotalPrice)}</span>
              </div>
            </div>

            {/* Payment Method Selector (Only when waiting_payment) */}
            {isWaitingPayment && (
              <div className="payment-method-section">
                <span className="section-label">Pilih Metode Pembayaran</span>
                <div className="payment-options-grid">
                  <button
                    type="button"
                    className={`payment-radio-btn ${paymentMethod === 'cash' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <Banknote size={18} />
                    <span>Tunai (Cash)</span>
                  </button>

                  <button
                    type="button"
                    className={`payment-radio-btn ${paymentMethod === 'qris' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('qris')}
                  >
                    <QrCode size={18} />
                    <span>QRIS</span>
                  </button>

                  <button
                    type="button"
                    className={`payment-radio-btn ${paymentMethod === 'debit' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('debit')}
                  >
                    <CreditCard size={18} />
                    <span>Kartu Debit</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {isWaitingPayment && (
            <div className="cashier-modal-footer">
              <button
                type="button"
                className="btn-cancel-order"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                <Ban size={14} />
                <span>Batalkan</span>
              </button>

              <button
                type="button"
                className="btn-approve-payment"
                onClick={handleConfirmAndApprove}
                disabled={isSubmitting || items.length === 0}
              >
                <CheckCircle2 size={18} />
                <span>
                  {isSubmitting ? 'Memproses...' : `Konfirmasi Bayar (${formatRupiah(currentTotalPrice)})`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Menu Sub-modal */}
      <CashierAddMenuModal
        isOpen={isAddMenuOpen}
        onClose={() => setIsAddMenuOpen(false)}
        allMenus={allMenus}
        currentItems={items}
        onAddMenuItem={handleAddMenuItem}
      />
    </>
  );
};
