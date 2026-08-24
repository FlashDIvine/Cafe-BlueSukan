import React, { useState, useMemo, useRef } from 'react';
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
  Tag,
  FolderPlus,
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { MenuFormModal } from './MenuFormModal';
import {
  createMenuApi,
  updateMenuApi,
  updateMenuStockApi,
  toggleMenuAvailabilityApi,
  deleteMenuApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
} from '../services/api';

const DEFAULT_CATEGORY_FALLBACK =
  'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=150&q=80&fm=webp';

export const MenuManagement = ({ menus, categories = [], onRefreshMenus }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [deleteTargetMenu, setDeleteTargetMenu] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Category management state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState('');
  const [categoryImageError, setCategoryImageError] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const fileInputRef = useRef(null);

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

  // Actions for Menus
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

  // WebP Image File Validation & Processing for Category
  const handleCategoryImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCategoryImageError('');

    // 1. Check file extension
    const fileName = file.name || '';
    if (!fileName.toLowerCase().endsWith('.webp')) {
      setCategoryImageError('Format gambar harus WebP (.webp)');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Check MIME type
    if (file.type && file.type !== 'image/webp') {
      setCategoryImageError('Format gambar harus WebP');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 3. Check file size (max 2MB = 2,097,152 bytes)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setCategoryImageError('Ukuran maksimal 2MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Convert valid WebP to data URL for storage and preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewCategoryImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearCategoryImage = () => {
    setNewCategoryImage('');
    setCategoryImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryImage('');
    setCategoryImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartEditCategory = (cat) => {
    setEditingCategory(cat);
    setNewCategoryName(cat.name);
    setNewCategoryImage(cat.image || '');
    setCategoryImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsAddingCategory(true);
    try {
      if (editingCategory) {
        await updateCategoryApi(editingCategory.id, {
          name: newCategoryName.trim(),
          image: newCategoryImage.trim() || null,
        });
        showToast(`Kategori "${newCategoryName.trim()}" berhasil diperbarui`, 'success');
      } else {
        await createCategoryApi({
          name: newCategoryName.trim(),
          image: newCategoryImage.trim() || null,
        });
        showToast(`Kategori "${newCategoryName.trim()}" berhasil ditambahkan`, 'success');
      }
      handleCancelCategoryEdit();
      await onRefreshMenus();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan kategori', 'warning');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (window.confirm(`Yakin ingin menghapus kategori "${catName}"?`)) {
      try {
        await deleteCategoryApi(catId);
        showToast(`Kategori "${catName}" berhasil dihapus`, 'info');
        if (selectedCategory === catId) {
          setSelectedCategory('all');
        }
        await onRefreshMenus();
      } catch (err) {
        showToast(err.message || 'Gagal menghapus kategori', 'warning');
      }
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
        <div className="pos-metric-card menu-total-metric">
          <span className="pos-metric-label">Total Menu</span>
          <span className="pos-metric-value">{stats.total}</span>
        </div>
        <div className="pos-metric-card menu-available-metric">
          <span className="pos-metric-label">Menu Tersedia</span>
          <span className="pos-metric-value">{stats.available}</span>
        </div>
        <div className="pos-metric-card waiting-metric">
          <span className="pos-metric-label">Stok Habis / Nonaktif</span>
          <span className="pos-metric-value">{stats.outOfStock}</span>
        </div>
      </div>

      {/* Category Management Card */}
      <div className="category-manager-card">
        <div className="category-manager-header">
          <div className="category-manager-title">
            <Tag size={16} />
            <span>
              {editingCategory
                ? `Edit Kategori: "${editingCategory.name}"`
                : `Kelola Kategori Menu (${categories.filter((c) => c.id !== 'all').length})`}
            </span>
          </div>

          <form onSubmit={handleCategorySubmit} className="category-add-form" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', flex: '1 1 200px', minWidth: '180px' }}>
              <input
                type="text"
                className="category-add-input"
                placeholder="Nama kategori (contoh: Pastry, Dessert)..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={isAddingCategory}
                style={{ flex: 1 }}
                required
              />
            </div>

            {/* WebP Image Upload input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/webp,.webp"
                id="category-file-input"
                style={{ display: 'none' }}
                onChange={handleCategoryImageChange}
              />
              <button
                type="button"
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                }}
                onClick={() => fileInputRef.current?.click()}
                title="Pilih gambar WebP (maksimal 2MB)"
              >
                <Upload size={14} />
                <span>Upload WebP</span>
              </button>

              {/* Circle Image Preview */}
              {newCategoryImage ? (
                <div style={{ position: 'relative', width: '36px', height: '36px' }}>
                  <img
                    src={newCategoryImage}
                    alt="Preview"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--color-primary)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleClearCategoryImage}
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-danger)',
                      color: 'white',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '10px',
                    }}
                    title="Hapus gambar"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : null}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: 'auto', padding: '8px 14px', fontSize: '12px' }}
                disabled={isAddingCategory || !newCategoryName.trim()}
              >
                <Plus size={14} />
                <span>{isAddingCategory ? 'Menyimpan...' : editingCategory ? 'Simpan' : 'Tambah'}</span>
              </button>

              {editingCategory && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: 'auto', padding: '8px 12px', fontSize: '12px' }}
                  onClick={handleCancelCategoryEdit}
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Error Validation Alert Banner */}
        {categoryImageError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-danger-dark)',
              backgroundColor: 'var(--color-danger-light)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: '600',
              marginTop: '4px',
            }}
          >
            <AlertCircle size={14} />
            <span>{categoryImageError}</span>
          </div>
        )}

        {/* Category List with Circle Thumbnails */}
        <div className="category-chips-list" style={{ marginTop: '10px' }}>
          {categories
            .filter((c) => c.id !== 'all')
            .map((cat) => {
              const count = menus.filter((m) => m.category_id === cat.id).length;
              return (
                <div key={cat.id} className="category-chip-item" style={{ gap: '8px' }}>
                  <img
                    src={cat.image || DEFAULT_CATEGORY_FALLBACK}
                    alt={cat.name}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-sky)',
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_CATEGORY_FALLBACK;
                    }}
                  />
                  <span>{cat.name}</span>
                  <span className="category-chip-count">{count} menu</span>

                  {/* Edit button */}
                  <button
                    type="button"
                    className="category-chip-del-btn"
                    onClick={() => handleStartEditCategory(cat)}
                    title={`Edit kategori ${cat.name}`}
                    style={{ color: 'var(--color-primary)' }}
                  >
                    <Edit2 size={12} />
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    className="category-chip-del-btn"
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    title={`Hapus kategori ${cat.name}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
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
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`pos-tab-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
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
