import React, { useState, memo } from 'react';
import { Plus, Minus, Lock, Heart } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { formatRupiah } from '../utils/formatters';
import { getOptimizedImageUrl, FALLBACK_IMAGE } from '../utils/imageOptimizer';
import '../styles/menu-card.css';

export const MenuCard = memo(({ item }) => {
  const { addToCart, updateQty, getItemQtyInCart } = useOrder();
  const [isLiked, setIsLiked] = useState(false);

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

  const toggleLike = (e) => {
    e.stopPropagation();
    setIsLiked((prev) => !prev);
  };

  const optimizedSrc = getOptimizedImageUrl(item.image_url, { width: 300, quality: 75 });

  return (
    <article
      className={`stitch-grid-card ${isOutOfStock ? 'is-out-of-stock' : ''}`}
      aria-label={item.name}
    >
      {/* Product Image & Badges */}
      <div className="stitch-grid-image-wrap">
        <img
          src={optimizedSrc}
          alt={item.name}
          className="stitch-grid-image"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK_IMAGE;
          }}
        />

        {/* Status badges */}
        {isOutOfStock ? (
          <span className="stitch-grid-badge-out">Habis</span>
        ) : item.is_popular ? (
          <span className="stitch-grid-badge-new">Favorit</span>
        ) : null}

        {/* Favorite Heart Button */}
        <button
          type="button"
          className={`stitch-grid-heart-btn ${isLiked ? 'liked' : ''}`}
          onClick={toggleLike}
          aria-label={isLiked ? 'Hapus favorit' : 'Tambah favorit'}
        >
          <Heart
            size={14}
            fill={isLiked ? '#EF4444' : 'none'}
            color={isLiked ? '#EF4444' : '#64748B'}
            strokeWidth={2.2}
          />
        </button>
      </div>

      {/* Product Information */}
      <div className="stitch-grid-content">
        <h3 className="stitch-grid-title" title={item.name}>
          {item.name}
        </h3>

        {isLowStock && (
          <span className="stitch-grid-stock-warning">Sisa {item.stock} porsi</span>
        )}

        <div className="stitch-grid-footer">
          <span className="stitch-grid-price">{formatRupiah(item.price)}</span>

          {/* Action button / Stepper */}
          <div className="stitch-grid-action">
            {isOutOfStock ? (
              <button
                type="button"
                className="stitch-btn-disabled-circle"
                disabled
                aria-label={`Menu ${item.name} habis`}
              >
                <Lock size={11} />
              </button>
            ) : qtyInCart > 0 ? (
              <div className="stitch-grid-stepper">
                <button
                  type="button"
                  className="stitch-grid-stepper-btn"
                  onClick={handleDecrement}
                  aria-label={`Kurangi kuantitas ${item.name}`}
                >
                  <Minus size={11} />
                </button>
                <span className="stitch-grid-stepper-val">{qtyInCart}</span>
                <button
                  type="button"
                  className="stitch-grid-stepper-btn"
                  onClick={handleIncrement}
                  disabled={qtyInCart >= item.stock}
                  aria-label={`Tambah kuantitas ${item.name}`}
                >
                  <Plus size={11} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="stitch-grid-btn-add"
                onClick={handleAdd}
                aria-label={`Tambah ${item.name} ke keranjang`}
              >
                <Plus size={14} strokeWidth={2.4} />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});

MenuCard.displayName = 'MenuCard';
