# 📋 BlueSukan Cafe — Project Handover & Context Guide untuk AI Gemini

Dokumen ini disusun sebagai panduan menyeluruh untuk **AI Gemini** (dan pengembang) agar dapat langsung memahami arsitektur, kode, status pengerjaan, dan alur sistem dari repositori **BlueSukan Cafe**, serta mengetahui bagian mana yang perlu dilanjutkan.

---

## 1. Ringkasan & Identitas Projek

- **Nama Resmi Brand:** **BlueSukan Cafe** (atau *BlueSukan Specialty Coffee & Roastery*).
- **Konsep Inti:** Aplikasi web **Guest Self-Order** (*mobile-first*) untuk pelanggan kafe yang memesan langsung dari meja tanpa login/registrasi, terintegrasi dengan **POS Kasir (Cashier Dashboard)** untuk verifikasi pesanan, pembayaran (Cash/QRIS/Debit), dan **Manajemen Stok Menu (Inventory CRUD)** secara realtime.
- **Arsitektur Repositori:** Monorepo sederhana yang menggabungkan frontend React Vite dan backend Express.js dalam satu repo, siap untuk *local dev* maupun *production deployment* di Vercel.

---

## 2. Tech Stack & Dependencies

### Frontend (`/client`)
- **Framework & Runtime:** React 19 (`react`, `react-dom`), Vite 8.
- **Iconography:** `lucide-react`.
- **QR Code Generator:** `qrcode.react` (merender QR kode pesanan untuk di-scan kasir).
- **Styling:** Vanilla CSS murni dengan Design System berbasis CSS Variables (`client/src/styles/index.css`), tanpa Tailwind. Desain mengusung tema **High-End Modern Boutique & Editorial Cafe** dengan palet warna Deep Cobalt (`#1E40AF`), Midnight Navy (`#0A0F1D`), dan Glassmorphism.

### Backend (`/server`)
- **Runtime:** Node.js (ES Module: `"type": "module"`).
- **Framework:** Express.js 4.21, `cors`, `compression`, `dotenv`.
- **Database & ORM:** Prisma ORM 6 (`@prisma/client`, `prisma`), PostgreSQL (Supabase/Neon).
- **Fallback In-Memory:** Jika `DATABASE_URL` tidak didefinisikan di environment, server otomatis berjalan menggunakan fallback *in-memory storage* (`server/src/db.js`), sehingga tetap bisa diuji tanpa database eksternal.

### Deployment & Build (`/api`, `vercel.json`)
- **Vercel Serverless Function:** Entry point `api/index.js` mengekspor Express app.
- **Routing Vercel:** `vercel.json` me-rewrite `/api/*` ke `/api/index.js` dan rute lainnya ke `client/dist/index.html`.
- **Root Script:**
  - `npm run dev`: Menjalankan client & server sekaligus via `concurrently`.
  - `npm run build`: Menjalankan `prisma generate` dan build client Vite.

---

## 3. Struktur Direktori Utama

```
Bluesukan/
├── PRD.md                         # Product Requirement Document awal
├── TASK.md                        # Checklist implementasi modul 1 s/d 5
├── package.json                   # Root package.json (concurrently & scripts)
├── vercel.json                    # Konfigurasi Vercel deployment
├── api/
│   └── index.js                   # Serverless bridge untuk Vercel
├── client/
│   ├── package.json               # Dependensi frontend React + Vite
│   ├── vite.config.js             # Vite proxy (/api -> localhost:3001)
│   └── src/
│       ├── App.jsx                # Router utama (mode: 'home' | 'menu' | 'cashier')
│       ├── main.jsx               # React DOM render
│       ├── context/
│       │   └── OrderContext.jsx   # State management (keranjang, nomor meja, polling menu)
│       ├── pages/
│       │   ├── HomePage.jsx       # Landing page editorial boutique & bento grid
│       │   ├── MenuPage.jsx       # Katalog pemesanan mandiri pelanggan
│       │   └── CashierPage.jsx    # Dashboard POS Kasir & tab kelola menu
│       ├── components/
│       │   ├── Navbar.jsx         # Header dengan badge nomor meja
│       │   ├── CategoryFilter.jsx # Pill filter kategori menu
│       │   ├── MenuCard.jsx       # Kartu menu katalog dengan tombol tambah
│       │   ├── RecommendedCard.jsx# Slider menu rekomendasi
│       │   ├── FloatingCartBar.jsx# Floating bar keranjang belanja
│       │   ├── CartDrawer.jsx     # Drawer checkout pemesanan mandiri
│       │   ├── OrderTicket.jsx    # Tiket pesanan digital dengan QR & status realtime
│       │   ├── TableModal.jsx     # Modal ubah nomor meja
│       │   ├── Toast.jsx          # Notifikasi feedback aksi
│       │   ├── CashierOrderModal.jsx # Modal detail & aksi pembayaran pesanan kasir
│       │   ├── CashierAddMenuModal.jsx # Modal tambah menu pesanan dari kasir
│       │   ├── MenuManagement.jsx # Tampilan manajemen stok & inventori
│       │   └── MenuFormModal.jsx  # Modal form tambah/edit menu kafe
│       ├── services/
│       │   └── api.js             # Kumpulan fungsi fetch API backend
│       ├── styles/                # Seluruh berkas CSS modular
│       └── utils/                 # Format rupiah, URL query parser, image optimizer
└── server/
    ├── prisma/
    │   ├── schema.prisma          # Skema model Menu, Order, OrderItem, Category
    │   └── seed.js                # Skrip auto-seed 12 menu kafe
    └── src/
        ├── index.js               # Entry point Express server (Port 3001)
        ├── prisma.js              # Instance PrismaClient
        ├── db.js                  # In-memory storage fallback & seed data
        └── routes/
            ├── menus.js           # CRUD & Quick Stock Update menu
            ├── orders.js          # Buat pesanan, polling status, verifikasi bayar
            └── categories.js      # CRUD kategori menu
```

---

## 4. Alur Navigasi & Mode Aplikasi (`client/src/App.jsx`)

Navigasi antar mode menggunakan URL Hash (`window.location.hash`) dan URL Search Parameter:

| Mode | Trigger URL | Komponen yang Dirender | Deskripsi |
|---|---|---|---|
| **`home`** | `/`, `/#home`, tanpa hash | `<HomePage />` | Landing page editorial boutique berkelas tinggi, bento grid signature picks, filosofi kafe, jam buka, dan CTA Pesan Mandiri / Kasir POS. |
| **`menu`** | `/#menu` atau URL ada `?table=XX` | `<MenuPage />` & `<CartDrawer />` (atau `<OrderTicket />` jika ada `activeOrder`) | Ruang pemesanan mandiri pelanggan meja kafe. Menampilkan katalog, pencarian, filter kategori, keranjang, dan checkout. |
| **`cashier`**| `/#cashier` | `<CashierPage />` (lazy loaded) | Dashboard POS Kasir untuk menerima pesanan meja, mengubah menu pesanan, menerima pembayaran (Cash/QRIS/Debit), dan mengelola inventori stok menu. |

---

## 5. Alur Pemesanan Saat Ini (Current Customer Journey)

1. **Memulai Pesanan:**
   Pelanggan membuka web via scan QR meja (contoh: `?table=04`). Nomor meja tersimpan di `OrderContext`. Jika pelanggan dari `HomePage`, klik tombol **"Pesan Mandiri"** akan mengarahkan ke `/#menu`.
2. **Memilih Menu:**
   Pelanggan memilih item dari katalog menu. Item masuk ke keranjang (`cartItems` di `OrderContext`). Jika stok menu habis (`stock = 0`), tombol pesanan otomatis nonaktif.
3. **Membuka Keranjang & Checkout (`CartDrawer.jsx`):**
   Pelanggan menekan `FloatingCartBar`, memeriksa kuantitas pesanan, mengisi **Nama Pemesan**, memverifikasi **Nomor Meja**, dan memasukkan **Catatan Tambahan** (opsional).
4. **Submit Pesanan:**
   Pelanggan menekan **"Pesan Sekarang"**. Fungsi `handleProceedToCheckout` di `App.jsx` memanggil `POST /api/orders`.
5. **Tampilan Pasca-Checkout (Kondisi Saat Ini):**
   - Keranjang dikosongkan (`clearCart()`).
   - Data pesanan baru disimpan ke state `activeOrder`.
   - Karena `activeOrder` terisi, `App.jsx` merender komponen `<OrderTicket order={activeOrder} onBackToMenu={...} onGoHome={...} />`.
   - Pada layar `OrderTicket`:
     - Tampil banner sukses pemesanan.
     - Tampil **Kode Pesanan** (misal `#BC-101`) dan **QR Code** untuk ditunjukkan/di-scan kasir.
     - Terjadi interval polling setiap 3 detik ke `GET /api/orders/:order_code/status`.
     - Saat kasir menyetujui transaksi (`paid_processing` atau `completed`), status berubah secara realtime.
     - Terdapat tombol **"Kembali ke Halaman Utama"** (`onGoHome`) dan tombol **"Pesan Menu Tambahan"** (`onBackToMenu`).
     - Jika status pesanan selesai (`completed`), ada countdown 5 detik yang otomatis mengarahkan ke beranda.

---

## 6. Alur Pasca-Checkout Terbaru (Status Saat Ini)

Fitur pengalihan pasca-checkout ke Beranda telah selesai diimplementasikan:
1. **Direct Redirect ke Beranda & Auto-Open Tiket:** Begitu pelanggan menekan tombol *"Pesan Sekarang"* di `CartDrawer`, pesanan dikirim ke API `POST /api/orders`, keranjang dikosongkan, pelanggan **langsung dialihkan ke Halaman Beranda (`HomePage`)**, dan **modal Tiket Pesanan Digital (QR Code) otomatis langsung terbuka** di layar beranda.
2. **Floating Active Order Tracker:** Saat modal tiket ditutup, di bagian bawah Beranda tetap muncul bar melayang (*glassmorphism* Midnight Navy & Cobalt) dengan:
   - Status live realtime (*"Menunggu Pembayaran Kasir"* / *"Sedang Diracik Barista"* / *"Pesanan Selesai"*).
   - Kode Pesanan (misal `#BC-101`), nomor meja, dan total harga.
   - Polling status realtime setiap 3 detik.
   - Tombol **"Tiket QR"** yang membuka kembali modal dialog tiket QR digital lengkap tanpa meninggalkan beranda.
3. **Persistensi `localStorage`:** Data `activeOrder` disimpan di `localStorage` sehingga tidak hilang saat halaman di-refresh.
4. **Chip Akses di Navbar & Hero:** Baik di `HomePage` maupun `MenuPage`, terdapat tombol cepat untuk membuka tiket QR kapan saja kasir meminta verifikasi.
5. **Sistem Lokasi Duduk (Model A - 3 Area Pilihan):** Menggantikan input nomor meja manual dengan 3 selektor area murni: `[ ☕ Indoor ]`, `[ 🌿 Outdoor ]`, `[ 🏢 Lt 2 ]`. Nilai disimpan di kolom database `table_number` bertipe String tanpa memerlukan migrasi skema, dan tampil secara konsisten di CartDrawer, TableModal, Navbar, Tiket Pesanan, dan Dashboard Kasir POS.

---

## 7. Status Pengerjaan Modul (Berdasarkan `TASK.md`)

- [x] **Modul 1: Setup & Data State Customer** (Selesai)
- [x] **Modul 2: Backend Monorepo, Express REST API & In-Memory Store** (Selesai)
- [x] **Modul 3: Antarmuka Kasir POS Dashboard & Edit Menu Pesanan** (Selesai)
- [x] **Modul 4: Manajemen Menu & Stok Kafe (CRUD & Quick Stock Stepper)** (Selesai)
- [x] **Modul 5: Integrasi Database Permanen (Prisma ORM & PostgreSQL)** (Selesai)
- [x] **Visual Overhaul: Modern Boutique & Bento Grid UI** (Selesai)
- [x] **Post-Checkout Flow: Redirect ke Beranda + Floating Active Order Tracker & Modal QR** (Selesai)
- [x] **Seating Location: 3 Pilihan Area Murni (Indoor, Outdoor, Lt 2)** (Selesai)

### Backlog & Peningkatan Selanjutnya (Siap Dilanjutkan):
1. **WebSockets / Server-Sent Events (SSE):** Menggantikan interval polling 3 detik dengan koneksi realtime dua arah antara kasir dan pelanggan.
2. **Fitur Riwayat Pesanan Pelanggan (Local Storage):** Menyimpan daftar riwayat pesanan sebelumnya di perangkat pelanggan agar dapat dilihat kembali kapan saja.
3. **Fitur Notifikasi Audio / Ring Bell di Kasir:** Suara bel notifikasi saat pesanan baru dari meja masuk ke dashboard kasir POS.
4. **Laporan Penjualan Harian Kasir (Sales Summary):** Ringkasan omzet harian, menu terlaris, dan rincian metode pembayaran (Cash/QRIS/Debit) di akhir shift kasir.
5. **Kustomisasi Varian Menu (Options/Add-ons):** Pilihan level gula (Normal, Less Sugar), varian susu (Oat Milk, Fresh Milk), dan extra espresso shot.

---

## 8. Catatan Penting untuk AI Gemini Selanjutnya

1. **Selalu gunakan file ini (`GEMINI_PROJECT_SUMMARY.md`) sebagai rujukan utama** sebelum mengubah struktur data atau komponen.
2. **Styling menggunakan CSS murni (Vanilla CSS):** Jangan memasukkan kelas utility TailwindCSS tanpa instruksi khusus dari user.
3. **Branding resmi:** Selalu gunakan nama **"BlueSukan Cafe"** atau **"BlueSukan"** (bukan nama lama).
4. **Keamanan State:** Jangan menghapus `activeOrder` dari memori jika pelanggan masih membutuhkan kode pesanan atau QR untuk ditunjukkan ke kasir fisik.
