import React, { useState, useMemo } from 'react';
import { Search, X, SlidersHorizontal, ArrowRight, UtensilsCrossed } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { Navbar } from '../components/Navbar';
import { CategoryFilter } from '../components/CategoryFilter';
import { RecommendedCard } from '../components/RecommendedCard';
import { MenuCard } from '../components/MenuCard';
import { FloatingCartBar } from '../components/FloatingCartBar';
import { TableModal } from '../components/TableModal';
import { Toast } from '../components/Toast';
import '../styles/menu-page.css';

export const MenuPage = ({ onOpenCart }) => {
  const { menus, categories = [] } = useOrder();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  // Dynamic count of menus per category
  const menusCountByCategory = useMemo(() => {
    const counts = { all: menus.length };
    menus.forEach((item) => {
      counts[item.category_id] = (counts[item.category_id] || 0) + 1;
    });
    return counts;
  }, [menus]);

  // Recommended / Featured items (e.g. popular items or top available picks)
  const recommendedMenus = useMemo(() => {
    const popular = menus.filter((item) => item.is_popular);
    if (popular.length >= 2) return popular;
    return menus.slice(0, 4);
  }, [menus]);

  // Dynamic active category title
  const activeCategoryTitle = useMemo(() => {
    if (activeCategory === 'all') return 'Popular Menu';
    const found = categories.find((c) => c.id === activeCategory);
    return found ? found.name : 'Popular Menu';
  }, [categories, activeCategory]);

  // Filtered menu items by Category and Search Query
  const filteredMenus = useMemo(() => {
    return menus.filter((item) => {
      const matchCategory =
        activeCategory === 'all' || item.category_id === activeCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [menus, activeCategory, searchQuery]);

  const handleSeeAll = () => {
    setActiveCategory('all');
    setSearchQuery('');
  };

  const handleFilterBtnClick = () => {
    // Open table modal or toggle all categories
    setIsTableModalOpen(true);
  };

  return (
    <main className="stitch-home-container">
      <Navbar onOpenTableModal={() => setIsTableModalOpen(true)} />
      <Toast />

      {/* Top Search Bar & Filter Button */}
      <section className="stitch-search-section" aria-label="Pencarian Menu">
        <div className="stitch-search-row">
          <div className="stitch-search-input-box">
            <Search size={18} className="stitch-search-icon" />
            <input
              type="text"
              className="stitch-search-input"
              placeholder="What are you craving today?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Cari menu"
            />
            {searchQuery && (
              <button
                type="button"
                className="stitch-search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus pencarian"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="stitch-filter-btn"
            onClick={handleFilterBtnClick}
            aria-label="Filter dan pengaturan meja"
            title="Nomor meja & filter"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </section>

      {/* Categories Horizontal Cards */}
      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        menusCountByCategory={menusCountByCategory}
      />

      {/* Recommended for You Section (Visible when not actively searching) */}
      {!searchQuery && activeCategory === 'all' && recommendedMenus.length > 0 && (
        <section className="stitch-recommended-section" aria-label="Rekomendasi Menu">
          <div className="stitch-section-header-row">
            <h2 className="stitch-section-title">Recommended for You</h2>
            <button
              type="button"
              className="stitch-see-all-btn"
              onClick={handleSeeAll}
              aria-label="Lihat semua menu"
            >
              <span>See all</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="stitch-recommended-scroll no-scrollbar">
            {recommendedMenus.map((item) => (
              <RecommendedCard key={`rec-${item.id}`} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Popular Menu / 2-Column Catalog Grid */}
      <section className="stitch-catalog-section" aria-label="Katalog Menu">
        <div className="stitch-section-header-row">
          <h2 className="stitch-section-title">{activeCategoryTitle}</h2>
          <span className="stitch-section-count">{filteredMenus.length} items</span>
        </div>

        {filteredMenus.length > 0 ? (
          <div className="stitch-popular-grid">
            {filteredMenus.map((item) => (
              <MenuCard key={`menu-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="stitch-empty-state">
            <div className="stitch-empty-icon">
              <UtensilsCrossed size={28} />
            </div>
            <h3 className="stitch-empty-title">Menu tidak ditemukan</h3>
            <p className="stitch-empty-desc">
              Coba kata kunci lain atau pilih kategori menu yang berbeda.
            </p>
          </div>
        )}
      </section>

      {/* Floating Bottom Cart Bar */}
      <FloatingCartBar onOpenCart={onOpenCart} />

      {/* Table Selection Modal */}
      <TableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
      />
    </main>
  );
};
