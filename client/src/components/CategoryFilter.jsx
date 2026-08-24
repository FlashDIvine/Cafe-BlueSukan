import React from 'react';
import { Coffee, CupSoda, UtensilsCrossed, Cookie, Sparkles, Layers } from 'lucide-react';
import { CATEGORIES } from '../data/mockMenus';
import '../styles/category-filter.css';

const getCategoryIcon = (id) => {
  switch (id) {
    case 'coffee':
      return <Coffee size={20} strokeWidth={2.2} />;
    case 'non-coffee':
      return <CupSoda size={20} strokeWidth={2.2} />;
    case 'food':
      return <UtensilsCrossed size={20} strokeWidth={2.2} />;
    case 'snacks':
      return <Cookie size={20} strokeWidth={2.2} />;
    case 'all':
      return <Sparkles size={20} strokeWidth={2.2} />;
    default:
      return <Layers size={20} strokeWidth={2.2} />;
  }
};

const getCategoryShortName = (cat) => {
  if (cat.id === 'coffee') return 'Coffee';
  if (cat.id === 'non-coffee') return 'Non-Coffee';
  if (cat.id === 'food') return 'Food';
  if (cat.id === 'snacks') return 'Snacks';
  if (cat.id === 'all') return 'All';
  return cat.name;
};

export const CategoryFilter = ({
  categories = CATEGORIES,
  activeCategory,
  onSelectCategory,
  menusCountByCategory = {},
}) => {
  // Ensure 'all' option is available at the start if not present
  const displayCategories = React.useMemo(() => {
    const hasAll = categories.some((c) => c.id === 'all');
    if (!hasAll) {
      return [{ id: 'all', name: 'All' }, ...categories];
    }
    return categories;
  }, [categories]);

  return (
    <section className="stitch-categories-section" aria-label="Kategori Menu">
      <div className="stitch-section-header">
        <h2 className="stitch-section-title">Categories</h2>
      </div>
      <div className="stitch-categories-scroll no-scrollbar" role="tablist">
        {displayCategories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const icon = getCategoryIcon(cat.id);
          const shortLabel = getCategoryShortName(cat);

          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`stitch-category-card ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(isActive && cat.id !== 'all' ? 'all' : cat.id)}
            >
              <div className="stitch-cat-icon-circle">{icon}</div>
              <span className="stitch-cat-label">{shortLabel}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
