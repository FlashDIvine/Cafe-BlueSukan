import React, { useState, useMemo } from 'react';
import { useOrder } from '../hooks/useOrder';
import { formatLocationDisplay } from '../utils/formatters';
import { Navbar } from '../components/Navbar';
import { MenuCard } from '../components/MenuCard';
import { Footer } from '../components/Footer';
import { TableModal } from '../components/TableModal';
import { ActiveOrderTracker } from '../components/ActiveOrderTracker';
import '../styles/home-page.css';

const SCHEDULE_DAYS = [
  { id: 'mon', label: 'Senin', hours: 'Libur', isHoliday: true, matchDay: 1 },
  { id: 'tue-thu', label: 'Selasa – Kamis', hours: '11.00 – 00.00 WIB', isHoliday: false, matchDays: [2, 3, 4] },
  { id: 'fri', label: 'Jumat', hours: '15.00 – 00.00 WIB', isHoliday: false, matchDay: 5 },
  { id: 'sat', label: 'Sabtu', hours: '10.00 – 00.00 WIB', isHoliday: false, matchDay: 6 },
  { id: 'sun', label: 'Minggu', hours: '10.00 – 22.00 WIB', isHoliday: false, matchDay: 0 },
];

export const HomePage = ({
  onGoToMenu,
  onGoToCashier,
  activeOrder,
  onOpenTicketModal,
  onDismissActiveOrder,
  onStatusChange,
}) => {
  const { tableNumber, menus } = useOrder();
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Current day in WIB (UTC+7)
  const currentDay = useMemo(() => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const wib = new Date(utc + 3600000 * 7);
    return wib.getDay();
  }, []);

  // Display table code and area for sticker
  const cleanOrderCode = activeOrder?.order_code
    ? activeOrder.order_code.replace(/^#+/, '')
    : '';
  const tableCodeDisplay = cleanOrderCode || (tableNumber ? tableNumber.replace(/^#+/, '') : '1');
  const areaDisplay = formatLocationDisplay(activeOrder?.table_number || tableNumber || 'Indoor');

  // Featured menu items for home display (text-first rows, no photos)
  const featuredMenus = useMemo(() => {
    if (!menus || menus.length === 0) return [];
    const popular = menus.filter((m) => m.is_popular);
    if (popular.length >= 3) return popular.slice(0, 5);
    return menus.slice(0, 5);
  }, [menus]);

  return (
    <div className="antislop-home-page">
      {/* ─── 1. Navbar with Brand & Yellow Pill ──────────────────────────── */}
      <Navbar
        onOpenTableModal={() => setIsTableModalOpen(true)}
        onGoHome={() => scrollToSection('hero')}
        activeOrder={activeOrder}
        onOpenTicketModal={onOpenTicketModal}
      />

      <main className="home-main-container">
        {/* ─── 2. Hero Section ───────────────────────────────────────────── */}
        <section id="hero" className="home-hero-section">
          <div className="hero-text-block">
            <h1 className="hero-heading">Ngopi di tepi Serayu.</h1>
            <p className="hero-subtext">
              Warung kayu di sisi Bendung Gerak Serayu, Rawalo. Pilih menu dari HP, bayar di kasir.
            </p>
            <div className="hero-actions">
              <button
                type="button"
                className="btn-hero-primary"
                onClick={onGoToMenu}
              >
                <span>Lihat menu</span>
              </button>
            </div>
          </div>

          <div className="hero-visual-block" aria-hidden="true">
            <div className="hero-cup-wrap">
              <svg viewBox="0 0 120 130" fill="none" className="tin-cup-svg">
                <g strokeWidth="4" strokeLinecap="round" stroke="var(--muted)">
                  <path className="cup-steam-path" d="M42 30c-8-8 8-14 0-24" />
                  <path className="cup-steam-path" d="M62 32c-8-8 8-14 0-26" />
                  <path className="cup-steam-path" d="M82 30c-8-8 8-14 0-24" />
                </g>
                <path d="M18 48h84l-7 52c-1.5 11-10 18-21 18H46c-11 0-19.5-7-21-18z" fill="currentColor" />
                <path d="M100 58c20-2 22 26 0 30" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                <rect x="14" y="44" width="92" height="9" rx="4.5" fill="#C4472F" />
              </svg>

              <div className="hero-sticker-badge">
                <span>Meja {tableCodeDisplay} / {areaDisplay}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 3. Pita Biru Guru Honorer ─────────────────────────────────── */}
        <section id="program-guru" className="pita-guru-section">
          <div className="pita-wavy-top" aria-hidden="true">
            <svg viewBox="0 0 400 18" preserveAspectRatio="none" className="wavy-svg">
              <path d="M0 18V8c25-14 50 10 75 0s50-12 75 0 50 10 75 0 50-12 75 0 50 10 75 0V18z" fill="currentColor" />
            </svg>
          </div>

          <div className="pita-guru-body">
            <h2 className="pita-guru-title">Guru honorer makan siang gratis.</h2>
            <p className="pita-guru-sub">Tunjukkan kartu identitas guru aktif ke kasir.</p>
          </div>

          <div className="pita-wavy-bottom" aria-hidden="true">
            <svg viewBox="0 0 400 18" preserveAspectRatio="none" className="wavy-svg-inverted">
              <path d="M0 18V8c25-14 50 10 75 0s50-12 75 0 50 10 75 0 50-12 75 0 50 10 75 0V18z" fill="currentColor" />
            </svg>
          </div>
        </section>

        {/* ─── 4. Menu Andalan ───────────────────────────────────────────── */}
        <section id="menu-andalan" className="home-menu-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Menu andalan</h2>
          </div>

          <div className="home-menu-list">
            {featuredMenus.map((item) => (
              <MenuCard key={`featured-${item.id}`} item={item} />
            ))}
          </div>

          <div className="home-menu-footer-cta">
            <button
              type="button"
              className="btn-all-menus"
              onClick={onGoToMenu}
            >
              <span>Semua {menus.length || 55} menu</span>
            </button>
          </div>
        </section>

        {/* ─── 5. Jam Buka & Alamat ──────────────────────────────────────── */}
        <section id="location" className="home-info-section">
          <div className="info-card">
            <h2 className="info-title">Jam buka</h2>
            <p className="info-subtext">Senin libur.</p>

            <div className="schedule-list">
              {SCHEDULE_DAYS.map((dayItem) => {
                const isToday =
                  dayItem.matchDay === currentDay ||
                  (dayItem.matchDays && dayItem.matchDays.includes(currentDay));

                return (
                  <div
                    key={dayItem.id}
                    className={`schedule-row ${isToday ? 'today-row' : ''}`}
                  >
                    <span className="schedule-label">{dayItem.label}</span>
                    <span className={`schedule-hours ${dayItem.isHoliday ? 'holiday' : ''}`}>
                      {dayItem.hours}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="info-card">
            <h2 className="info-title">Alamat</h2>
            <p className="info-subtext">
              Kawasan Tepi Bendung Gerak Serayu, Rawalo, Banyumas.
            </p>

            <div className="maps-btn-wrap">
              <a
                href="https://maps.google.com/?q=Bendung+Gerak+Serayu+Rawalo+Banyumas"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-maps"
              >
                <span>Buka di Google Maps</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ─── 6. Footer ─────────────────────────────────────────────────── */}
      <Footer
        onGoToMenu={onGoToMenu}
        onGoToCashier={onGoToCashier}
        onScrollToSection={scrollToSection}
      />

      {/* ─── 7. Floating Active Order Tracker ──────────────────────────── */}
      {activeOrder && (
        <ActiveOrderTracker
          order={activeOrder}
          onOpenTicket={onOpenTicketModal}
          onDismiss={onDismissActiveOrder}
          onStatusChange={onStatusChange}
        />
      )}

      {/* ─── 8. Table Selection Modal ──────────────────────────────────── */}
      <TableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
      />
    </div>
  );
};
