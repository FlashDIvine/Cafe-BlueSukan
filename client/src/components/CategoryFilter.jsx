import React, { useMemo, memo } from 'react';
import { CATEGORIES } from '../data/mockMenus';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import '../styles/category-filter.css';

const DEFAULT_CATEGORY_IMAGES = {
  all: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=120&q=70&fm=webp',
  'makanan-utama': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=120&q=70&fm=webp',
  'cemilan-gorengan': 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=120&q=70&fm=webp',
  'minuman-kopi': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=120&q=70&fm=webp',
  'minuman-susu-coklat': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=120&q=70&fm=webp',
  'minuman-teh-lainnya': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=120&q=70&fm=webp',
  // Legacy aliases
  coffee: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=120&q=70&fm=webp',
  'non-coffee': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=120&q=70&fm=webp',
  snacks: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=120&q=70&fm=webp',
  food: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=120&q=70&fm=webp',
};

const getCategoryImageUrl = (cat) => {
  if (cat?.image && typeof cat.image === 'string' && cat.image.trim()) {
    return getOptimizedImageUrl(cat.image.trim(), { width: 120, quality: 70 });
  }
  const fallback = DEFAULT_CATEGORY_IMAGES[cat?.id] || DEFAULT_CATEGORY_IMAGES.all;
  return getOptimizedImageUrl(fallback, { width: 120, quality: 70 });
};

const getCategoryShortName = (cat) => {
  if (cat.id === 'all') return 'Semua';
  if (cat.id === 'makanan-utama') return 'Makanan';
  if (cat.id === 'cemilan-gorengan') return 'Cemilan';
  if (cat.id === 'minuman-kopi') return 'Kopi';
  if (cat.id === 'minuman-susu-coklat') return 'Susu & Coklat';
  if (cat.id === 'minuman-teh-lainnya') return 'Teh & Lain';
  if (cat.id === 'coffee') return 'Kopi';
  if (cat.id === 'non-coffee') return 'Non-Kopi';
  if (cat.id === 'food') return 'Makanan';
  if (cat.id === 'snacks') return 'Cemilan';
  return cat.name;
};

export const CategoryFilter = memo(({
  categories = CATEGORIES,
  activeCategory,
  onSelectCategory,
  menusCountByCategory = {},
}) => {
  // Ensure 'all' option is available at the start if not present
  const displayCategories = useMemo(() => {
    const hasAll = categories.some((c) => c.id === 'all');
    if (!hasAll) {
      return [{ id: 'all', name: 'All' }, ...categories];
    }
    return categories;
  }, [categories]);

  return (
    <section className="food-category-section" aria-label="Kategori Menu">
      <div className="food-category-header">
        <h2 className="food-category-title">Category</h2>
      </div>

      <div className="food-category-scroll no-scrollbar" role="tablist">
        {displayCategories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const imgUrl = getCategoryImageUrl(cat);
          const label = getCategoryShortName(cat);

          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`food-category-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(isActive && cat.id !== 'all' ? 'all' : cat.id)}
            >
              <div className="food-category-circle">
                <img
                  src={imgUrl}
                  alt={cat.name}
                  className="food-category-img"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_CATEGORY_IMAGES[cat.id] || DEFAULT_CATEGORY_IMAGES.all;
                  }}
                />
              </div>
              <span className="food-category-name">{label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
});

CategoryFilter.displayName = 'CategoryFilter';
