import React, { memo } from 'react';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { formatRupiah } from '../utils/formatters';
import '../styles/floating-cart.css';

export const FloatingCartBar = memo(({ onOpenCart }) => {
  const { totalItemsCount, grandTotalPrice, cartItems } = useOrder();

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <aside className="floating-cart-wrapper" aria-label="Ringkasan Keranjang Belanja">
      <div className="floating-cart-inner">
        <div className="cart-summary-left">
          <div className="cart-icon-badge-container">
            <ShoppingBag size={20} />
            <span className="cart-count-badge">{totalItemsCount}</span>
          </div>
          <div className="cart-pricing-text">
            <span className="cart-items-label">{totalItemsCount} Menu Dipilih</span>
            <span className="cart-total-price">{formatRupiah(grandTotalPrice)}</span>
          </div>
        </div>

        <button
          type="button"
          className="btn-view-cart"
          onClick={onOpenCart}
          aria-label="Lihat Pesanan dan Lanjut Checkout"
        >
          <span>Lihat Pesanan</span>
          <ChevronRight size={16} strokeWidth={2.6} />
        </button>
      </div>
    </aside>
  );
});

FloatingCartBar.displayName = 'FloatingCartBar';
