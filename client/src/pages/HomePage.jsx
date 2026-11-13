import React, { useMemo } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  MapPin,
  MessageCircle,
  Globe,
  Plus,
  Sparkles,
  Coffee,
  Heart,
  Award,
  Waves,
  Sun,
  Flame,
} from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { formatRupiah, formatLocationDisplay } from '../utils/formatters';
import { ActiveOrderTracker } from '../components/ActiveOrderTracker';
import '../styles/home-page.css';

// Signature authentic menu picks for home display
const SIGNATURE_HERO = {
  id: 11,
  name: 'Tempe Mendoan Hangat (1 Porsi)',
  tagline: 'Signature Khas Banyumas',
  category: 'Cemilan & Gorengan',
  notes: 'Tempe Kedelai Asli • Daun Bawang • Sambal Kecap Rawit',
  price: 10000,
  image_url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80',
  description: 'Tempe mendoan lembut khas Banyumas berbalut adonan tepung gurih, digoreng setengah matang disajikan hangat dengan sambal kecap cabai rawit pedas mantap.',
};

const SIGNATURE_SECONDARY = [
  {
    id: 3,
    name: 'Nasi Bakar Daun Pisang',
    tagline: 'Makanan Utama',
    category: 'Makanan Utama',
    notes: 'Aroma Bakar • Suwir Ayam Gurih',
    price: 6000,
    image_url: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 16,
    name: 'Kopi Tubruk Panas',
    tagline: 'Kopi Otentik',
    category: 'Minuman Kopi',
    notes: 'Biji Pilihan • Hitam Pekat Mantap',
    price: 5000,
    image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 12,
    name: 'Pisang Goreng Krispi',
    tagline: 'Cemilan Favorit',
    category: 'Cemilan & Gorengan',
    notes: 'Pisang Kepok Manis • Renyah Legit',
    price: 10000,
    image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
  },
];

export const HomePage = ({
  onGoToMenu,
  onGoToCashier,
  activeOrder,
  onOpenTicketModal,
  onDismissActiveOrder,
  onStatusChange,
}) => {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Dynamic Open / Closed schedule status calculation (WIB / UTC+7)
  const shopStatus = useMemo(() => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const wib = new Date(utc + 3600000 * 7);
    const day = wib.getDay(); // 0 = Minggu, 1 = Senin, ... 6 = Sabtu
    const hours = wib.getHours() + wib.getMinutes() / 60;

    if (day === 1) {
      return {
        isOpen: false,
        text: 'Hari Ini Libur (Senin Prei)',
        detail: 'Buka kembali Selasa pukul 11.00 WIB',
        isHoliday: true,
      };
    }

    let openHour = 11;
    let closeHour = 24; // 00:00 midnight

    if (day >= 2 && day <= 4) {
      openHour = 11;
      closeHour = 24;
    } else if (day === 5) {
      openHour = 15;
      closeHour = 24;
    } else if (day === 6) {
      openHour = 10;
      closeHour = 24;
    } else if (day === 0) {
      openHour = 10;
      closeHour = 22;
    }

    const isOpenNow = hours >= openHour && hours < closeHour;
    return {
      isOpen: isOpenNow,
      text: isOpenNow
        ? `Sedang Buka • Sampai ${closeHour === 24 ? '00.00' : '22.00'} WIB`
        : `Sedang Tutup • Buka Pukul ${openHour}.00 WIB`,
      detail: isOpenNow ? 'Pesanan langsung diproses kasir' : 'Buka sesuai jadwal operasional',
      isHoliday: false,
    };
  }, []);

  return (
    <div className="boutique-page">
      {/* ─── 1. Floating Vintage Navbar ─────────────────────────────────── */}
      <header className="boutique-nav-wrapper">
        <nav className="boutique-navbar" aria-label="Navigasi Utama">
          <button
            type="button"
            className="boutique-brand"
            onClick={() => scrollToSection('hero')}
          >
            <span className="brand-wordmark">Blue'sukan</span>
            <span className="brand-dot">•</span>
            <span className="brand-sub">KOPI &amp; ANGKRINGAN</span>
          </button>

          <div className="boutique-nav-links">
            <button type="button" className="boutique-link" onClick={() => scrollToSection('menu-bento')}>
              Menu Andalan
            </button>
            <button type="button" className="boutique-link" onClick={() => scrollToSection('program-sosial')}>
              Program Sosial
            </button>
            <button type="button" className="boutique-link" onClick={() => scrollToSection('story')}>
              Suasana Serayu
            </button>
            <button type="button" className="boutique-link" onClick={() => scrollToSection('location')}>
              Jadwal &amp; Lokasi
            </button>
          </div>

          <div className="boutique-nav-action">
            {activeOrder && (
              <button
                type="button"
                className="boutique-active-order-chip"
                onClick={onOpenTicketModal}
                title="Buka Tiket Pesanan Aktif"
              >
                <Sparkles size={13} aria-hidden="true" />
                <span>Tiket <strong className="tabular">#{activeOrder.order_code}</strong></span>
              </button>
            )}

            <button
              type="button"
              className="btn-boutique-order"
              onClick={onGoToMenu}
              id="nav-cta-order"
            >
              <span>Pesan Mandiri</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          </div>
        </nav>
      </header>

      {/* ─── 2. Hero Section: Spot Bengong Tepi Serayu ─────────────────── */}
      <section id="hero" className="boutique-hero">
        <div className="hero-editorial-canvas">
          {activeOrder && (
            <button
              type="button"
              className="hero-active-order-banner"
              onClick={onOpenTicketModal}
              title="Klik untuk membuka QR Tiket Kasir"
            >
              <span className="hero-order-badge-live" aria-hidden="true" />
              <span className="hero-order-banner-text">
                Pesanan Aktif: <strong className="tabular">{activeOrder.order_code}</strong> ({formatLocationDisplay(activeOrder.table_number)})
              </span>
              <span className="hero-order-banner-link">
                <span>Lihat Tiket QR</span>
                <ArrowUpRight size={13} aria-hidden="true" />
              </span>
            </button>
          )}

          <div className="hero-text-block">
            <div className="hero-meta-overline">
              <Waves size={13} strokeWidth={2.4} />
              <span>RAWALO, BANYUMAS</span>
              <span className="meta-sep">•</span>
              <span>SPOT BENGONG TEPI SERAYU</span>
            </div>

            <h1 className="hero-editorial-heading">
              <span className="hero-heading-line">
                <span className="hero-heading-mask">Ngopi Santai di Tepi Serayu,</span>
              </span>
              <span className="hero-heading-line">
                <em className="hero-serif-accent hero-heading-mask">Pesan Langsung dari Meja.</em>
              </span>
            </h1>

            <p className="hero-editorial-sub">
              Warung kayu vintage, semilir angin Bendung Gerak Serayu, dan cangkir kopi panas khas angkringan.
              Duduk nyaman, pilih menu favoritmu, dan tunjukkan tiket pesanan digital langsung ke kasir.
            </p>

            <div className="hero-actions-row">
              <button
                type="button"
                className="btn-editorial-primary"
                onClick={onGoToMenu}
                id="hero-main-cta"
              >
                <span>Buka Menu &amp; Pesan Sekarang</span>
                <ArrowRight size={17} className="btn-cta-arrow" aria-hidden="true" />
              </button>

              <button
                type="button"
                className="btn-editorial-secondary"
                onClick={() => scrollToSection('location')}
              >
                <span>Cek Jadwal Operasional</span>
                <ArrowRight size={15} className="btn-secondary-arrow" aria-hidden="true" />
              </button>
            </div>

            {/* Official Tagline Badge */}
            <div className="hero-poster-tagline-badge">
              <span>Nongkrong Asyik • Kopi Enak • Teman Asyik • Hati Bahagia</span>
            </div>

            {/* 3 Seating Location Cards (Model A Seating) */}
            <div className="hero-seating-cards-grid">
              <div className="hero-seating-card" onClick={onGoToMenu}>
                <div className="seating-card-icon">☕</div>
                <div className="seating-card-info">
                  <h4>Indoor Vintage</h4>
                  <p>Teras kayu jati teduh beratap</p>
                </div>
              </div>

              <div className="hero-seating-card highlight" onClick={onGoToMenu}>
                <div className="seating-card-icon">🌊</div>
                <div className="seating-card-info">
                  <h4>Outdoor Tepi Serayu</h4>
                  <p>Semilir angin aliran sungai lepas</p>
                </div>
              </div>

              <div className="hero-seating-card" onClick={onGoToMenu}>
                <div className="seating-card-icon">🌿</div>
                <div className="seating-card-info">
                  <h4>Area Lt 2</h4>
                  <p>Balkon panorama Bendung Gerak</p>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-media-asymmetric-wrap">
            <div className="hero-media-frame">
              <img
                src={getOptimizedImageUrl(
                  'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=1000&q=85',
                  800
                )}
                alt="Angkringan Blue'sukan Kopi Serayu"
                className="hero-asymmetric-img"
                loading="eager"
                decoding="async"
              />
              <div className="hero-media-badge-tag">
                <span>📍 Tepi Bendung Gerak Serayu</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. Special Social Program Banner (Dari Poster Resmi) ─────── */}
      <section id="program-sosial" className="boutique-section program-section">
        <div className="boutique-container">
          <div className="social-honor-banner">
            <div className="social-honor-badge">
              <Award size={20} color="#FFFFFF" strokeWidth={2.4} />
              <span>PROGRAM SOSIAL RESMI</span>
            </div>
            <div className="social-honor-content">
              <h2 className="social-honor-title">
                ⭐ KHUSUS GURU HONORER: Makan Siang di Blue'sukan Kopi GRATIS!
              </h2>
              <p className="social-honor-desc">
                Wujud penghormatan tulus kami bagi para pahlawan tanpa tanda jasa yang mengabdi tanpa kenal lelah.
                Cukup tunjukkan kartu identitas guru atau bukti mengajar aktif Anda kepada kasir saat berkunjung.
              </p>
              <div className="social-honor-quote">
                <span>"Muliakan para pendidik, berkahkan rezeki bersama."</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. Signature Menu Bento Grid ──────────────────────────────── */}
      <section id="menu-bento" className="boutique-section bento-section">
        <div className="boutique-container">
          <div className="section-header-editorial">
            <span className="section-label-overline">PILIHAN FAVORIT PENGUNJUNG</span>
            <h2 className="section-editorial-title">Menu Andalan Angkringan</h2>
            <p className="section-editorial-lead">
              Gorengan mendoan hangat khas Banyumas, nasi bakar pulen, dan racikan kopi seduh tradisional.
            </p>
          </div>

          <div className="bento-grid">
            {/* Bento Large Hero Card */}
            <div className="bento-card bento-hero-card" onClick={onGoToMenu}>
              <div className="bento-hero-image-wrap">
                <img
                  src={getOptimizedImageUrl(SIGNATURE_HERO.image_url, 800)}
                  alt={SIGNATURE_HERO.name}
                  className="bento-hero-img"
                  loading="lazy"
                  decoding="async"
                />
                <div className="bento-card-scrim"></div>
                <div className="bento-badge-tag">{SIGNATURE_HERO.tagline}</div>
              </div>

              <div className="bento-hero-body">
                <div className="bento-category-tag">{SIGNATURE_HERO.category}</div>
                <h3 className="bento-hero-title">{SIGNATURE_HERO.name}</h3>
                <p className="bento-hero-notes">{SIGNATURE_HERO.notes}</p>
                <p className="bento-hero-desc">{SIGNATURE_HERO.description}</p>

                <div className="bento-card-footer">
                  <span className="bento-price-tag">{formatRupiah(SIGNATURE_HERO.price)}</span>
                  <button
                    type="button"
                    className="bento-quick-add"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGoToMenu();
                    }}
                  >
                    <span>Pesan</span>
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Bento Stacked Secondary Cards */}
            <div className="bento-stacked-col">
              {SIGNATURE_SECONDARY.map((item) => (
                <div
                  key={item.id}
                  className="bento-card bento-item-card"
                  onClick={onGoToMenu}
                >
                  <div className="bento-item-img-wrap">
                    <img
                      src={getOptimizedImageUrl(item.image_url, 400)}
                      alt={item.name}
                      className="bento-item-img"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="bento-card-scrim"></div>
                    <span className="bento-badge-tag-sm">{item.tagline}</span>
                  </div>

                  <div className="bento-item-body">
                    <div className="bento-category-tag">{item.category}</div>
                    <h4 className="bento-item-title">{item.name}</h4>
                    <p className="bento-item-notes">{item.notes}</p>

                    <div className="bento-card-footer">
                      <span className="bento-price-tag">{formatRupiah(item.price)}</span>
                      <button
                        type="button"
                        className="bento-quick-add-sm"
                        aria-label={`Pesan ${item.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onGoToMenu();
                        }}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bento-cta-row">
            <button
              type="button"
              className="btn-editorial-explore-menu"
              onClick={onGoToMenu}
            >
              <span>Buka Menu Selengkapnya (55 Pilihan)</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── 5. Suasana & Cerita Tepi Serayu ────────────────────────────── */}
      <section id="story" className="boutique-section story-section">
        <div className="boutique-container">
          <div className="story-split-grid">
            <div className="story-image-column">
              <div className="story-image-frame">
                <img
                  src={getOptimizedImageUrl(
                    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
                    800
                  )}
                  alt="Suasana Ngopi di Blue'sukan Kopi"
                  className="story-main-img"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="story-quote-card">
                <p className="story-quote-text">
                  “Duduk tenang di tepi Serayu, melepas penat bersama secangkir kopi dan sepiring mendoan hangat.”
                </p>
                <span className="story-quote-author">— Angkringan Blue'sukan Kopi</span>
              </div>
            </div>

            <div className="story-text-column">
              <span className="section-label-overline">SUASANA WARUNG</span>
              <h2 className="story-heading">
                Teduh di Tepi Sungai, <br />
                <em className="story-serif-accent">Hangat Bersama Kawan.</em>
              </h2>

              <p className="story-paragraph">
                Angkringan Blue'sukan Kopi hadir sebagai oase sederhana di tepi Bendung Gerak Serayu, Rawalo.
                Di sini Anda bebas menikmati gemericik air sungai, hembusan angin segar, serta obrolan santai tanpa batasan waktu.
              </p>

              <div className="story-pillars">
                <div className="story-pillar-item">
                  <span className="pillar-num">01</span>
                  <div className="pillar-content">
                    <h4 className="pillar-title">Panorama Tepi Serayu</h4>
                    <p className="pillar-desc">
                      Pemandangan langsung ke arah sungai dan Bendung Gerak, sempurna untuk spot bengong sore hingga malam.
                    </p>
                  </div>
                </div>

                <div className="story-pillar-item">
                  <span className="pillar-num">02</span>
                  <div className="pillar-content">
                    <h4 className="pillar-title">Cita Rasa Otentik &amp; Murah Meriah</h4>
                    <p className="pillar-desc">
                      Dari mendoan hangat, nasi bakar, hingga aneka kopi sachet dan jahe susu dengan harga ramah kantong.
                    </p>
                  </div>
                </div>

                <div className="story-pillar-item">
                  <span className="pillar-num">03</span>
                  <div className="pillar-content">
                    <h4 className="pillar-title">Pesan Mandiri Cepat Tanpa Antre</h4>
                    <p className="pillar-desc">
                      Pilih tempat duduk favorit Anda, buka web di HP, dan pesan langsung tanpa perlu repot berdiri di kasir.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. Jadwal Operasional & Lokasi Resmi ───────────────────────── */}
      <section id="location" className="boutique-section location-section">
        <div className="boutique-container">
          <div className="section-header-editorial">
            <span className="section-label-overline">JADWAL &amp; LOKASI</span>
            <h2 className="section-editorial-title">Jadwal Operasional Resmi</h2>
            <p className="section-editorial-lead">
              Kunjungi kami di tepi Bendung Gerak Serayu, Rawalo, Banyumas.
            </p>
          </div>

          <div className="location-editorial-grid">
            {/* Card 1: Jadwal Jam Buka Resmi */}
            <div className="location-editorial-card">
              <div className="loc-card-header">
                <Clock size={20} className="loc-card-icon" />
                <span className="loc-card-label">JADWAL ASLI POSTER</span>
              </div>

              {/* Status Pill Dinamis */}
              <div className={`loc-live-status-pill ${shopStatus.isOpen ? 'open' : 'closed'}`}>
                <span className="indicator-dot" />
                <strong>{shopStatus.text}</strong>
              </div>

              <div className="loc-hours-table">
                <div className="loc-hours-row holiday">
                  <span>Senin</span>
                  <strong>LIBUR (Alias Prei)</strong>
                </div>
                <div className="loc-hours-row">
                  <span>Selasa – Kamis</span>
                  <strong>11.00 – 00.00 WIB</strong>
                </div>
                <div className="loc-hours-row">
                  <span>Jumat</span>
                  <strong>15.00 – 00.00 WIB</strong>
                </div>
                <div className="loc-hours-row">
                  <span>Sabtu</span>
                  <strong>10.00 – 00.00 WIB</strong>
                </div>
                <div className="loc-hours-row">
                  <span>Minggu</span>
                  <strong>10.00 – 22.00 WIB</strong>
                </div>
              </div>
            </div>

            {/* Card 2: Alamat Lengkap */}
            <div className="location-editorial-card">
              <div className="loc-card-header">
                <MapPin size={20} className="loc-card-icon" />
                <span className="loc-card-label">ALAMAT LOKASI</span>
              </div>
              <h3 className="loc-card-value">Angkringan Blue'sukan Kopi</h3>
              <p className="loc-card-address">
                Kawasan Tepi Bendung Gerak Serayu, Kecamatan Rawalo, Kabupaten Banyumas, Jawa Tengah 53173
              </p>
              <div className="loc-landmark-pill">
                <span>📍 Tepat di pinggir aliran Sungai Serayu</span>
              </div>
              <div style={{ marginTop: '14px' }}>
                <a
                  href="https://maps.google.com/?q=Bendung+Gerak+Serayu+Rawalo+Banyumas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="loc-social-btn"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <MapPin size={15} />
                  <span>Buka di Google Maps</span>
                </a>
              </div>
            </div>

            {/* Card 3: Kontak & Media Sosial */}
            <div className="location-editorial-card">
              <div className="loc-card-header">
                <Globe size={20} className="loc-card-icon" />
                <span className="loc-card-label">KONTAK RESMI</span>
              </div>
              <p className="loc-contact-desc">
                Ikuti media sosial kami untuk kabar terbaru, promo, dan suasana senja tepi Serayu:
              </p>
              <div className="loc-social-links">
                <a
                  href="https://instagram.com/bluesukankopi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="loc-social-btn"
                >
                  <Globe size={15} />
                  <span>Instagram: @bluesukankopi</span>
                </a>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="loc-social-btn"
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp Layanan &amp; Tanya Meja</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. Vintage Navy Footer ────────────────────────────────────── */}
      <footer className="boutique-footer">
        <div className="boutique-container">
          <div className="footer-main-grid">
            <div className="footer-brand-block">
              <div className="footer-brand-title">
                <span>Blue'sukan</span>
                <span className="brand-dot">•</span>
                <span>KOPI</span>
              </div>
              <p className="footer-brand-desc">
                Angkringan &amp; Spot Bengong Tepi Serayu, Rawalo, Banyumas.
                Nongkrong Asyik • Kopi Enak • Teman Asyik • Hati Bahagia.
              </p>
            </div>

            <div className="footer-nav-block">
              <span className="footer-nav-heading">NAVIGASI</span>
              <ul className="footer-nav-list">
                <li><button type="button" onClick={() => scrollToSection('hero')}>Beranda</button></li>
                <li><button type="button" onClick={onGoToMenu}>Katalog Menu (55)</button></li>
                <li><button type="button" onClick={() => scrollToSection('program-sosial')}>Program Guru Honorer</button></li>
                <li><button type="button" onClick={() => scrollToSection('location')}>Jadwal &amp; Lokasi</button></li>
              </ul>
            </div>

            <div className="footer-nav-block">
              <span className="footer-nav-heading">AKSES SISTEM</span>
              <ul className="footer-nav-list">
                <li><button type="button" onClick={onGoToMenu}>Pesan Mandiri (Guest)</button></li>
                <li><button type="button" onClick={onGoToCashier}>Dashboard Kasir POS</button></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <span className="footer-copyright">
              © {new Date().getFullYear()} Angkringan Blue'sukan Kopi. Rawalo, Banyumas.
            </span>
            <div className="footer-payment-chips">
              <span>QRIS</span>
              <span>TUNAI / CASH</span>
              <span>DEBIT</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── 8. Floating Active Order Tracker ─────────────────────────── */}
      {activeOrder && (
        <ActiveOrderTracker
          order={activeOrder}
          onOpenTicket={onOpenTicketModal}
          onDismiss={onDismissActiveOrder}
          onStatusChange={onStatusChange}
        />
      )}
    </div>
  );
};
