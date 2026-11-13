import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  X,
  Calendar,
  ShoppingBag,
  Award,
  CreditCard,
  QrCode,
  Banknote,
  RefreshCw,
  AlertCircle,
  Percent,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { fetchDailySalesSummaryApi } from '../services/api';

export const SalesSummaryModal = ({ isOpen, onClose }) => {
  const getTodayDateStr = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDateStr);
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const loadSummary = useCallback(async (date) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchDailySalesSummaryApi(date);
      setSummaryData(data);
    } catch (err) {
      console.error('Failed to load daily sales summary:', err);
      setErrorMessage(err.message || 'Gagal memuat ringkasan penjualan harian');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadSummary(selectedDate);
    }
  }, [isOpen, selectedDate, loadSummary]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalRevenue = summaryData?.total_revenue || 0;
  const cashAmount = summaryData?.payment_breakdown?.Cash || 0;
  const qrisAmount = summaryData?.payment_breakdown?.QRIS || 0;
  const debitAmount = summaryData?.payment_breakdown?.Debit || 0;

  const cashPct = totalRevenue > 0 ? Math.round((cashAmount / totalRevenue) * 100) : 0;
  const qrisPct = totalRevenue > 0 ? Math.round((qrisAmount / totalRevenue) * 100) : 0;
  const debitPct = totalRevenue > 0 ? Math.round((debitAmount / totalRevenue) * 100) : 0;

  return (
    <div className="pos-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="pos-modal-content sales-summary-modal-window"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '92%' }}
      >
        {/* Header */}
        <div className="pos-modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(30, 64, 175, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
              }}
            >
              <TrendingUp size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>
                Laporan Penjualan Harian
              </h2>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                Omzet, metode bayar, dan menu terlaris
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => loadSummary(selectedDate)}
              className="pos-btn-refresh"
              style={{ padding: '6px', background: '#F1F5F9', color: '#334155' }}
              title="Perbarui Data"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              className="pos-modal-close"
              onClick={onClose}
              aria-label="Tutup modal"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748B' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
            <Calendar size={15} color="var(--color-primary)" />
            <span>Pilih Tanggal Laporan:</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                fontFamily: 'inherit',
                fontWeight: '600',
                color: '#1E293B',
                background: '#FFFFFF',
              }}
            />
            {selectedDate !== getTodayDateStr() && (
              <button
                type="button"
                onClick={() => setSelectedDate(getTodayDateStr())}
                style={{
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'rgba(30, 64, 175, 0.12)',
                  color: 'var(--color-primary)',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Hari Ini
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', maxHeight: '72vh', overflowY: 'auto' }}>
          {isLoading && !summaryData ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '12px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #E2E8F0',
                  borderTopColor: 'var(--color-primary)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span style={{ fontSize: '13px', color: '#64748B' }}>Memuat data ringkasan harian...</span>
            </div>
          ) : errorMessage ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#EF4444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={28} />
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{errorMessage}</p>
              <button
                type="button"
                onClick={() => loadSummary(selectedDate)}
                style={{
                  marginTop: '8px',
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  background: 'var(--color-primary)',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 3 Key Metric Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '12px',
                }}
              >
                {/* 1. Total Omzet */}
                <div
                  style={{
                    backgroundColor: '#EFF6FF',
                    border: '1.5px solid #BFDBFE',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total Omzet
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: '900', color: '#1E3A8A' }}>
                    {formatRupiah(totalRevenue)}
                  </span>
                  <span style={{ fontSize: '11px', color: '#60A5FA' }}>
                    Pesanan terkonfirmasi & selesai
                  </span>
                </div>

                {/* 2. Total Transaksi */}
                <div
                  style={{
                    backgroundColor: '#ECFDF5',
                    border: '1.5px solid #A7F3D0',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total Transaksi
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: '900', color: '#064E3B' }}>
                    {summaryData?.total_orders || 0}
                  </span>
                  <span style={{ fontSize: '11px', color: '#34D399' }}>
                    Meja/pesanan terlayani
                  </span>
                </div>

                {/* 3. Average Order Value (AOV) */}
                <div
                  style={{
                    backgroundColor: '#FDF4FF',
                    border: '1.5px solid #F5D0FE',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#86198F', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Rata-rata Order
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: '900', color: '#701A75' }}>
                    {formatRupiah(summaryData?.average_order_value || 0)}
                  </span>
                  <span style={{ fontSize: '11px', color: '#C084FC' }}>
                    Average Order Value (AOV)
                  </span>
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>
                    Distribusi Metode Pembayaran
                  </h3>
                  <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                    Proporsi Omzet
                  </span>
                </div>

                {/* Segmented Bar */}
                <div
                  style={{
                    height: '10px',
                    width: '100%',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: '#F1F5F9',
                    display: 'flex',
                    overflow: 'hidden',
                  }}
                >
                  {cashPct > 0 && (
                    <div
                      style={{ width: `${cashPct}%`, backgroundColor: '#10B981' }}
                      title={`Cash: ${cashPct}%`}
                    />
                  )}
                  {qrisPct > 0 && (
                    <div
                      style={{ width: `${qrisPct}%`, backgroundColor: '#2563EB' }}
                      title={`QRIS: ${qrisPct}%`}
                    />
                  )}
                  {debitPct > 0 && (
                    <div
                      style={{ width: `${debitPct}%`, backgroundColor: '#8B5CF6' }}
                      title={`Debit: ${debitPct}%`}
                    />
                  )}
                </div>

                {/* 3 Detail Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', paddingTop: '4px' }}>
                  {/* Cash */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px 10px', background: '#F8FAFC', borderRadius: '8px', borderLeft: '3px solid #10B981' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700', color: '#047857' }}>
                      <Banknote size={14} />
                      <span>Cash</span>
                      <span style={{ fontSize: '10px', color: '#64748B', marginLeft: 'auto' }}>({cashPct}%)</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>
                      {formatRupiah(cashAmount)}
                    </span>
                  </div>

                  {/* QRIS */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px 10px', background: '#F8FAFC', borderRadius: '8px', borderLeft: '3px solid #2563EB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700', color: '#1D4ED8' }}>
                      <QrCode size={14} />
                      <span>QRIS</span>
                      <span style={{ fontSize: '10px', color: '#64748B', marginLeft: 'auto' }}>({qrisPct}%)</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>
                      {formatRupiah(qrisAmount)}
                    </span>
                  </div>

                  {/* Debit */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px 10px', background: '#F8FAFC', borderRadius: '8px', borderLeft: '3px solid #8B5CF6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700', color: '#6D28D9' }}>
                      <CreditCard size={14} />
                      <span>Debit</span>
                      <span style={{ fontSize: '10px', color: '#64748B', marginLeft: 'auto' }}>({debitPct}%)</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>
                      {formatRupiah(debitAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top 5 Best Sellers */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} color="var(--color-primary)" />
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>
                    5 Menu Terlaris Hari Ini
                  </h3>
                </div>

                {summaryData?.top_items?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {summaryData.top_items.map((item, index) => {
                      const rankColors = [
                        { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' }, // 1st Gold
                        { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' }, // 2nd Silver
                        { bg: '#FFEDD5', color: '#C2410C', border: '#FED7AA' }, // 3rd Bronze
                        { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' }, // 4th
                        { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' }, // 5th
                      ];
                      const badge = rankColors[index] || rankColors[4];

                      return (
                        <div
                          key={item.name + index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: '#F8FAFC',
                            border: '1px solid #F1F5F9',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: badge.bg,
                                color: badge.color,
                                border: `1px solid ${badge.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: '900',
                                flexShrink: 0,
                              }}
                            >
                              #{index + 1}
                            </div>
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: '700',
                                color: '#1E293B',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.name}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: '800',
                                color: 'var(--color-primary)',
                                backgroundColor: 'rgba(30, 64, 175, 0.08)',
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-pill)',
                              }}
                            >
                              {item.qty} porsi
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', minWidth: '80px', textAlign: 'right' }}>
                              {formatRupiah(item.revenue)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '24px 16px',
                      textAlign: 'center',
                      color: '#94A3B8',
                      fontSize: '13px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                    }}
                  >
                    Belum ada menu yang terjual pada tanggal ini.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

