import React from 'react';
import { CATEGORIES } from '../data/mockMenus';
import '../styles/category-filter.css';

export const CategoryFilter = ({
  categories = CATEGORIES,
  activeCategory,
  onSelectCategory,
  menusCountByCategory = {},
}) => {
  return (
    <div className="category-filter-wrapper">
      <div className="category-scroll-container no-scrollbar" role="tablist">
        {categories.map((cat) => {
          const count = menusCountByCategory[cat.id] ?? 0;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isActive}
              className={`category-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              <span>{cat.name}</span>
              <span className="category-pill-count">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

