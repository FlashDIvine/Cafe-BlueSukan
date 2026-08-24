# Implementation Tasks for AI Agent (Customer Module)

## Task 1: Setup & Data State
- [x] Buat struktur folder di `client/src/` (`components/`, `pages/`, `hooks/`, `context/`).
- [x] Buat `OrderContext` atau state management untuk menangani:
  - Data keranjang (`cartItems`, `addToCart`, `removeFromCart`, `updateQty`).
  - Info meja dari query string `window.location.search`.
  - Informasi pemesan (`customerName`, `tableNumber`, `notes`).

## Task 2: UI Menu & Katalog
- [x] Buat komponen `Navbar` dengan branding "Bantu Cafe" dan badge Meja.
- [x] Buat komponen `CategoryFilter` (pill horizontal scroll).
- [x] Buat komponen `MenuCard` dengan validasi stok (`stock > 0`) dan badge "Habis".
- [x] Buat komponen `FloatingCartBar` yang muncul ketika keranjang berisi item.

## Task 3: Modal Keranjang & Checkout Form
- [x] Buat komponen `CartDrawer` / Modal ringkasan pesanan.
- [x] Buat input `customer_name` dan `notes`.
- [x] Implementasi validasi form sebelum checkout.

## Task 4: API Integration & Tiket QR
- [x] Integrasikan request `POST /api/customer/orders`.
- [x] Render layar `OrderSuccess` / Tiket Pesanan menggunakan library `qrcode.react`.
- [x] Pasang interval polling `GET /api/customer/orders/:order_code/status` setiap 3-5 detik.
- [x] Tampilkan layar transisi "Pesanan Dikonfirmasi / Sedang Diproses" ketika status berubah menjadi `paid_processing`.

## Module 2: Setup Monorepo, Server Backend & Database
- [x] Inisialisasi root `package.json` dengan `concurrently` dan script `dev`/`build`.
- [x] Setup `server/` folder (Express, cors, dotenv, nodemon, ES Module).
- [x] Implementasi In-Memory Database (`menus`, `orders`, `order_items`).
- [x] `GET /api/menus` — Daftar menu aktif & stok realtime.
- [x] `POST /api/orders` — Buat pesanan baru dari pelanggan.
- [x] `GET /api/orders/:order_code/status` — Polling status pesanan.
- [x] `PATCH /api/orders/:id/approve` — Konfirmasi pembayaran & potong stok (anti-minus).
- [x] Update `client/src/services/api.js` agar memanggil endpoint Express.
- [x] Vite proxy `/api` → `localhost:3001`.
- [x] Uji end-to-end via `npm run dev` di root monorepo.

## Module 3: Antarmuka Kasir (POS Dashboard) & Manajemen Edit Pesanan
- [x] `GET /api/orders` — Daftar pesanan dengan filter status & sorting terbaru.
- [x] `GET /api/orders/:id` & `GET /api/orders/code/:order_code` — Detail satu pesanan.
- [x] `PUT /api/orders/:id/items` — Edit item pesanan oleh kasir (tambah/kurang kuantitas, hapus menu, tambah menu baru) dengan kalkulasi ulang & validasi stok.
- [x] `PATCH /api/orders/:id/cancel` — Pembatalan pesanan.
- [x] `PATCH /api/orders/:id/approve` — Konfirmasi pembayaran dengan metode (Cash/QRIS/Debit) & pemotongan stok atomik.
- [x] UI Mode Switcher di header `[👥 Pelanggan | 💼 Kasir POS]` & URL hash `#/cashier`.
- [x] Komponen `CashierPage.jsx` dengan metrik antrean realtime, tab status, dan pencarian cepat.
- [x] Komponen `CashierOrderModal.jsx` & `CashierAddMenuModal.jsx` untuk verifikasi, edit menu, dan konfirmasi pembayaran.
- [x] Verifikasi build client (`npm run build --prefix client`) dan pengujian browser end-to-end.

## Module 4: Manajemen Menu & Stok (Admin/Kasir Menu CRUD)
- [x] `POST /api/menus` — Menambahkan menu baru ke database backend.
- [x] `PUT /api/menus/:id` — Mengupdate informasi menu (nama, kategori, harga, stok, gambar, deskripsi).
- [x] `PATCH /api/menus/:id/stock` — Quick Stock Update (tambah/kurang stok secara cepat, auto-nonaktif jika stok = 0).
- [x] `PATCH /api/menus/:id/toggle` — Mengaktifkan/menonaktifkan ketersediaan menu secara manual.
- [x] `DELETE /api/menus/:id` — Menghapus menu dari sistem.
- [x] Sub-navigasi tab di Kasir POS: `[📋 Antrean Pesanan]` & `[☕ Kelola Menu & Stok]`.
- [x] Komponen `MenuManagement.jsx` dengan tabel/grid inventori stok, metrik statistik, dan filter pencarian.
- [x] Quick Stock Counter stepper `[- / +]` inline untuk ubah stok harian secara instan.
- [x] Komponen `MenuFormModal.jsx` untuk tambah menu baru dan edit detail menu (dengan preset foto kafe).
- [x] Dialog konfirmasi sebelum menghapus menu.
- [x] Sinkronisasi realtime ke katalog pelanggan via polling interval.
- [x] Verifikasi build client (`npm run build --prefix client`) dan pengujian browser end-to-end.

## Module 5: Integrasi Database Permanen (Prisma ORM & Persistent Storage)
- [x] Setup Prisma ORM di backend (`@prisma/client`, `prisma`, SQLite datasource).
- [x] Buat schema Prisma di `server/prisma/schema.prisma` (`Menu`, `Order`, `OrderItem`).
- [x] Sinkronisasi schema ke database SQLite (`dev.db`) via `prisma db push`.
- [x] Skrip auto-seeding `server/prisma/seed.js` untuk 12 menu awal kafe.
- [x] Instance tunggal PrismaClient di `server/src/prisma.js`.
- [x] Refactor `server/src/routes/menus.js` ke Prisma ORM.
- [x] Refactor `server/src/routes/orders.js` ke Prisma ORM dengan transaksi atomik (`prisma.$transaction`).
- [x] Hapus ketergantungan pada in-memory storage lama (`db.js`).
- [x] Verifikasi persistensi data saat restart server dan pengujian browser end-to-end.