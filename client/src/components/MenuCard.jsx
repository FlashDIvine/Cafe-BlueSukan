import React, { memo } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { formatRupiah } from '../utils/formatters';
import '../styles/menu-card.css';

export const MenuCard = memo(({ item }) => {
  const { addToCart, updateQty, getItemQtyInCart } = useOrder();

  const isOutOfStock = !item.is_available || item.stock <= 0;
  const isLowStock = !isOutOfStock && item.stock <= 5;
  const qtyInCart = getItemQtyInCart(item.id);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(item, 1);
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (qtyInCart < item.stock) {
      updateQty(item.id, qtyInCart + 1);
    }
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    updateQty(item.id, qtyInCart - 1);
  };

  return (
    <article
      className={`menu-item-row ${isOutOfStock ? 'is-out-of-stock' : ''}`}
    >
      <div className="menu-item-info">
        <div className="menu-item-title-row">
          <h3 className="menu-item-name">{item.name}</h3>
          {isOutOfStock && <span className="menu-item-badge-out">Habis</span>}
        </div>
        {item.description && (
          <p className="menu-item-desc">{item.description}</p>
        )}
        {isLowStock && (
          <span className="menu-item-stock-warning">Sisa {item.stock} porsi</span>
        )}
      </div>

      <div className="menu-item-actions-wrap">
        <span className="menu-item-price">
          {formatRupiah(item.price)}
        </span>

        {isOutOfStock ? (
          <span className="menu-item-disabled-tag">Habis</span>
        ) : qtyInCart > 0 ? (
          <div className="menu-item-stepper" role="group" aria-label={`Jumlah ${item.name}`}>
            <button
              type="button"
              className="stepper-btn"
              onClick={handleDecrement}
              aria-label={`Kurangi kuantitas ${item.name}`}
            >
              <Minus size={14} />
            </button>
            <span className="stepper-val">{qtyInCart}</span>
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
            className="menu-item-add-btn"
            onClick={handleAdd}
            aria-label={`Tambah ${item.name}`}
          >
            <Plus size={15} />
            <span>Tambah</span>
          </button>
        )}
      </div>
    </article>
  );
});

MenuCard.displayName = 'MenuCard';
