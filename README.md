# ☕ BlueSukan Cafe — Guest Self-Order & POS System

[![Live Demo](https://img.shields.io/badge/Live_Demo-bluesukan.vercel.app-1E40AF?style=for-the-badge&logo=vercel&logoColor=white)](https://bluesukan.vercel.app/)
[![React](https://img.shields.io/badge/React-19.2-2563EB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)

> **Aplikasi Web Self-Order & Sistem POS Kasir Berbasis Mobile-First untuk Kafe Modern.**  
> Pelanggan dapat memesan hidangan mandiri langsung dari meja tanpa perlu antre atau login, sementara kasir dan barista mengelola pesanan serta stok menu secara realtime.

🔗 **Akses Langsung (Live Production):** [https://bluesukan.vercel.app/](https://bluesukan.vercel.app/)

---

## 📖 Tentang BlueSukan Cafe

**BlueSukan Cafe** (*Specialty Coffee Roasters & Cafe Bar*) menggabungkan estetika desain *Modern Boutique & Editorial* dengan sistem operasional pemesanan mandiri nir-antre (*contactless self-order*). 

Dirancang untuk memberikan pengalaman pemesanan yang cepat, elegan, dan tanpa hambatan bagi pelanggan, sekaligus memberikan kontrol inventori dan verifikasi transaksi yang akurat bagi tim kasir fisik.

---

## 🌟 Fitur Utama

### 1. Halaman Beranda Editorial Boutique
- **Hero Canvas Imersif:** Desain modern bernuansa *Deep Cobalt Blue* (`#1E40AF`) & *Midnight Navy* (`#0A0F1D`) dengan tipografi serif elegan.
- **Bento Grid Signature Picks:** Menampilkan menu andalan kafe (*Artisan House Blend, Matcha Uji, Truffle Fries*).
- **Filosofi & Suasana Kafe:** Cerita kurasi biji kopi Nusantara dan suasana ruang.
- **Informasi Jam Buka & Lokasi:** Detail operasional dan tautan kontak WhatsApp / Instagram.

### 2. Pemesanan Mandiri Pelanggan (Guest Self-Order)
- **Tanpa Login (Guest Mode):** Pelanggan langsung memesan via scan QR atau tombol *Pesan Mandiri*.
- **Pilihan 3 Area Duduk:**
  - ☕ **Indoor** *(Teras Beratap)*
  - 🌿 **Outdoor** *(Area Terbuka)*
  - 🏢 **Lt 2** *(Lantai Atas)*
- **Katalog & Filter Interaktif:** Filter kategori menu horizontal (*Kopi & Espresso, Non-Coffee, Makanan Ringan, Makanan Utama*), pencarian realtime, dan rekomendasi menu populer.
- **Stok Realtime & Anti-Minus:** Menu yang habis otomatis bertanda *"Habis"* dengan tombol nonaktif.
- **Keranjang Belanja Cerdas (Cart Drawer):** Stepper kuantitas dibatasi oleh sisa stok fisik, input nama pemesan, dan catatan khusus pesanan.

### 3. Alur Pasca-Checkout & Tiket Pesanan Digital
- **Direct Redirect ke Beranda:** Setelah checkout, pelanggan langsung diarahkan kembali ke Beranda utama.
- **Auto-Open Tiket Digital:** Modal tiket digital otomatis langsung terbuka di layar beranda dengan **QR Code Interaktif** dan **Kode Pesanan Unik** (misal `#BC-101`) untuk di-scan kasir.
- **Floating Active Order Tracker:** Bar melayang elegan di bagian bawah beranda dengan indikator denyut status live:
  - 🟡 *Menunggu Pembayaran Kasir*
  - 🔵 *Sedang Diracik Barista*
  - 🟢 *Pesanan Selesai / Siap*
- **Persistensi `localStorage`:** Data pesanan aktif tetap tersimpan di perangkat pelanggan meskipun halaman di-refresh.

### 4. Dashboard POS Kasir & Manajemen Menu (`/#cashier`)
- **Antrean Pesanan Realtime:** Filter status (*Menunggu Pembayaran, Sedang Diproses, Selesai, Dibatalkan*), pencarian kode/nama/area, dan kalkulasi total antrean.
- **Verifikasi & Approval Pembayaran:** Konfirmasi pembayaran multi-metode (*Cash, QRIS, Debit*) dengan pemotongan stok otomatis.
- **Edit Pesanan oleh Kasir:** Kasir dapat menambah menu, mengubah porsi, atau menghapus item sesuai permintaan pelanggan di meja kasir.
- **Manajemen Stok & Menu (CRUD):** Tambah menu baru, edit harga/deskripsi/foto preset, quick stock update stepper `[- / +]`, dan toggle ketersediaan menu.

---

## 🛠️ Tech Stack & Arsitektur

```
Bluesukan/
├── client/              # Frontend (React 19, Vite, Vanilla CSS Design System)
│   ├── src/
│   │   ├── pages/       # HomePage, MenuPage, CashierPage
│   │   ├── components/  # ActiveOrderTracker, ActiveOrderModal, CartDrawer, dll.
│   │   ├── context/     # OrderContext (State keranjang & polling)
│   │   └── styles/      # Modular Vanilla CSS (No Tailwind)
├── server/              # Backend (Node.js, Express.js ES Module)
│   ├── prisma/          # Skema Prisma ORM & auto-seeding
│   └── src/
│       ├── routes/      # Endpoints /api/menus, /api/orders, /api/categories
│       ├── prisma.js    # PrismaClient instance
│       └── db.js        # In-Memory fallback database
├── api/                 # Serverless bridge untuk deployment Vercel
└── vercel.json          # Routing & build configuration
```

| Layer | Teknologi | Deskripsi |
|---|---|---|
| **Frontend** | React 19, Vite 8 | Antarmuka pengguna mobile-first super responsif |
| **Styling** | Vanilla CSS (CSS Variables) | Desain bertema editorial boutique & glassmorphism |
| **Icons & QR** | `lucide-react`, `qrcode.react` | Ikonografi modern dan render QR Code pesanan |
| **Backend API** | Express.js 4.21 (ES Module) | RESTful API teroptimasi dengan kompresi gzip |
| **Database & ORM** | Prisma ORM 6, PostgreSQL | Database persisten dengan transaksi atomik |
| **Fallback Mode** | In-Memory Database | Server otomatis berjalan tanpa database eksternal |
| **Hosting** | Vercel Serverless | Deployment otomatis frontend dan serverless API |

---

## 🚀 Menjalankan Projek di Komputer Lokal

### 1. Prasyarat
- Node.js versi 18+ terpasang di komputer Anda.
- Git.

### 2. Kloning Repositori
```bash
git clone https://github.com/FlashDIvine/Cafe-BlueSukan.git
cd Cafe-BlueSukan
```

### 3. Instalasi Dependensi
```bash
# Instal dependensi monorepo
npm install

# Instal dependensi frontend client
npm install --prefix client

# Instal dependensi backend server
npm install --prefix server
```

### 4. Jalankan Server Pengembangan (Dev Mode)
Jalankan frontend dan backend sekaligus dengan satu perintah:
```bash
npm run dev
```

Aplikasi akan aktif di:
- **Frontend (Pelanggan & Kasir):** [http://localhost:5173/](http://localhost:5173/)
- **Backend REST API:** [http://localhost:3001/](http://localhost:3001/)

---

## 🌐 Navigasi Mode Cepat

Gunakan hash URL untuk berpindah mode antarmuka:
- **Halaman Beranda Kafe:** [http://localhost:5173/#home](http://localhost:5173/#home) atau [http://localhost:5173/](http://localhost:5173/)
- **Katalog Pemesanan Mandiri:** [http://localhost:5173/#menu](http://localhost:5173/#menu)
- **Simulasi Scan QR Area Duduk:**
  - `http://localhost:5173/?table=outdoor` ➔ Otomatis memilih area **Outdoor**
  - `http://localhost:5173/?table=indoor` ➔ Otomatis memilih area **Indoor (Teras Beratap)**
  - `http://localhost:5173/?table=lt2` ➔ Otomatis memilih area **Lt 2**
- **Dashboard POS Kasir:** [http://localhost:5173/#cashier](http://localhost:5173/#cashier)

---

## 📦 Build untuk Produksi

```bash
npm run build
```
Perintah ini akan menjalankan generate Prisma Client dan mengompilasi bundel Vite yang dioptimasi ke direktori `client/dist`.

---

## 📄 Lisensi & Kontributor

- **Pengembang:** [FlashDIvine](https://github.com/FlashDIvine)
- **Projek:** BlueSukan Cafe Self-Order & POS Monorepo
- **Lisensi:** MIT
