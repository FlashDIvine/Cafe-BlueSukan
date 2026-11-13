# 📋 Angkringan Blue'sukan Kopi — Project Handover & Context Guide untuk AI Gemini

Dokumen ini disusun sebagai panduan menyeluruh untuk **AI Gemini** (dan pengembang) agar dapat langsung memahami arsitektur, kode, status pengerjaan, dan alur sistem dari repositori **Angkringan Blue'sukan Kopi** (Rawalo, Banyumas), serta mengetahui bagian mana yang perlu dilanjutkan.

---

## 1. Ringkasan & Identitas Projek

- **Nama Resmi Brand:** **Angkringan Blue'sukan Kopi** (Spot Bengong Tepi Serayu • Rawalo, Banyumas).
- **Tagline Resmi:** *"Nongkrong Asyik • Kopi Enak • Teman Asyik • Hati Bahagia"* (`@bluesukankopi`).
- **Konsep Inti:** Aplikasi web **Guest Self-Order** (*mobile-first*) untuk pelanggan angkringan tepi Sungai Serayu yang memesan langsung dari meja tanpa login/registrasi, terintegrasi dengan **POS Kasir (Cashier Dashboard)** untuk verifikasi pesanan, pembayaran (Cash/QRIS/Debit), dan **Manajemen Stok Menu (Inventory CRUD)** secara realtime.
- **Arsitektur Repositori:** Monorepo sederhana yang menggabungkan frontend React Vite dan backend Express.js dalam satu repo, siap untuk *local dev* maupun *production deployment* di Vercel.

---

## 2. Tech Stack & Dependencies

### Frontend (`/client`)
- **Framework & Runtime:** React 19 (`react`, `react-dom`), Vite 8.
- **Iconography:** `lucide-react`.
- **QR Code Generator:** `qrcode.react` (merender QR kode pesanan untuk di-scan kasir).
- **Styling & Tema:** Vanilla CSS murni dengan Design System berbasis CSS Variables (`client/src/styles/index.css`), tanpa Tailwind. Desain mengusung tema **Vintage Riverside Angkringan & Retro Poster** terinspirasi dari papan poster clipboard resmi Blue'sukan Kopi dan suasana senja Bendung Gerak Serayu:
  - Background Utama (`--bg-primary`): `#F4ECDC` (Aged Kraft Paper / Kertas Menu Vintage)
  - Background Card (`--bg-surface`): `#FBF7EF` dengan border `#D5C7B2`
  - Warna Utama Brand (`--brand-navy`): `#1B3B64` (Vintage Poster Navy Blue)
  - Warna Aksen Hangat (`--accent-amber`): `#C96A2B` (Lantern Amber / Genteng Terakota)
  - Teks Utama (`--text-primary`): `#1E1915` (Dark Roasted Espresso)
  - Teks Sekunder (`--text-secondary`): `#5A4D41` (Weathered Wood)
- **Tipografi:** Google Fonts `Fraunces` (Display/Poster), `Plus Jakarta Sans` (Body & UI), `JetBrains Mono` (Harga & Kode Order).

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
- [x] **Visual Overhaul: Vintage Riverside Angkringan & Retro Poster UI** (Selesai)
- [x] **Migrasi Katalog Menu Asli (55 Menu & 5 Kategori Asli Angkringan)** (Selesai)
- [x] **Post-Checkout Flow: Redirect ke Beranda + Floating Active Order Tracker & Modal QR** (Selesai)
- [x] **Seating Location: 3 Pilihan Area Murni (Indoor, Outdoor, Lt 2)** (Selesai)
- [x] **Realtime Server-Sent Events (SSE) & Fallback (`/api/orders/stream`)** (Selesai)
- [x] **Notifikasi Audio Bel Kasir (Web Audio API Synthesizer Ding-Dong)** (Selesai)
- [x] **Laporan Penjualan Harian Kasir (Daily Sales Summary Modal & `/api/orders/summary/daily`)** (Selesai)
- [x] **Optimasi Penggunaan RAM & Anti-Memory Leak (Node.js Heap & Browser Kasir)** (Selesai)
- [x] **Konfigurasi Production Deployment EthioDeploy / Node.js PaaS Container** (Selesai)

---

## 8. Optimasi Penggunaan Memori (RAM / Memory Footprint)

Untuk menjamin kestabilan aplikasi saat di-deploy pada VPS dengan kapasitas RAM terbatas (512MB – 1GB) maupun lingkungan serverless Vercel, serta mencegah *browser crash* di perangkat kasir yang menyala seharian, serangkaian optimasi berikut telah diimplementasikan:

### A. Backend & Node.js V8 Heap
1. **Script Eksekusi Rendah Memori (`start:lowmem`):**
   - Ditambahkan pada root `package.json` dan `server/package.json`:
     ```bash
     npm run start:lowmem
     # Menjalankan: node --max-old-space-size=192 --optimize-for-size server/src/index.js
     ```
   - Membatasi batas heap V8 maksimal 192MB dan mengaktifkan strategi Garbage Collection agresif untuk menghemat konsumsi RAM server.
2. **In-Memory Store Auto-Pruning (`server/src/db.js`):**
   - Fungsi `pruneOrders()` otomatis menghapus pesanan berstatus `completed` atau `cancelled` yang berumur lebih dari 24 jam.
   - Menetapkan batas maksimum (hard-cap) riwayat pesanan dalam memori sebanyak **200 pesanan terbaru**.
   - Dijalankan otomatis setiap ada `POST /api/orders` baru serta secara periodik tiap 1 jam via background timer dengan `.unref()` agar tidak menahan proses shutdown Node.js.
3. **Database Payload & Connection Pooling (`server/src/routes/menus.js` & `prisma.js`):**
   - Query `GET /api/menus` menggunakan Prisma `select` eksplisit hanya pada atribut yang dibutuhkan (`id`, `category_id`, `name`, `price`, `stock`, `image_url`, `description`, `is_available`, `is_popular`), menghindari alokasi memori untuk metadata timestamp yang tidak digunakan client.
   - `server/src/prisma.js` otomatis membatasi pool koneksi (`?connection_limit=5`) jika parameter belum ditentukan di `DATABASE_URL`, mencegah *connection exhaustion* pada PostgreSQL/Supabase.
4. **SSE Event Listener Cleanup & Endpoint Diagnostik RAM (`/api/health`):**
   - `server/src/routes/orders.js` membersihkan listener `orderEvents` secara menyeluruh melalui handler multi-event (`req.on('close')`, `req.on('error')`, `res.on('finish')`, `res.on('close')`) serta mereset heartbeat interval.
   - Endpoint `GET /api/health` mengembalikan telemetri memori real-time:
     ```json
     {
       "status": "ok",
       "service": "Angkringan Blue'sukan Kopi API",
       "uptimeSeconds": 142,
       "engine": "In-Memory Store",
       "memory": {
         "rssMB": 85.55,
         "heapUsedMB": 11.19,
         "heapTotalMB": 18.94,
         "externalMB": 2.57
       }
     }
     ```

### B. Frontend & Browser Kasir
1. **Singleton `AudioContext` & Audio Node Disconnect (`client/src/utils/bellSound.js`):**
   - Menggunakan satu instance global `AudioContext` (singleton) yang digunakan kembali setiap kali bel notifikasi berbunyi.
   - Transient nodes (`OscillatorNode`, `GainNode`) langsung di-disconnect via callback `onended` untuk melepaskan buffer audio driver hardware di browser.
2. **Pembatasan Render DOM Riwayat Kasir (`client/src/pages/CashierPage.jsx`):**
   - Pada tab riwayat selesai/batal, rendering DOM dibatasi maksimal **25 pesanan selesai terbaru hari ini** secara default.
   - Tombol toggle *"Tampilkan Semua ({N} Riwayat Selesai / Batal)"* tersedia jika kasir ingin melihat riwayat lengkap tanpa membebani browser sejak awal.
3. **Lazy Image Decoding & Asynchronous Decoding:**
   - Seluruh tag `<img>` pada katalog (55 menu), bento grid, kartu rekomendasi, keranjang, dan manajemen menu menggunakan `loading="lazy"` dan `decoding="async"`.
4. **Eliminasi Blind Polling & Pembersihan Interval Dangling:**
   - Interval polling menu 3 detik di `OrderContext.jsx` direlaksasi menjadi 30 detik (ditambah sinkronisasi instan saat tab dibuka via `visibilitychange`).
   - Seluruh `setTimeout` notifikasi toast dibersihkan via `useRef` saat unmount untuk mencegah *memory leak* di React.

---

## 9. Konfigurasi Deployment Production (EthioDeploy / Node.js Container / VPS)

Repositori ini telah dikonfigurasi penuh agar dapat di-deploy ke **EthioDeploy** (atau PaaS container Node.js serupa seperti Railway, Render, Fly.io) sebagai satu kesatuan (*monorepo single-service*):

### A. Lifecycle Scripts (`package.json`)
- **Instalasi Dependensi:**
  ```bash
  npm run install:all
  # Menginstal root dependencies, client node_modules, dan server node_modules
  ```
- **Build Tahap CI/CD:**
  ```bash
  npm run build
  # 1. Menjalankan 'prisma generate' (aman walau DATABASE_URL belum diisi)
  # 2. Mem-build bundle client Vite ke 'client/dist'
  ```
- **Menjalankan Server:**
  ```bash
  npm start
  # atau: npm run start:lowmem
  # Menjalankan: NODE_ENV=production node --max-old-space-size=192 --optimize-for-size server/src/index.js
  ```

### B. Arsitektur Serving Statis & Binding Jaringan (`server/src/index.js`)
1. **Binding Host:** Server Express melakukan binding ke `HOST = '0.0.0.0'` dan `PORT = process.env.PORT || 3001` sehingga dapat dijangkau oleh reverse proxy container EthioDeploy.
2. **Serving Bundel Frontend:** Di mode `production`, backend langsung melayani aset statis dari `client/dist`:
   - Header aset `/assets/*.js` dan `/assets/*.css` diberi cache jangka panjang (`max-age=31536000, immutable`).
   - File `index.html` diberi header `Cache-Control: no-cache, no-store, must-revalidate` agar browser pelanggan selalu memuat versi rilis teranyar.
3. **Single Page Application (SPA) Fallback:** Rute GET non-API (`app.get(/(.*)/, ...)`) otomatis mengembalikan `index.html`, menjaga navigasi client-side hash (`/#menu`, `/#cashier`) tetap mulus.
4. **Dual-Engine Fleksibel:** Jika `DATABASE_URL` belum diisi di dashboard EthioDeploy, server tetap berjalan normal dengan *In-Memory Store*. Jika `DATABASE_URL` diisi, server otomatis beralih ke PostgreSQL Prisma tanpa perlu rebuild.

---

## 10. Catatan Penting untuk AI Gemini Selanjutnya

1. **Selalu gunakan file ini (`GEMINI_PROJECT_SUMMARY.md`) sebagai rujukan utama** sebelum mengubah struktur data atau komponen.
2. **Styling menggunakan CSS murni (Vanilla CSS):** Jangan memasukkan kelas utility TailwindCSS tanpa instruksi khusus dari user.
3. **Branding resmi:** Selalu gunakan nama **"Angkringan Blue'sukan Kopi"** atau **"Blue'sukan Kopi"** (Rawalo, Banyumas).
4. **Keamanan State:** Jangan menghapus `activeOrder` dari memori jika pelanggan masih membutuhkan kode pesanan atau QR untuk ditunjukkan ke kasir fisik.
