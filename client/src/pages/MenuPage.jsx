import React, { useState, useMemo } from 'react';
import { Search, X, UtensilsCrossed, Sparkles } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { Navbar } from '../components/Navbar';
import { CategoryFilter } from '../components/CategoryFilter';
import { MenuCard } from '../components/MenuCard';
import { FloatingCartBar } from '../components/FloatingCartBar';
import { TableModal } from '../components/TableModal';
import { Toast } from '../components/Toast';
import '../styles/menu-page.css';

export const MenuPage = ({ onOpenCart }) => {
  const { menus } = useOrder();
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

  // Filtered menu items by Category and Search Query
  const filteredMenus = useMemo(() => {
    return menus.filter((item) => {
      const matchCategory = activeCategory === 'all' || item.category_id === activeCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [menus, activeCategory, searchQuery]);

  return (
    <main className="menu-page-container">
      <Navbar onOpenTableModal={() => setIsTableModalOpen(true)} />
      <Toast />

      {/* Welcome Banner */}
      <section className="welcome-banner" aria-label="Sambutan Bantu Cafe">
        <div className="welcome-title-wrap">
          <span className="welcome-badge">Self-Order</span>
        </div>
        <h1 className="welcome-title">Mau pesan apa hari ini?</h1>
        <p className="welcome-subtitle">
          Pilih menu favoritmu, pesanan akan langsung diteruskan ke barista setelah verifikasi di kasir.
        </p>

        {/* Quick Search */}
        <div className="search-bar-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Cari kopi, non-kopi, atau cemilan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus pencarian"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </section>

      {/* Category Pills Filter */}
      <CategoryFilter
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        menusCountByCategory={menusCountByCategory}
      />

      {/* Menu List Catalog */}
      <section className="menu-section" aria-label="Daftar Menu">
        <div className="menu-section-header">
          <h2 className="section-title">
            {activeCategory === 'all' ? 'Daftar Menu' : CATEGORY_TITLES[activeCategory] || 'Menu'}
          </h2>
          <span className="section-counter">{filteredMenus.length} Menu</span>
        </div>

        {filteredMenus.length > 0 ? (
          <div className="menu-list-grid">
            {filteredMenus.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <UtensilsCrossed size={28} />
            </div>
            <h3 className="empty-state-title">Menu tidak ditemukan</h3>
            <p className="empty-state-desc">
              Coba kata kunci lain atau pilih kategori menu yang berbeda.
            </p>
          </div>
        )}
      </section>

      {/* Floating Bottom Cart Bar */}
      <FloatingCartBar onOpenCart={onOpenCart} />

      {/* Table Selection Modal */}
      <TableModal isOpen={isTableModalOpen} onClose={() => setIsTableModalOpen(false)} />
    </main>
  );
};

const CATEGORY_TITLES = {
  coffee: 'Kopi & Espresso',
  'non-coffee': 'Non-Coffee',
  snacks: 'Makanan Ringan',
  food: 'Makanan Utama',
};
