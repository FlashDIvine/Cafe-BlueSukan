import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Coffee,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  User,
  ChevronRight,
  ClipboardList,
  UtensilsCrossed,
} from 'lucide-react';
import { formatRupiah, formatPaidTime } from '../utils/formatters';
import {
  fetchOrdersApi,
  fetchMenusApi,
  updateOrderItemsApi,
  cancelOrderApi,
  approveOrderApi,
  completeOrderApi,
} from '../services/api';
import { CashierOrderModal } from '../components/CashierOrderModal';
import { MenuManagement } from '../components/MenuManagement';
import '../styles/cashier.css';

export const CashierPage = () => {
  const [posSection, setPosSection] = useState('orders'); // 'orders' | 'menus'
  const [orders, setOrders] = useState([]);
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('waiting_payment');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load orders & menus without disruptive flickering on background poll
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const [ordersData, menusRes] = await Promise.all([
        fetchOrdersApi(),
        fetchMenusApi(),
      ]);
      
      const newOrders = ordersData || [];
      setOrders((prev) => {
        if (prev.length === newOrders.length) {
          const isIdentical = prev.every((p, idx) => {
            const n = newOrders[idx];
            return (
              p.id === n.id &&
              p.status === n.status &&
              p.total_price === n.total_price &&
              p.payment_method === n.payment_method &&
              p.table_number === n.table_number &&
              p.customer_name === n.customer_name &&
              p.items?.length === n.items?.length
            );
          });
          if (isIdentical) return prev;
        }
        return newOrders;
      });

      if (menusRes?.data) {
        setMenus((prev) => {
          if (prev.length === menusRes.data.length) {
            const isIdentical = prev.every((p, idx) => {
              const n = menusRes.data[idx];
              return (
                p.id === n.id &&
                p.stock === n.stock &&
                p.is_available === n.is_available &&
                p.price === n.price &&
                p.name === n.name
              );
            });
            if (isIdentical) return prev;
          }
          return menusRes.data;
        });
      }

      if (menusRes?.categories) {
        setCategories((prev) => {
          if (prev.length === menusRes.categories.length) {
            const isIdentical = prev.every((p, idx) => p.id === menusRes.categories[idx].id);
            if (isIdentical) return prev;
          }
          return menusRes.categories;
        });
      }
    } catch (err) {
      console.error('Error loading cashier data:', err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
    
    // Poll orders & menu stock every 3 seconds silently
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadData(true);
      }
    }, 3000);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadData(true);
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [loadData]);

  // Keep selected order synced with fresh polled data
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find((o) => o.id === selectedOrder.id);
      if (updated) {
        setSelectedOrder(updated);
      }
    }
  }, [orders, selectedOrder]);

  // Counts by status
  const counts = useMemo(() => {
    const res = {
      waiting_payment: 0,
      paid_processing: 0,
      completed: 0,
      cancelled: 0,
      all: orders.length,
    };
    orders.forEach((o) => {
      if (res[o.status] !== undefined) {
        res[o.status]++;
      }
    });
    return res;
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchTab =
        activeTab === 'all' ||
        (activeTab === 'waiting_payment' && o.status === 'waiting_payment') ||
        (activeTab === 'paid_processing' && o.status === 'paid_processing') ||
        (activeTab === 'history' && (o.status === 'completed' || o.status === 'cancelled'));

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        o.order_code.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        String(o.table_number).toLowerCase().includes(q);

      return matchTab && matchSearch;
    });
  }, [orders, activeTab, searchQuery]);

  // Order Actions
  const handleUpdateItems = async (orderId, newItems) => {
    const updated = await updateOrderItemsApi(orderId, newItems);
    await loadData();
    return updated;
  };

  const handleCancelOrder = async (orderId) => {
    const updated = await cancelOrderApi(orderId);
    await loadData();
    return updated;
  };

  const handleApproveOrder = async (orderId, paymentMethod) => {
    const updated = await approveOrderApi(orderId, paymentMethod);
    await loadData();
    return updated;
  };

  const handleCompleteOrder = async (orderId) => {
    const updated = await completeOrderApi(orderId);
    await loadData();
    return updated;
  };

  return (
    <div className="cashier-dashboard-container">
      {/* POS Top Header */}
      <header className="pos-header">
        <div className="pos-header-top-row">
          <div className="pos-brand-wrap">
            <div className="pos-brand-icon">
              <Coffee size={22} color="#FFFFFF" />
            </div>
            <div className="pos-brand-text">
              <h1>Bantu Cafe — POS Kasir</h1>
              <span>Manajemen Antrean & Inventori Menu</span>
            </div>
          </div>

          <div className="pos-header-actions">
            <span className="pos-live-pill">
              <span className="status-dot"></span>
              Live Sync (3s)
            </span>
            <button
              type="button"
              className="pos-btn-refresh"
              onClick={loadData}
              title="Perbarui Data"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* POS Sub-Navigation Tabs: Antrean vs Menu */}
        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '10px' }}>
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              backgroundColor: posSection === 'orders' ? 'var(--color-white)' : 'rgba(255, 255, 255, 0.15)',
              color: posSection === 'orders' ? 'var(--color-primary)' : 'var(--color-white)',
              transition: 'all var(--transition-fast)',
            }}
            onClick={() => setPosSection('orders')}
          >
            <ClipboardList size={15} />
            <span>Antrean Pesanan ({counts.waiting_payment})</span>
          </button>

          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              backgroundColor: posSection === 'menus' ? 'var(--color-white)' : 'rgba(255, 255, 255, 0.15)',
              color: posSection === 'menus' ? 'var(--color-primary)' : 'var(--color-white)',
              transition: 'all var(--transition-fast)',
            }}
            onClick={() => setPosSection('menus')}
          >
            <UtensilsCrossed size={15} />
            <span>Kelola Menu & Stok ({menus.length})</span>
          </button>
        </div>
      </header>

      {/* Conditional Content by Sub-Tab */}
      {posSection === 'menus' ? (
        <MenuManagement
          menus={menus}
          categories={categories}
          onRefreshMenus={loadData}
        />
      ) : (
        <>
          {/* Controls & Tab Filter for Orders */}
          <div className="pos-controls-bar">
            {/* Metric Cards */}
            <div className="pos-metrics-grid" style={{ marginBottom: '8px' }}>
              <div className="pos-metric-card waiting-metric">
                <span className="pos-metric-label">Perlu Pembayaran</span>
                <span className="pos-metric-value">{counts.waiting_payment}</span>
              </div>
              <div className="pos-metric-card processing-metric">
                <span className="pos-metric-label">Sedang Diproses</span>
                <span className="pos-metric-value">{counts.paid_processing}</span>
              </div>
              <div className="pos-metric-card total-metric">
                <span className="pos-metric-label">Total Pesanan Hari Ini</span>
                <span className="pos-metric-value">{counts.all}</span>
              </div>
            </div>

            {/* Search */}
            <div className="pos-search-wrapper">
              <Search size={16} className="pos-search-icon" />
              <input
                type="text"
                className="pos-search-input"
                placeholder="Cari Kode Pesanan (#BC-XXX), Nama Pemesan, atau Nomor Meja..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Tabs */}
            <div className="pos-tab-filter-list no-scrollbar">
              <button
                type="button"
                className={`pos-tab-btn ${activeTab === 'waiting_payment' ? 'active' : ''}`}
                onClick={() => setActiveTab('waiting_payment')}
              >
                <span>Menunggu Pembayaran</span>
                <span className="pos-tab-badge">{counts.waiting_payment}</span>
              </button>

              <button
                type="button"
                className={`pos-tab-btn ${activeTab === 'paid_processing' ? 'active' : ''}`}
                onClick={() => setActiveTab('paid_processing')}
              >
                <span>Sedang Diproses</span>
                <span className="pos-tab-badge">{counts.paid_processing}</span>
              </button>

              <button
                type="button"
                className={`pos-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <span>Riwayat Selesai / Batal</span>
                <span className="pos-tab-badge">{counts.completed + counts.cancelled}</span>
              </button>

              <button
                type="button"
                className={`pos-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <span>Semua Pesanan</span>
                <span className="pos-tab-badge">{counts.all}</span>
              </button>
            </div>
          </div>

          {/* Orders List Grid */}
          <main className="pos-orders-content">
            {filteredOrders.length > 0 ? (
              <div className="pos-orders-grid">
                {filteredOrders.map((order) => {
                  const isWaiting = order.status === 'waiting_payment';
                  const isProcessing = order.status === 'paid_processing';
                  const isCancelled = order.status === 'cancelled';

                  return (
                    <div
                      key={order.id}
                      className={`pos-order-card ${isWaiting ? 'waiting' : isProcessing ? 'processing' : isCancelled ? 'cancelled' : ''}`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="pos-card-header">
                        <div className="pos-card-code-table">
                          <span className="pos-order-code">{order.order_code}</span>
                          <span className="pos-order-table-chip">Meja {order.table_number}</span>
                        </div>

                        <span
                          className={`status-badge ${isProcessing ? 'processing' : isWaiting ? 'waiting' : isCancelled ? 'cancelled' : ''}`}
                        >
                          {isWaiting && <Clock size={12} />}
                          {isProcessing && <CheckCircle2 size={12} />}
                          {isCancelled && <AlertCircle size={12} />}
                          {isWaiting
                            ? 'Menunggu Bayar'
                            : isProcessing
                            ? 'Sedang Diproses'
                            : isCancelled
                            ? 'Dibatalkan'
                            : 'Selesai'}
                        </span>
                      </div>

                      <div className="pos-card-customer-row">
                        <User size={14} color="var(--color-slate)" />
                        <span>{order.customer_name}</span>
                      </div>

                      {/* Payment Timestamp for processing orders */}
                      {isProcessing && (order.paid_at || order.updated_at) && (
                        <div className="pos-card-paid-time">
                          <Clock size={12} />
                          <span>{formatPaidTime(order.paid_at || order.updated_at)}</span>
                        </div>
                      )}

                      {order.notes && (
                        <div className="pos-card-notes-alert">
                          <strong>Catatan:</strong> {order.notes}
                        </div>
                      )}

                      {/* Items preview */}
                      <div className="pos-card-items-preview">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="pos-card-item-line">
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span>{formatRupiah(item.subtotal || item.price * item.quantity)}</span>
                          </div>
                        ))}
                        {order.items?.length > 3 && (
                          <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)' }}>
                            +{order.items.length - 3} menu lainnya...
                          </span>
                        )}
                      </div>

                      <div className="pos-card-footer">
                        <div>
                          <span className="pos-card-price-label">Total</span>
                          <div className="pos-card-total-price">{formatRupiah(order.total_price)}</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isProcessing && (
                            <button
                              type="button"
                              className="btn-complete-order"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteOrder(order.id);
                              }}
                              title="Selesaikan Pesanan"
                            >
                              <CheckCircle2 size={13} />
                              <span>Selesai</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn-open-order"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                          >
                            <span>{isWaiting ? 'Verifikasi & Bayar' : 'Detail'}</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="pos-empty-state">
                <ShoppingBag size={32} color="var(--color-slate-light)" />
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Tidak ada antrean pesanan</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', maxWidth: '300px' }}>
                  {activeTab === 'waiting_payment'
                    ? 'Belum ada pesanan baru yang menunggu verifikasi kasir.'
                    : 'Tidak ada pesanan yang sesuai dengan filter saat ini.'}
                </p>
              </div>
            )}
          </main>

          {/* Order Detail & Edit Modal */}
          <CashierOrderModal
            isOpen={Boolean(selectedOrder)}
            onClose={() => setSelectedOrder(null)}
            order={selectedOrder}
            allMenus={menus}
            onUpdateItems={handleUpdateItems}
            onCancelOrder={handleCancelOrder}
            onApproveOrder={handleApproveOrder}
            onCompleteOrder={handleCompleteOrder}
          />
        </>
      )}
    </div>
  );
};

