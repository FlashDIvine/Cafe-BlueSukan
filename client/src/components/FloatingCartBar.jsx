import React, { memo } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { formatRupiah } from '../utils/formatters';
import '../styles/floating-cart.css';

export const FloatingCartBar = memo(({ onOpenCart }) => {
  const { totalItemsCount, grandTotalPrice, cartItems } = useOrder();

  if (!totalItemsCount || totalItemsCount <= 0 || cartItems.length === 0) {
    return null;
  }

  return (
    <aside className="floating-cart-wrapper" aria-label="Ringkasan Keranjang Belanja">
      <div className="floating-cart-inner">
        <div className="cart-summary-left">
          <div className="cart-icon-badge-container" aria-hidden="true">
            <ShoppingBag size={20} />
            <span className="cart-count-badge">{totalItemsCount}</span>
          </div>
          <div className="cart-pricing-text">
            <span className="cart-items-label">{totalItemsCount} menu dipilih</span>
            <span className="cart-total-price">{formatRupiah(grandTotalPrice)}</span>
          </div>
        </div>

        <button
          type="button"
          className="btn-view-cart"
          onClick={onOpenCart}
          aria-label="Lihat pesanan"
        >
          <span>Lihat pesanan</span>
        </button>
      </div>
    </aside>
  );
});

FloatingCartBar.displayName = 'FloatingCartBar';
