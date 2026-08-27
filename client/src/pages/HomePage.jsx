import React from 'react';
import {
  Coffee,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  Phone,
  Globe,
  MessageCircle,
  Wifi,
  Zap,
  Award,
  Heart,
  ChevronRight,
  ShieldCheck,
  Star,
  QrCode,
  Flame,
} from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { formatRupiah } from '../utils/formatters';
import '../styles/home-page.css';

const FEATURED_ITEMS = [
  {
    id: 1,
    name: 'Kopi Susu Gula Aren',
    category: 'Kopi & Espresso',
    categoryBadge: 'Best Seller',
    price: 22000,
    rating: '4.9',
    description: 'Espresso double shot dengan susu segar creamy dan sirup aren murni asli.',
    image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 5,
    name: 'Matcha Latte Uji',
    category: 'Non-Coffee',
    categoryBadge: 'Artisan',
    price: 26000,
    rating: '4.8',
    description: 'Bubuk matcha murni asal Kyoto dengan susu segar pilihan, manis pas dan harum.',
    image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 3,
    name: 'Caramel Macchiato',
    category: 'Kopi & Espresso',
    categoryBadge: 'Favorit',
    price: 28000,
    rating: '4.9',
    description: 'Steamed milk dengan sentuhan vanilla, espresso, dan saus karamel legit.',
    image_url: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 8,
    name: 'Crispy Truffle Fries',
    category: 'Makanan Ringan',
    categoryBadge: 'Chef Pick',
    price: 24000,
    rating: '4.8',
    description: 'Kentang goreng renyah dengan minyak truffle aromatik, keju parmesan, dan saus cocol.',
    image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
  },
];

export const HomePage = ({ onGoToMenu, onGoToCashier }) => {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page-wrapper">
      {/* ─── 1. Modern Top Landing Navigation ────────────────────────────── */}
      <nav className="landing-navbar">
        <div className="landing-nav-container">
          <div className="landing-brand" onClick={() => scrollToSection('hero')}>
            <div className="landing-brand-icon">
              <Coffee size={22} color="#FFFFFF" strokeWidth={2.4} />
            </div>
            <div className="landing-brand-titles">
              <span className="landing-brand-name">Bantu Cafe</span>
              <span className="landing-brand-sub">BlueSukan Specialty</span>
            </div>
          </div>

          <div className="landing-nav-links">
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection('hero')}>
              Beranda
            </button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection('featured')}>
              Menu Favorit
            </button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection('about')}>
              Tentang Kami
            </button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection('location')}>
              Lokasi &amp; Jam Buka
            </button>
          </div>

          <div className="landing-nav-actions">
            <button
              type="button"
              className="btn-landing-order"
              onClick={onGoToMenu}
              id="landing-cta-navbar"
            >
              <Zap size={16} />
              <span>Lihat Menu &amp; Pesan</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ─── 2. Hero Section ─────────────────────────────────────────────── */}
      <section id="hero" className="landing-hero-section">
        <div className="landing-hero-container">
          <div className="hero-content-col">
            <div className="hero-pill-badge">
              <Sparkles size={14} color="var(--color-royal-blue)" />
              <span>Sistem Pemesanan Mandiri Meja Tanpa Antre</span>
            </div>

            <h1 className="hero-main-title">
              Nikmati Kopi Autentik &amp; Suasana Hangat di <span className="hero-highlight-text">Bantu Cafe</span>
            </h1>

            <p className="hero-lead-text">
              Pesan langsung dari kenyamanan mejamu dalam hitungan detik. Diracik khusus dengan biji kopi artisan pilihan dan bahan baku premium terbaik.
            </p>

            <div className="hero-cta-group">
              <button
                type="button"
                className="hero-btn-primary"
                onClick={onGoToMenu}
                id="hero-cta-order-now"
              >
                <span>Pesan Sekarang (Buka Menu)</span>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="hero-btn-secondary"
                onClick={() => scrollToSection('location')}
              >
                <MapPin size={17} />
                <span>Petunjuk Lokasi</span>
              </button>
            </div>

            {/* Quick Feature Perks */}
            <div className="hero-perks-row">
              <div className="hero-perk-item">
                <div className="perk-icon-circle">
                  <Zap size={15} color="var(--color-royal-blue)" />
                </div>
                <span>Pesan Cepat 1 Klik</span>
              </div>

              <div className="hero-perk-item">
                <div className="perk-icon-circle">
                  <Award size={15} color="var(--color-royal-blue)" />
                </div>
                <span>100% Specialty Beans</span>
              </div>

              <div className="hero-perk-item">
                <div className="perk-icon-circle">
                  <Wifi size={15} color="var(--color-royal-blue)" />
                </div>
                <span>Free High-Speed WiFi</span>
              </div>
            </div>
          </div>

          <div className="hero-visual-col">
            <div className="hero-image-frame">
              <img
                src={getOptimizedImageUrl(
                  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
                  800
                )}
                alt="Suasana Bantu Cafe"
                className="hero-main-img"
                loading="eager"
                decoding="async"
              />
              <div className="hero-img-gradient-overlay"></div>

              {/* Floating Badge 1: Customer Rating */}
              <div className="hero-floating-badge badge-top-right">
                <div className="badge-star-icon">
                  <Star size={16} fill="#F59E0B" color="#F59E0B" />
                </div>
                <div className="badge-text-group">
                  <span className="badge-val">4.9 / 5.0</span>
                  <span className="badge-lbl">1,250+ Ulasan Pelanggan</span>
                </div>
              </div>

              {/* Floating Badge 2: Quick Prep Time */}
              <div className="hero-floating-badge badge-bottom-left">
                <div className="badge-clock-icon">
                  <Clock size={16} color="var(--color-royal-blue)" />
                </div>
                <div className="badge-text-group">
                  <span className="badge-val">5–8 Menit</span>
                  <span className="badge-lbl">Rata-rata Penyajian</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. Featured Menu Highlights ─────────────────────────────────── */}
      <section id="featured" className="landing-featured-section">
        <div className="landing-section-container">
          <div className="section-header-centered">
            <div className="section-subtitle-pill">
              <Flame size={14} color="var(--color-royal-blue)" />
              <span>Menu Rekomendasi Barista</span>
            </div>
            <h2 className="section-main-title">Pilihan Menu Terfavorit</h2>
            <p className="section-desc-text">
              Koleksi racikan kopi dan hidangan pendamping yang paling dicintai oleh pengunjung setia kami.
            </p>
          </div>

          <div className="featured-cards-grid">
            {FEATURED_ITEMS.map((item) => (
              <div key={item.id} className="featured-product-card">
                <div className="featured-img-wrap">
                  <img
                    src={getOptimizedImageUrl(item.image_url, 400)}
                    alt={item.name}
                    className="featured-card-img"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="featured-category-badge">{item.categoryBadge}</span>
                  <div className="featured-rating-pill">
                    <Star size={12} fill="#F59E0B" color="#F59E0B" />
                    <span>{item.rating}</span>
                  </div>
                </div>

                <div className="featured-card-body">
                  <span className="featured-item-cat">{item.category}</span>
                  <h3 className="featured-item-title">{item.name}</h3>
                  <p className="featured-item-desc">{item.description}</p>

                  <div className="featured-card-footer">
                    <div className="featured-price-wrap">
                      <span className="featured-price-label">Harga</span>
                      <span className="featured-price-value">{formatRupiah(item.price)}</span>
                    </div>

                    <button
                      type="button"
                      className="featured-order-btn"
                      onClick={onGoToMenu}
                      title={`Pesan ${item.name}`}
                    >
                      <span>Pesan</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="featured-bottom-cta">
            <button
              type="button"
              className="btn-view-all-menus"
              onClick={onGoToMenu}
            >
              <span>Jelajahi Semua 12+ Menu Lengkap</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── 4. About Cafe & Story ───────────────────────────────────────── */}
      <section id="about" className="landing-about-section">
        <div className="landing-section-container">
          <div className="about-grid-layout">
            <div className="about-image-mosaic">
              <div className="mosaic-card-main">
                <img
                  src={getOptimizedImageUrl(
                    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=600&q=80',
                    600
                  )}
                  alt="Barista Bantu Cafe"
                  className="mosaic-img"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="mosaic-card-accent">
                <div className="mosaic-badge-content">
                  <Coffee size={28} color="#FFFFFF" />
                  <span className="mosaic-number">100%</span>
                  <span className="mosaic-label">Artisan Roasted Beans</span>
                </div>
              </div>
            </div>

            <div className="about-content-col">
              <div className="section-subtitle-pill">
                <Heart size={14} color="var(--color-royal-blue)" />
                <span>Cerita &amp; Filosofi Kami</span>
              </div>

              <h2 className="about-heading">
                Lebih dari Sekadar Kafe — Tempat Inspirasi, Kolaborasi &amp; Kehangatan
              </h2>

              <p className="about-paragraph">
                Bantu Cafe lahir dari kecintaan kami terhadap kopi Nusantara berkualitas tinggi dan keinginan untuk menciptakan ruang yang nyaman bagi siapa saja: mulai dari penikmat kopi santai, pekerja kreatif, hingga teman-teman yang ingin berbincang hangat.
              </p>

              <div className="about-features-list">
                <div className="about-feature-box">
                  <div className="about-feat-icon">
                    <ShieldCheck size={20} color="var(--color-royal-blue)" />
                  </div>
                  <div className="about-feat-text">
                    <h4>Biji Kopi Pilihan Berkualitas</h4>
                    <p>Hanya menggunakan biji kopi specialty grade yang dipanggang dengan profil rasa presisi.</p>
                  </div>
                </div>

                <div className="about-feature-box">
                  <div className="about-feat-icon">
                    <QrCode size={20} color="var(--color-royal-blue)" />
                  </div>
                  <div className="about-feat-text">
                    <h4>Pemesanan Mandiri Digital (Self-Order)</h4>
                    <p>Cukup scan QR meja, pilih menu favorit, dan bayar dengan mudah tanpa perlu berdiri mengantre.</p>
                  </div>
                </div>

                <div className="about-feature-box">
                  <div className="about-feat-icon">
                    <Wifi size={20} color="var(--color-royal-blue)" />
                  </div>
                  <div className="about-feat-text">
                    <h4>Ruang Ramah Kerja &amp; Santai</h4>
                    <p>Dilengkapi koneksi WiFi berkecepatan tinggi, stopkontak melimpah di setiap sudut meja.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. Location, Hours & Contact ────────────────────────────────── */}
      <section id="location" className="landing-location-section">
        <div className="landing-section-container">
          <div className="section-header-centered">
            <div className="section-subtitle-pill">
              <MapPin size={14} color="var(--color-royal-blue)" />
              <span>Kunjungi Kami</span>
            </div>
            <h2 className="section-main-title">Lokasi, Jam Operasional &amp; Kontak</h2>
            <p className="section-desc-text">
              Kami siap menyambut Anda setiap hari dengan secangkir kopi segar dan senyuman hangat.
            </p>
          </div>

          <div className="location-cards-grid">
            {/* Card 1: Address & Directions */}
            <div className="location-info-card">
              <div className="location-card-icon">
                <MapPin size={24} color="var(--color-royal-blue)" />
              </div>
              <h3 className="location-card-title">Alamat Kafe</h3>
              <p className="location-card-desc">
                Jl. Kemang Raya No. 42, RT.02/RW.02, Bangka, Kec. Mampang Prapatan, Kota Jakarta Selatan, DKI Jakarta 12730
              </p>
              <div className="location-chip">
                <span>📍 Seberang Taman Kemang Plaza</span>
              </div>
            </div>

            {/* Card 2: Hours */}
            <div className="location-info-card">
              <div className="location-card-icon">
                <Clock size={24} color="var(--color-royal-blue)" />
              </div>
              <h3 className="location-card-title">Jam Operasional</h3>
              <div className="hours-schedule-list">
                <div className="hours-row">
                  <span>Senin – Jumat:</span>
                  <strong>08:00 – 23:00 WIB</strong>
                </div>
                <div className="hours-row">
                  <span>Sabtu – Minggu:</span>
                  <strong>07:30 – 23:30 WIB</strong>
                </div>
                <div className="hours-row highlight-live">
                  <span className="live-status-dot"></span>
                  <span>Buka Hari Ini &amp; Siap Melayani</span>
                </div>
              </div>
            </div>

            {/* Card 3: Contact & Social */}
            <div className="location-info-card">
              <div className="location-card-icon">
                <Phone size={24} color="var(--color-royal-blue)" />
              </div>
              <h3 className="location-card-title">Kontak &amp; Reservasi</h3>
              <p className="location-card-desc">
                Ada pertanyaan mengenai reservasi acara atau pesanan khusus? Hubungi barista kami langsung.
              </p>
              <div className="contact-links-list">
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-link-pill"
                >
                  <MessageCircle size={14} />
                  <span>WhatsApp: +62 812-3456-7890</span>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-link-pill"
                >
                  <Globe size={14} />
                  <span>Instagram: @bantucafe.id</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. Deep Navy Footer ─────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div className="footer-top-row">
            <div className="footer-brand-col">
              <div className="footer-brand-logo">
                <div className="footer-logo-icon">
                  <Coffee size={22} color="#FFFFFF" strokeWidth={2.4} />
                </div>
                <span className="footer-brand-text">Bantu Cafe</span>
              </div>
              <p className="footer-tagline">
                Pengalaman ngopi modern dengan sistem self-order meja instan. Diracik sepenuh hati untuk pecinta kopi sejati.
              </p>
            </div>

            <div className="footer-links-col">
              <span className="footer-heading">Navigasi Cepat</span>
              <ul className="footer-links-list">
                <li><button type="button" onClick={() => scrollToSection('hero')}>Beranda</button></li>
                <li><button type="button" onClick={onGoToMenu}>Katalog Menu Digital</button></li>
                <li><button type="button" onClick={() => scrollToSection('about')}>Tentang Kami</button></li>
                <li><button type="button" onClick={() => scrollToSection('location')}>Lokasi &amp; Jam Buka</button></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <span className="footer-heading">Akses Sistem</span>
              <ul className="footer-links-list">
                <li><button type="button" onClick={onGoToMenu}>Pesan Mandiri (Guest)</button></li>
                <li><button type="button" onClick={onGoToCashier}>Dashboard Kasir POS</button></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-row">
            <p className="footer-copyright">
              © {new Date().getFullYear()} Bantu Cafe (BlueSukan). All rights reserved.
            </p>
            <div className="footer-payment-tags">
              <span className="payment-tag">QRIS</span>
              <span className="payment-tag">GoPay</span>
              <span className="payment-tag">OVO</span>
              <span className="payment-tag">ShopeePay</span>
              <span className="payment-tag">Tunai</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
