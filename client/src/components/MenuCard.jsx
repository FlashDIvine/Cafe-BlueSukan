import React from 'react';
import { Plus, Minus, Lock } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { formatRupiah } from '../utils/formatters';
import '../styles/menu-card.css';

export const MenuCard = ({ item }) => {
  const { addToCart, updateQty, getItemQtyInCart } = useOrder();

  const isOutOfStock = !item.is_available || item.stock <= 0;
  const isLowStock = !isOutOfStock && item.stock <= 5;
  const qtyInCart = getItemQtyInCart(item.id);

  const handleAdd = () => {
    if (isOutOfStock) return;
    addToCart(item, 1);
  };

  const handleIncrement = () => {
    if (qtyInCart < item.stock) {
      updateQty(item.id, qtyInCart + 1);
    }
  };

  const handleDecrement = () => {
    updateQty(item.id, qtyInCart - 1);
  };

  return (
    <article className={`menu-card ${isOutOfStock ? 'is-out-of-stock' : ''}`} aria-label={item.name}>
      {/* Menu Image & Badges */}
      <div className="menu-image-container">
        <img
          src={item.image_url}
          alt={item.name}
          className="menu-image"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=400&q=80';
          }}
        />
        {isOutOfStock ? (
          <span className="menu-badge-out">Habis</span>
        ) : item.is_popular ? (
          <span className="menu-badge-popular">Favorit</span>
        ) : null}
      </div>

      {/* Menu Info */}
      <div className="menu-info">
        <div className="menu-header-row">
          <h3 className="menu-title" title={item.name}>{item.name}</h3>
          <p className="menu-description">{item.description}</p>
        </div>

        <div className="menu-footer-row">
          <div className="menu-price-container">
            <span className="menu-price">{formatRupiah(item.price)}</span>
            {isOutOfStock ? (
              <span className="menu-stock-status out-of-stock">Stok Habis</span>
            ) : isLowStock ? (
              <span className="menu-stock-status low-stock">Sisa {item.stock} porsi</span>
            ) : (
              <span className="menu-stock-status">Sisa stok: {item.stock}</span>
            )}
          </div>

          {/* Action / Stepper */}
          <div className="menu-action-container">
            {isOutOfStock ? (
              <button
                type="button"
                className="btn-add-menu disabled"
                disabled
                aria-label={`Menu ${item.name} habis`}
              >
                <Lock size={12} />
                <span>Habis</span>
              </button>
            ) : qtyInCart > 0 ? (
              <div className="menu-stepper" aria-label={`Kuantitas ${item.name}`}>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={handleDecrement}
                  aria-label={`Kurangi kuantitas ${item.name}`}
                >
                  <Minus size={14} />
                </button>
                <span className="stepper-qty">{qtyInCart}</span>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={handleIncrement}
                  disabled={qtyInCart >= item.stock}
                  aria-label={`Tambah kuantitas ${item.name}`}
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-add-menu"
                onClick={handleAdd}
                aria-label={`Tambah ${item.name} ke keranjang`}
              >
                <Plus size={14} />
                <span>Tambah</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
