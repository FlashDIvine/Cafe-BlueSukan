import React, { useMemo, memo } from 'react';
import { CATEGORIES } from '../data/mockMenus';
import '../styles/category-filter.css';

const getCategoryLabel = (cat) => {
  if (cat.id === 'all') return 'Semua';
  if (cat.id === 'makanan-utama' || cat.id === 'food') return 'Makanan';
  if (cat.id === 'cemilan-gorengan' || cat.id === 'snacks') return 'Cemilan';
  if (cat.id === 'minuman-kopi' || cat.id === 'coffee') return 'Kopi';
  if (cat.id === 'minuman-susu-coklat') return 'Susu & Coklat';
  if (cat.id === 'minuman-teh-lainnya' || cat.id === 'non-coffee') return 'Teh & Lainnya';
  return cat.name;
};

export const CategoryFilter = memo(({
  categories = CATEGORIES,
  activeCategory,
  onSelectCategory,
  menusCountByCategory = {},
}) => {
  const displayCategories = useMemo(() => {
    const hasAll = categories.some((c) => c.id === 'all');
    if (!hasAll) {
      return [{ id: 'all', name: 'Semua' }, ...categories];
    }
    return categories;
  }, [categories]);

  return (
    <nav className="category-filter-bar no-scrollbar" aria-label="Kategori Menu" role="tablist">
      {displayCategories.map((cat) => {
        const isActive = activeCategory === cat.id;
        const label = getCategoryLabel(cat);
        const count = menusCountByCategory[cat.id];

        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`category-chip ${isActive ? 'active' : ''}`}
            onClick={() => onSelectCategory(isActive && cat.id !== 'all' ? 'all' : cat.id)}
          >
            <span>{label}</span>
            {typeof count === 'number' && count > 0 && (
              <span className="category-chip-count">({count})</span>
            )}
          </button>
        );
      })}
    </nav>
  );
});

CategoryFilter.displayName = 'CategoryFilter';
