import React from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  MapPin,
  MessageCircle,
  Globe,
  Plus,
} from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { formatRupiah } from '../utils/formatters';
import '../styles/home-page.css';

const BENTO_HERO = {
  id: 1,
  name: 'Kopi Susu Gula Aren Artisan',
  tagline: 'Signature House Blend',
  category: 'Kopi & Espresso',
  notes: 'Dark Cocoa • Organic Palm Sugar • Velvet Body',
  price: 22000,
  image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80',
  description: 'Espresso double shot dari biji arabika Gayo & Flores, dipadukan susu murni dan gula aren organik cair asli.',
};

const BENTO_SECONDARY = [
  {
    id: 5,
    name: 'Matcha Latte Uji',
    tagline: 'Artisan Non-Coffee',
    category: 'Non-Coffee',
    notes: 'Kyoto First Harvest • Creamy Milk',
    price: 26000,
    image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 3,
    name: 'Caramel Macchiato',
    tagline: 'Espresso Specialty',
    category: 'Kopi & Espresso',
    notes: 'Madagascar Vanilla • Butter Caramel',
    price: 28000,
    image_url: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 8,
    name: 'Crispy Truffle Fries',
    tagline: 'Gourmet Bites',
    category: 'Makanan Ringan',
    notes: 'White Truffle Oil • Aged Parmesan',
    price: 24000,
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
    <div className="boutique-page">
      {/* ─── 1. Minimalist Floating Glass Navbar ───────────────────────── */}
      <header className="boutique-nav-wrapper">
        <nav className="boutique-navbar">
          <div className="boutique-brand" onClick={() => scrollToSection('hero')}>
            <span className="brand-wordmark">BANTU</span>
            <span className="brand-dot">•</span>
            <span className="brand-sub">COFFEE</span>
          </div>

          <div className="boutique-nav-links">
            <button type="button" className="boutique-link" onClick={() => scrollToSection('menu-bento')}>
              Menu Signature
            </button>
            <button type="button" className="boutique-link" onClick={() => scrollToSection('story')}>
              Filosofi
            </button>
            <button type="button" className="boutique-link" onClick={() => scrollToSection('location')}>
              Lokasi &amp; Jam
            </button>
          </div>

          <div className="boutique-nav-action">
            <button
              type="button"
              className="btn-boutique-order"
              onClick={onGoToMenu}
              id="nav-cta-order"
            >
              <span>Pesan Mandiri</span>
              <ArrowUpRight size={15} />
            </button>
          </div>
        </nav>
      </header>

      {/* ─── 2. Immersive Editorial Hero Canvas ────────────────────────── */}
      <section id="hero" className="boutique-hero">
        <div className="hero-editorial-canvas">
          <div className="hero-backdrop-image-wrap">
            <img
              src={getOptimizedImageUrl(
                'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1400&q=85',
                1200
              )}
              alt="Bantu Cafe Interior & Atmosphere"
              className="hero-backdrop-img"
              loading="eager"
              decoding="async"
            />
            <div className="hero-backdrop-scrim"></div>
          </div>

          <div className="hero-editorial-content">
            <div className="hero-meta-overline">
              <span>KEMANG, JAKARTA</span>
              <span className="meta-sep">•</span>
              <span>SPECIALTY ROASTERS &amp; COFFEE BAR</span>
            </div>

            <h1 className="hero-editorial-heading">
              Sensasi Kopi Artisan <br className="hero-break" />
              <em className="hero-serif-accent">dalam Setiap Seduhan.</em>
            </h1>

            <p className="hero-editorial-sub">
              Ruang eksplorasi rasa, ketenangan, dan racikan biji kopi Nusantara pilihan.
              Pesan langsung dari kenyamanan meja Anda secara mandiri tanpa hambatan antrean.
            </p>

            <div className="hero-actions-row">
              <button
                type="button"
                className="btn-editorial-primary"
                onClick={onGoToMenu}
                id="hero-main-cta"
              >
                <span>Jelajahi Menu &amp; Pesan</span>
                <ArrowRight size={17} />
              </button>

              <button
                type="button"
                className="btn-editorial-ghost"
                onClick={() => scrollToSection('story')}
              >
                <span>Cerita Kami</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
          <div className="hero-bottom-transition"></div>
        </div>
      </section>

      {/* ─── 3. Signature Menu (Bento Grid Architecture) ───────────────── */}
      <section id="menu-bento" className="boutique-section bento-section">
        <div className="boutique-container">
          <div className="section-header-editorial">
            <span className="section-label-overline">CURATED SELECTION</span>
            <h2 className="section-editorial-title">Signature House Picks</h2>
            <p className="section-editorial-lead">
              Racikan kopi artisan dan hidangan kurasi barista dengan standar kualitas tanpa kompromi.
            </p>
          </div>

          <div className="bento-grid">
            {/* Bento Large Hero Card */}
            <div className="bento-card bento-hero-card" onClick={onGoToMenu}>
              <div className="bento-hero-image-wrap">
                <img
                  src={getOptimizedImageUrl(BENTO_HERO.image_url, 800)}
                  alt={BENTO_HERO.name}
                  className="bento-hero-img"
                  loading="lazy"
                  decoding="async"
                />
                <div className="bento-card-scrim"></div>
                <div className="bento-badge-tag">{BENTO_HERO.tagline}</div>
              </div>

              <div className="bento-hero-body">
                <div className="bento-category-tag">{BENTO_HERO.category}</div>
                <h3 className="bento-hero-title">{BENTO_HERO.name}</h3>
                <p className="bento-hero-notes">{BENTO_HERO.notes}</p>
                <p className="bento-hero-desc">{BENTO_HERO.description}</p>

                <div className="bento-card-footer">
                  <span className="bento-price-tag">{formatRupiah(BENTO_HERO.price)}</span>
                  <button
                    type="button"
                    className="bento-quick-add"
                    aria-label={`Pesan ${BENTO_HERO.name}`}
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
              {BENTO_SECONDARY.map((item) => (
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
              <span>Buka Menu Selengkapnya (12 Pilihan)</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── 4. Atmosphere & Story Section (Kinfolk Style) ─────────────── */}
      <section id="story" className="boutique-section story-section">
        <div className="boutique-container">
          <div className="story-split-grid">
            <div className="story-image-column">
              <div className="story-image-frame">
                <img
                  src={getOptimizedImageUrl(
                    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=80',
                    800
                  )}
                  alt="Barista brewing coffee at Bantu Cafe"
                  className="story-main-img"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="story-quote-card">
                <p className="story-quote-text">
                  “Setiap cangkir adalah jembatan antara dedikasi petani lokal dan ketenangan momen Anda.”
                </p>
                <span className="story-quote-author">— Bantu Cafe Artisan Roastery</span>
              </div>
            </div>

            <div className="story-text-column">
              <span className="section-label-overline">OUR PHILOSOPHY</span>
              <h2 className="story-heading">
                Dedikasi pada Kualitas, <br />
                <em className="story-serif-accent">Kenyamanan &amp; Kesederhanaan.</em>
              </h2>

              <p className="story-paragraph">
                Bantu Cafe didirikan dengan satu komitmen sederhana: menyajikan kopi berkualitas specialty tanpa pretensi, di dalam ruang yang memberikan ketenangan bagi pikiran dan inspirasi bagi setiap karya Anda.
              </p>

              <div className="story-pillars">
                <div className="story-pillar-item">
                  <span className="pillar-num">01</span>
                  <div className="pillar-content">
                    <h4 className="pillar-title">Kurasi Biji Kopi Nusantara</h4>
                    <p className="pillar-desc">
                      Biji kopi specialty grade dari Gayo, Toraja, dan Flores yang dipanggang dengan profil rasa presisi.
                    </p>
                  </div>
                </div>

                <div className="story-pillar-item">
                  <span className="pillar-num">02</span>
                  <div className="pillar-content">
                    <h4 className="pillar-title">Pengalaman Meja Nir-Antre</h4>
                    <p className="pillar-desc">
                      Pemesanan mandiri langsung dari meja melalui ponsel cerdas Anda, sehingga percakapan tidak terputus.
                    </p>
                  </div>
                </div>

                <div className="story-pillar-item">
                  <span className="pillar-num">03</span>
                  <div className="pillar-content">
                    <h4 className="pillar-title">Ruang Hangat &amp; Inspiratif</h4>
                    <p className="pillar-desc">
                      Suasana tenang, pencahayaan alami, dan fasilitas stopkontak di setiap sudut meja.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. Location, Hours & Contact ──────────────────────────────── */}
      <section id="location" className="boutique-section location-section">
        <div className="boutique-container">
          <div className="section-header-editorial">
            <span className="section-label-overline">VISIT THE BAR</span>
            <h2 className="section-editorial-title">Lokasi &amp; Jam Operasional</h2>
            <p className="section-editorial-lead">
              Temukan kami di kawasan Kemang yang tenang dan asri.
            </p>
          </div>

          <div className="location-editorial-grid">
            <div className="location-editorial-card">
              <div className="loc-card-header">
                <MapPin size={20} className="loc-card-icon" />
                <span className="loc-card-label">ALAMAT</span>
              </div>
              <h3 className="loc-card-value">Bantu Cafe Kemang</h3>
              <p className="loc-card-address">
                Jl. Kemang Raya No. 42, RT.02/RW.02, Bangka, Mampang Prapatan, Jakarta Selatan 12730
              </p>
              <div className="loc-landmark-pill">
                <span>📍 Seberang Plaza Kemang 88</span>
              </div>
            </div>

            <div className="location-editorial-card">
              <div className="loc-card-header">
                <Clock size={20} className="loc-card-icon" />
                <span className="loc-card-label">JAM BUKA</span>
              </div>
              <div className="loc-hours-table">
                <div className="loc-hours-row">
                  <span>Senin – Jumat</span>
                  <strong>08.00 – 23.00 WIB</strong>
                </div>
                <div className="loc-hours-row">
                  <span>Sabtu – Minggu</span>
                  <strong>07.30 – 23.30 WIB</strong>
                </div>
              </div>
              <div className="loc-open-indicator">
                <span className="indicator-dot"></span>
                <span>Buka Hari Ini &amp; Siap Melayani</span>
              </div>
            </div>

            <div className="location-editorial-card">
              <div className="loc-card-header">
                <MessageCircle size={20} className="loc-card-icon" />
                <span className="loc-card-label">KONTAK &amp; MEDIA</span>
              </div>
              <p className="loc-contact-desc">
                Punya pertanyaan mengenai reservasi atau katering kopi untuk acara?
              </p>
              <div className="loc-social-links">
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="loc-social-btn"
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp: +62 812-3456-7890</span>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="loc-social-btn"
                >
                  <Globe size={15} />
                  <span>Instagram: @bantucafe.id</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. Deep Ink Navy Footer ───────────────────────────────────── */}
      <footer className="boutique-footer">
        <div className="boutique-container">
          <div className="footer-main-grid">
            <div className="footer-brand-block">
              <div className="footer-brand-title">
                <span>BANTU</span>
                <span className="brand-dot">•</span>
                <span>CAFE</span>
              </div>
              <p className="footer-brand-desc">
                Specialty Coffee Roasters &amp; Guest Self-Order System.
                Diracik dengan presisi, disajikan dengan kehangatan.
              </p>
            </div>

            <div className="footer-nav-block">
              <span className="footer-nav-heading">NAVIGASI</span>
              <ul className="footer-nav-list">
                <li><button type="button" onClick={() => scrollToSection('hero')}>Beranda</button></li>
                <li><button type="button" onClick={onGoToMenu}>Katalog Menu</button></li>
                <li><button type="button" onClick={() => scrollToSection('story')}>Filosofi</button></li>
                <li><button type="button" onClick={() => scrollToSection('location')}>Lokasi</button></li>
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
              © {new Date().getFullYear()} Bantu Cafe (BlueSukan). All rights reserved.
            </span>
            <div className="footer-payment-chips">
              <span>QRIS</span>
              <span>GOPAY</span>
              <span>OVO</span>
              <span>SHOPEEPAY</span>
              <span>CASH</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
