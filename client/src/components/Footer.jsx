import React, { memo } from 'react';
import '../styles/footer.css';

export const Footer = memo(({ onGoToMenu, onGoToCashier, onScrollToSection }) => {
  return (
    <footer className="antislop-footer">
      {/* Wavy Ribbon on Top Edge */}
      <div className="footer-wavy-top" aria-hidden="true">
        <svg viewBox="0 0 400 18" preserveAspectRatio="none" className="wavy-svg">
          <path d="M0 18V8c25-14 50 10 75 0s50-12 75 0 50 10 75 0 50-12 75 0 50 10 75 0V18z" fill="currentColor" />
        </svg>
      </div>

      <div className="footer-body">
        <div className="footer-brand-title">
          Blue’sukan Kopi
        </div>
        <p className="footer-brand-desc">
          Warung kayu di sisi Bendung Gerak Serayu, Rawalo, Banyumas.
        </p>

        <nav className="footer-nav" aria-label="Navigasi Footer">
          <div className="footer-nav-col">
            <span className="footer-nav-heading">Navigasi</span>
            <ul className="footer-nav-list">
              {onScrollToSection && (
                <li>
                  <button type="button" onClick={() => onScrollToSection('hero')}>
                    Beranda
                  </button>
                </li>
              )}
              {onGoToMenu && (
                <li>
                  <button type="button" onClick={onGoToMenu}>
                    Menu
                  </button>
                </li>
              )}
              {onScrollToSection && (
                <li>
                  <button type="button" onClick={() => onScrollToSection('program-guru')}>
                    Guru Honorer
                  </button>
                </li>
              )}
              {onScrollToSection && (
                <li>
                  <button type="button" onClick={() => onScrollToSection('location')}>
                    Jam Buka &amp; Alamat
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div className="footer-nav-col">
            <span className="footer-nav-heading">Layanan</span>
            <ul className="footer-nav-list">
              {onGoToMenu && (
                <li>
                  <button type="button" onClick={onGoToMenu}>
                    Pesan Mandiri
                  </button>
                </li>
              )}
            </ul>
          </div>
        </nav>

        <div className="footer-bottom-line">
          <span>© {new Date().getFullYear()} Blue’sukan Kopi. Rawalo, Banyumas.</span>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
