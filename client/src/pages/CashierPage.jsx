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
  Volume2,
  VolumeX,
  TrendingUp,
  QrCode,
  CreditCard,
  Bell,
  Banknote,
} from 'lucide-react';
import { formatRupiah, formatPaidTime, formatLocationDisplay } from '../utils/formatters';
import {
  fetchOrdersApi,
  fetchMenusApi,
  updateOrderItemsApi,
  cancelOrderApi,
  approveOrderApi,
  completeOrderApi,
  ringCustomerApi,
} from '../services/api';
import { playCashierBell } from '../utils/bellSound';
import { CashierOrderModal } from '../components/CashierOrderModal';
import { MenuManagement } from '../components/MenuManagement';
import { SalesSummaryModal } from '../components/SalesSummaryModal';
import { QrisManagementModal } from '../components/QrisManagementModal';
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
  const [isSalesSummaryOpen, setIsSalesSummaryOpen] = useState(false);
  const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [ringToast, setRingToast] = useState(null);

  // Cashier notification sound preference (defaults to true)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bluesukan_cashier_sound') !== 'false';
    }
    return true;
  });

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('bluesukan_cashier_sound', String(next));
      }
      if (next) {
        // Unlock browser AudioContext and play quick sample chime
        playCashierBell();
      }
      return next;
    });
  };

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

    // Server-Sent Events (SSE) Listener for realtime cashier updates & chime
    let eventSource = null;
    try {
      eventSource = new EventSource('/api/orders/stream');

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === 'NEW_ORDER') {
            loadData(true);
            if (soundEnabled) {
              playCashierBell();
            }
          } else if (payload?.type === 'QRIS_CONFIRMED') {
            loadData(true);
            if (soundEnabled) {
              playCashierBell();
            }
          } else if (payload?.type === 'STATUS_UPDATED') {
            loadData(true);
          }
        } catch {
          // Ignore comments or heartbeat
        }
      };

      eventSource.onerror = () => {
        // EventSource will auto-reconnect silently
      };
    } catch (err) {
      console.warn('Failed to initialize SSE EventSource:', err);
    }

    // Relaxed 60-second fallback sync for edge cases / reconnection
    const fallbackInterval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadData(true);
      }
    }, 60000);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadData(true);
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(fallbackInterval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [loadData, soundEnabled]);

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
      qris_claims: 0,
      all: orders.length,
    };
    orders.forEach((o) => {
      if (o.status === 'waiting_payment' || o.status === 'waiting_qris_verification') {
        res.waiting_payment++;
        if (o.status === 'waiting_qris_verification') {
          res.qris_claims++;
        }
      } else if (res[o.status] !== undefined) {
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
        (activeTab === 'waiting_payment' &&
          (o.status === 'waiting_payment' || o.status === 'waiting_qris_verification')) ||
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

  // DOM memory optimization: limit rendering completed/history orders to max 25 by default
  const isHistoryTab = activeTab === 'history';
  const hasExcessHistory = isHistoryTab && filteredOrders.length > 25;
  const displayedOrders = useMemo(() => {
    if (isHistoryTab && !showAllHistory && filteredOrders.length > 25) {
      return filteredOrders.slice(0, 25);
    }
    return filteredOrders;
  }, [filteredOrders, isHistoryTab, showAllHistory]);

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

  const handleQuickConfirmPayment = async (order) => {
    const method = order.payment_method || 'cash';
    const methodLabel = method === 'qris' ? 'QRIS' : 'Tunai';
    if (
      window.confirm(
        `Konfirmasi pembayaran ${order.order_code}?\n\nPemesan: ${order.customer_name}\nMetode: ${methodLabel}\nTotal: ${formatRupiah(order.total_price)}\nLokasi: ${formatLocationDisplay(order.table_number)}\n\nPesanan akan langsung diproses!`
      )
    ) {
      try {
        await approveOrderApi(order.id, method);
        await loadData(true);
        setRingToast(`✅ Pembayaran ${order.order_code} (${methodLabel}) berhasil dikonfirmasi!`);
        setTimeout(() => setRingToast(null), 3500);
      } catch (err) {
        alert(err.message || 'Gagal mengonfirmasi pembayaran');
      }
    }
  };

  const handleRingCustomer = async (order) => {
    try {
      await ringCustomerApi(order.id);
      setRingToast(`📢 Sinyal panggilan dikirim ke HP ${order.customer_name} (${order.order_code})!`);
      setTimeout(() => setRingToast(null), 3500);
    } catch (err) {
      alert(err.message || 'Gagal mengirim panggilan');
    }
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
              <h1>Blue'sukan Kopi — POS Kasir</h1>
              <span>Manajemen Antrean &amp; Inventori Menu • Rawalo</span>
            </div>
          </div>

          <div className="pos-header-actions">
            <span className="pos-live-pill">
              <span className="status-dot"></span>
              Live Sync (SSE)
            </span>
            <button
              type="button"
              className={`pos-btn-action pos-btn-sound ${soundEnabled ? 'active' : ''}`}
              onClick={toggleSound}
              title={soundEnabled ? 'Matikan Suara Bel' : 'Nyalakan Suara Bel'}
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              <span>{soundEnabled ? 'Suara Aktif' : 'Mute'}</span>
            </button>
            <button
              type="button"
              className="pos-btn-action pos-btn-summary"
              onClick={() => setIsSalesSummaryOpen(true)}
              title="Laporan Penjualan Hari Ini"
            >
              <TrendingUp size={13} />
              <span>Laporan Hari Ini</span>
            </button>
            <button
              type="button"
              className="pos-btn-action"
              onClick={() => setIsQrisModalOpen(true)}
              title="Atur Barcode QRIS Dagang Toko"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                borderColor: 'rgba(255, 255, 255, 0.25)',
              }}
            >
              <QrCode size={13} />
              <span>Atur QRIS</span>
            </button>
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
                onClick={() => {
                  setActiveTab('waiting_payment');
                  setShowAllHistory(false);
                }}
              >
                <span>Menunggu Pembayaran</span>
                <span
                  className="pos-tab-badge"
                  style={
                    counts.qris_claims > 0
                      ? { backgroundColor: '#F59E0B', color: '#1E1915', fontWeight: '800' }
                      : {}
                  }
                >
                  {counts.waiting_payment}
                  {counts.qris_claims > 0 ? ` (${counts.qris_claims} QRIS)` : ''}
                </span>
              </button>

              <button
                type="button"
                className={`pos-tab-btn ${activeTab === 'paid_processing' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('paid_processing');
                  setShowAllHistory(false);
                }}
              >
                <span>Sedang Diproses</span>
                <span className="pos-tab-badge">{counts.paid_processing}</span>
              </button>

              <button
                type="button"
                className={`pos-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('history');
                  setShowAllHistory(false);
                }}
              >
                <span>Riwayat Selesai / Batal</span>
                <span className="pos-tab-badge">{counts.completed + counts.cancelled}</span>
              </button>

              <button
                type="button"
                className={`pos-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('all');
                  setShowAllHistory(false);
                }}
              >
                <span>Semua Pesanan</span>
                <span className="pos-tab-badge">{counts.all}</span>
              </button>
            </div>
          </div>

          {/* Orders List Grid */}
          <main className="pos-orders-content">
            {displayedOrders.length > 0 ? (
              <div className="pos-orders-grid">
                {displayedOrders.map((order) => {
                  const isQrisClaim = order.status === 'waiting_qris_verification';
                  const isWaiting = order.status === 'waiting_payment' || isQrisClaim;
                  const isProcessing = order.status === 'paid_processing';
                  const isCancelled = order.status === 'cancelled';
                  const isCompleted = order.status === 'completed';

                  return (
                    <div
                      key={order.id}
                      className={`pos-order-card ${isWaiting ? 'waiting' : isProcessing ? 'processing' : isCancelled ? 'cancelled' : ''}`}
                      style={
                        isQrisClaim
                          ? {
                              borderColor: '#F59E0B',
                              boxShadow: '0 0 0 1.5px #F59E0B, 0 4px 6px -1px rgba(245, 158, 11, 0.25)',
                              backgroundColor: '#FFFDF9',
                            }
                          : {}
                      }
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="pos-card-header">
                        <div className="pos-card-code-table">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="pos-order-code">{order.order_code}</span>
                            <span
                              className={`pos-order-paymethod-chip ${order.payment_method === 'qris' ? 'qris' : 'cash'}`}
                              style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '2px 7px',
                                borderRadius: '9999px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                backgroundColor: order.payment_method === 'qris' ? '#FEF3C7' : '#DCFCE7',
                                color: order.payment_method === 'qris' ? '#92400E' : '#166534',
                                border: `1px solid ${order.payment_method === 'qris' ? '#FCD34D' : '#86EFAC'}`,
                              }}
                              title={`Metode Pembayaran: ${order.payment_method === 'qris' ? 'QRIS' : 'Tunai'}`}
                            >
                              {order.payment_method === 'qris' ? <QrCode size={11} /> : <Banknote size={11} />}
                              <span>{order.payment_method === 'qris' ? 'QRIS' : 'Tunai'}</span>
                            </span>
                          </div>
                          <span className="pos-order-table-chip">{formatLocationDisplay(order.table_number)}</span>
                        </div>

                        {isQrisClaim ? (
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: '#FEF3C7',
                              color: '#92400E',
                              border: '1.5px solid #F59E0B',
                              fontWeight: '800',
                              gap: '4px',
                            }}
                          >
                            <CreditCard size={12} />
                            <span>Klaim Bayar QRIS</span>
                          </span>
                        ) : (
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
                        )}
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {isWaiting && (
                            <button
                              type="button"
                              className="btn-card-quick-confirm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                backgroundColor: '#166534',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '11.5px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(22, 101, 52, 0.25)',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickConfirmPayment(order);
                              }}
                              title="Konfirmasi bahwa pelanggan sudah membayar"
                            >
                              <CheckCircle2 size={13} />
                              <span>Konfirmasi Bayar</span>
                            </button>
                          )}

                          {(isProcessing || isCompleted) && (
                            <button
                              type="button"
                              className="btn-ring-customer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 9px',
                                borderRadius: '6px',
                                backgroundColor: '#FEF3C7',
                                border: '1px solid #F59E0B',
                                color: '#92400E',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRingCustomer(order);
                              }}
                              title="Bunyikan nada panggilan di HP pembeli"
                            >
                              <Bell size={11} />
                              <span>Panggil HP</span>
                            </button>
                          )}

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
                            <span>{isQrisClaim ? 'Cek & Setujui' : isWaiting ? 'Verifikasi & Bayar' : 'Detail'}</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Optional Expand/Collapse Button for History (>25 orders) to Prevent DOM Bloating */}
                {hasExcessHistory && (
                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                    <button
                      type="button"
                      className="pos-btn-action"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 22px',
                        backgroundColor: 'var(--brand-navy, #1B3B64)',
                        color: '#FFFFFF',
                        borderRadius: 'var(--radius-pill, 9999px)',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))',
                      }}
                      onClick={() => setShowAllHistory((prev) => !prev)}
                    >
                      {showAllHistory
                        ? 'Tampilkan Lebih Sedikit (Maks 25 Pesanan)'
                        : `Tampilkan Semua (${filteredOrders.length} Riwayat Selesai / Batal)`}
                    </button>
                  </div>
                )}
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
            onRingCustomer={handleRingCustomer}
          />

          {/* Daily Sales Summary Modal */}
          <SalesSummaryModal
            isOpen={isSalesSummaryOpen}
            onClose={() => setIsSalesSummaryOpen(false)}
          />

          {/* Merchant QRIS Management Modal */}
          <QrisManagementModal
            isOpen={isQrisModalOpen}
            onClose={() => setIsQrisModalOpen(false)}
          />

          {/* Ring Customer Toast Feedback */}
          {ringToast && (
            <div
              style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                backgroundColor: 'var(--brand-navy, #1B3B64)',
                color: '#FFFFFF',
                padding: '12px 20px',
                borderRadius: '10px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.35)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                fontWeight: '700',
                border: '1.5px solid var(--accent-amber, #C96A2B)',
                animation: 'slideUp 0.25s ease',
              }}
            >
              <Bell size={16} color="var(--accent-amber, #C96A2B)" />
              <span>{ringToast}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

