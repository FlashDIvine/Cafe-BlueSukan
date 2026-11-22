import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { Navbar } from '../components/Navbar';
import { CategoryFilter } from '../components/CategoryFilter';
import { MenuCard } from '../components/MenuCard';
import { TableModal } from '../components/TableModal';
import { Toast } from '../components/Toast';
import '../styles/menu-page.css';

export const MenuPage = ({ onOpenCart, onGoHome, activeOrder, onOpenTicketModal }) => {
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

  return (
    <div className="antislop-menu-page">
      <Navbar
        onOpenTableModal={() => setIsTableModalOpen(true)}
        onGoHome={onGoHome}
        activeOrder={activeOrder}
        onOpenTicketModal={onOpenTicketModal}
      />
      <Toast />

      <main className="menu-main-container">
        {/* Top Header & Search */}
        <section className="menu-header-section" aria-label="Judul & Pencarian Menu">
          <h1 className="menu-page-title">Menu</h1>

          <div className="menu-search-box">
            <Search size={18} className="search-icon" aria-hidden="true" />
            <input
              type="text"
              className="search-input"
              placeholder="Cari kopi, mendoan, nasi bakar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Cari menu"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus kata kunci pencarian"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </section>

        {/* Categories Horizontal Scroll Chips */}
        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          menusCountByCategory={menusCountByCategory}
        />

        {/* Catalog List: One row per item, dotted separator, no cards */}
        <section className="menu-catalog-section" aria-label="Daftar Menu">
          {filteredMenus.length > 0 ? (
            <div className="menu-items-list">
              {filteredMenus.map((item) => (
                <MenuCard key={`menu-${item.id}`} item={item} />
              ))}
            </div>
          ) : (
            <div className="menu-empty-state">
              <h3 className="empty-title">Menu tidak ditemukan</h3>
              <p className="empty-desc">
                Coba gunakan kata kunci lain atau pilih kategori berbeda.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Table Selection Modal */}
      <TableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
      />
    </div>
  );
};
