import React from 'react';
import { Plus, Minus, Lock, Star } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { formatRupiah } from '../utils/formatters';

export const RecommendedCard = ({ item }) => {
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
      className={`stitch-recommended-card ${isOutOfStock ? 'is-out-of-stock' : ''}`}
      aria-label={item.name}
    >
      {/* Product Image & Badges */}
      <div className="stitch-rec-image-wrap">
        <img
          src={item.image_url}
          alt={item.name}
          className="stitch-rec-image"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=400&q=80';
          }}
        />
        {isOutOfStock ? (
          <span className="stitch-badge-out">Habis</span>
        ) : item.is_popular ? (
          <span className="stitch-badge-bestseller">BESTSELLER</span>
        ) : null}

        {/* Rating pill */}
        {!isOutOfStock && (
          <div className="stitch-rating-badge">
            <Star size={11} fill="#F59E0B" color="#F59E0B" />
            <span>4.9</span>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="stitch-rec-content">
        <h3 className="stitch-rec-title" title={item.name}>
          {item.name}
        </h3>
        <p className="stitch-rec-desc">
          {item.description || 'Pilihan menu istimewa Bantu Cafe'}
        </p>

        <div className="stitch-rec-footer">
          <div className="stitch-rec-price-wrap">
            <span className="stitch-rec-price">{formatRupiah(item.price)}</span>
            {isLowStock && (
              <span className="stitch-low-stock-tag">Sisa {item.stock}</span>
            )}
          </div>

          {/* Action button / Stepper */}
          <div className="stitch-rec-action">
            {isOutOfStock ? (
              <button
                type="button"
                className="stitch-btn-disabled"
                disabled
                aria-label={`Menu ${item.name} habis`}
              >
                <Lock size={12} />
              </button>
            ) : qtyInCart > 0 ? (
              <div className="stitch-stepper-compact">
                <button
                  type="button"
                  className="stitch-stepper-btn"
                  onClick={handleDecrement}
                  aria-label={`Kurangi kuantitas ${item.name}`}
                >
                  <Minus size={12} />
                </button>
                <span className="stitch-stepper-val">{qtyInCart}</span>
                <button
                  type="button"
                  className="stitch-stepper-btn"
                  onClick={handleIncrement}
                  disabled={qtyInCart >= item.stock}
                  aria-label={`Tambah kuantitas ${item.name}`}
                >
                  <Plus size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="stitch-btn-add-primary"
                onClick={handleAdd}
                aria-label={`Tambah ${item.name} ke keranjang`}
              >
                <Plus size={16} strokeWidth={2.6} />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
