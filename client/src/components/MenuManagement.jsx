import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Minus,
  Coffee,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { MenuFormModal } from './MenuFormModal';
import {
  createMenuApi,
  updateMenuApi,
  updateMenuStockApi,
  toggleMenuAvailabilityApi,
  deleteMenuApi,
} from '../services/api';

export const MenuManagement = ({ menus, categories, onRefreshMenus }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [deleteTargetMenu, setDeleteTargetMenu] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Metrics
  const stats = useMemo(() => {
    const total = menus.length;
    const available = menus.filter((m) => m.is_available && m.stock > 0).length;
    const outOfStock = menus.filter((m) => m.stock === 0 || !m.is_available).length;
    return { total, available, outOfStock };
  }, [menus]);

  // Filtered menus
  const filteredMenus = useMemo(() => {
    return menus.filter((m) => {
      const matchCat = selectedCategory === 'all' || m.category_id === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        m.name.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.category_name && m.category_name.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [menus, selectedCategory, searchQuery]);

  // Actions
  const handleOpenAddModal = () => {
    setEditingMenu(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (menu) => {
    setEditingMenu(menu);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (editingMenu) {
      await updateMenuApi(editingMenu.id, formData);
      showToast(`Menu "${formData.name}" berhasil diperbarui`, 'success');
    } else {
      await createMenuApi(formData);
      showToast(`Menu "${formData.name}" berhasil ditambahkan`, 'success');
    }
    await onRefreshMenus();
  };

  const handleQuickStock = async (menuId, delta) => {
    try {
      await updateMenuStockApi(menuId, { delta });
      await onRefreshMenus();
    } catch (err) {
      showToast(err.message || 'Gagal mengubah stok', 'warning');
    }
  };

  const handleToggleAvailability = async (menuId) => {
    try {
      const updated = await toggleMenuAvailabilityApi(menuId);
      showToast(
        `Menu "${updated.name}" sekarang ${updated.is_available ? 'Aktif/Tersedia' : 'Nonaktif/Habis'}`,
        updated.is_available ? 'success' : 'info'
      );
      await onRefreshMenus();
    } catch (err) {
      showToast(err.message || 'Gagal mengubah status', 'warning');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetMenu) return;
    try {
      await deleteMenuApi(deleteTargetMenu.id);
      showToast(`Menu "${deleteTargetMenu.name}" telah dihapus`, 'info');
      setDeleteTargetMenu(null);
      await onRefreshMenus();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus menu', 'warning');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 20px 40px' }}>
      {/* Toast */}
      {toastMsg && (
        <div className="toast-container">
          <div className={`toast-box ${toastMsg.type}`}>
            <span>{toastMsg.msg}</span>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="pos-metrics-grid">
        <div className="pos-metric-card">
          <span className="pos-metric-label">Total Menu</span>
          <span className="pos-metric-value">{stats.total}</span>
        </div>
        <div className="pos-metric-card">
          <span className="pos-metric-label" style={{ color: '#A7F3D0' }}>Menu Tersedia</span>
          <span className="pos-metric-value">{stats.available}</span>
        </div>
        <div className="pos-metric-card highlight">
          <span className="pos-metric-label">Stok Habis / Nonaktif</span>
          <span className="pos-metric-value">{stats.outOfStock}</span>
        </div>
      </div>

      {/* Action Header & Search */}
      <div
        style={{
          backgroundColor: 'var(--color-white)',
          padding: '16px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--color-primary)' }}>
            Katalog & Manajemen Stok Menu
          </h2>
          <button
            type="button"
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', fontSize: '13px', width: 'auto' }}
            onClick={handleOpenAddModal}
          >
            <Plus size={16} />
            <span>Tambah Menu Baru</span>
          </button>
        </div>

        {/* Search & Category Tabs */}
        <div className="pos-search-wrapper">
          <Search size={15} className="pos-search-icon" />
          <input
            type="text"
            className="pos-search-input"
            placeholder="Cari nama menu atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="pos-tab-filter-list no-scrollbar">
          <button
            type="button"
            className={`pos-tab-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            Semua
          </button>
          <button
            type="button"
            className={`pos-tab-btn ${selectedCategory === 'coffee' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('coffee')}
          >
            Kopi & Espresso
          </button>
          <button
            type="button"
            className={`pos-tab-btn ${selectedCategory === 'non-coffee' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('non-coffee')}
          >
            Non-Coffee
          </button>
          <button
            type="button"
            className={`pos-tab-btn ${selectedCategory === 'snacks' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('snacks')}
          >
            Makanan Ringan
          </button>
          <button
            type="button"
            className={`pos-tab-btn ${selectedCategory === 'food' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('food')}
          >
            Makanan Utama
          </button>
        </div>
      </div>

      {/* Menu Table / List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredMenus.map((menu) => {
          const isOutOfStock = menu.stock === 0 || !menu.is_available;

          return (
            <div
              key={menu.id}
              style={{
                backgroundColor: 'var(--color-white)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                flexWrap: 'wrap',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              {/* Left Thumbnail & Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 240px', minWidth: '200px' }}>
                <img
                  src={menu.image_url}
                  alt={menu.name}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: 'var(--radius-md)',
                    objectFit: 'cover',
                    backgroundColor: 'var(--color-sky)',
                    flexShrink: 0,
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=200&q=80';
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--color-text-main)' }}>{menu.name}</strong>
                    {menu.is_popular && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-pill)',
                        }}
                      >
                        Favorit
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--color-slate)' }}>
                    {menu.category_name || menu.category_id}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-primary)' }}>
                    {formatRupiah(menu.price)}
                  </span>
                </div>
              </div>

              {/* Center Quick Stock Editor */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--color-bg)',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-slate)' }}>Stok:</span>
                <div className="cart-stepper">
                  <button
                    type="button"
                    className="cart-stepper-btn"
                    onClick={() => handleQuickStock(menu.id, -1)}
                    disabled={menu.stock <= 0}
                    aria-label="Kurangi stok"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="cart-stepper-qty" style={{ minWidth: '24px' }}>
                    {menu.stock}
                  </span>
                  <button
                    type="button"
                    className="cart-stepper-btn"
                    onClick={() => handleQuickStock(menu.id, 1)}
                    aria-label="Tambah stok"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* Right Status Switch & Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Availability Toggle button */}
                <button
                  type="button"
                  style={{
                    fontSize: '11.5px',
                    fontWeight: '700',
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-pill)',
                    border: 'none',
                    backgroundColor: menu.is_available && menu.stock > 0 ? '#D1FAE5' : '#FEE2E2',
                    color: menu.is_available && menu.stock > 0 ? '#065F46' : '#991B1B',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onClick={() => handleToggleAvailability(menu.id)}
                  title="Klik untuk mengubah status aktif/nonaktif"
                >
                  {menu.is_available && menu.stock > 0 ? (
                    <>
                      <CheckCircle2 size={12} />
                      <span>Aktif</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={12} />
                      <span>{menu.stock === 0 ? 'Habis' : 'Nonaktif'}</span>
                    </>
                  )}
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onClick={() => handleOpenEditModal(menu)}
                  title="Edit menu"
                >
                  <Edit2 size={14} />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-danger)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onClick={() => setDeleteTargetMenu(menu)}
                  title="Hapus menu"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Menu Form Modal */}
      <MenuFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialMenu={editingMenu}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      {deleteTargetMenu && (
        <div className="modal-overlay" onClick={() => setDeleteTargetMenu(null)} role="dialog" aria-modal="true">
          <div className="modal-content-card" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#FEE2E2',
                  color: 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-text-main)' }}>
                Hapus Menu "{deleteTargetMenu.name}"?
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                Menu ini akan dihapus dari daftar katalog pelanggan dan tidak dapat dipesan lagi.
              </p>

              <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setDeleteTargetMenu(null)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--color-danger)',
                    color: 'var(--color-white)',
                    border: 'none',
                    borderRadius: 'var(--radius-pill)',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    padding: '10px',
                  }}
                  onClick={handleConfirmDelete}
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
