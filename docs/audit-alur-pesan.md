# Laporan Audit Alur, Status, dan Teks Aplikasi Angkringan Blue’sukan Kopi

Dokumen ini memuat hasil audit komprehensif terhadap alur pemesanan, siklus status pesanan, interaksi pelanggan dan kasir, model data, penggunaan gambar, serta inventaris teks antarmuka di seluruh aplikasi **Angkringan Blue’sukan Kopi**.

---

## 1. Daftar Status Pesanan

### A. Semua Nilai Status Pesanan
Sistem menggunakan 5 nilai string status resmi (terdefinisi pada `server/prisma/schema.prisma` dan divalidasi pada `server/src/routes/orders.js` serta `server/src/db.js`):

1. **`waiting_payment`** (Menunggu Pembayaran):
   Status default awal saat pesanan baru dibuat pelanggan (`POST /api/orders`). Pesanan belum dibayar, baik untuk metode QRIS maupun Tunai. Stok menu belum dipotong.
2. **`waiting_qris_verification`** (Klaim / Verifikasi Pembayaran QRIS):
   Pelanggan telah menekan tombol "Konfirmasi Sudah Bayar QRIS" di modal tiket (`PATCH /api/orders/:order_code/confirm-qris`). Menandakan pelanggan mengklaim sudah transfer dan kasir perlu mengecek mutasi masuk.
3. **`paid_processing`** (Lunas & Sedang Diracik):
   Kasir telah menerima uang tunai atau memverifikasi transfer QRIS, lalu menekan konfirmasi bayar (`PATCH /api/orders/:id/approve`). **Pada status inilah stok menu resmi dipotong di database/memori.**
4. **`completed`** (Pesanan Selesai):
   Pesanan telah selesai disajikan/diambil pelanggan dan ditandai selesai oleh kasir (`PATCH /api/orders/:id/complete`).
5. **`cancelled`** (Pesanan Dibatalkan):
   Pesanan dibatalkan sebelum selesai. Bisa dibatalkan oleh pelanggan (hanya jika masih berstatus `waiting_payment` atau `waiting_qris_verification`) atau dibatalkan oleh kasir.

---

### B. Tabel Transisi Status

| Status Asal | Status Tujuan | Pemicu (Aktor) | Fungsi / Handler di Client | Endpoint / File Backend | Keterangan / Validasi |
|:---|:---|:---|:---|:---|:---|
| *(Belum ada)* | `waiting_payment` | **Pelanggan** | `handleSubmit` di `CartDrawer.jsx` $\rightarrow$ `submitOrderApi` | `POST /api/orders` di `orders.js` | Validasi keranjang $\ge 1$, nama $\ge 2$ huruf, meja $\ge 1$. Stok belum dipotong. |
| `waiting_payment` | `waiting_qris_verification` | **Pelanggan** | `handleConfirmQrisPayment` di `OrderTicket.jsx` $\rightarrow$ `confirmQrisPaymentApi` | `PATCH /api/orders/:code/confirm-qris` di `orders.js` | Hanya berlaku jika status awal `waiting_payment`. Memancarkan event SSE `QRIS_CONFIRMED`. |
| `waiting_payment` | `paid_processing` | **Kasir** | `handleQuickConfirmPayment` di `CashierPage.jsx` atau `handleConfirmAndApprove` di `CashierOrderModal.jsx` | `PATCH /api/orders/:id/approve` di `orders.js` | Kasir menerima pembayaran tunai. Stok menu dipotong. |
| `waiting_qris_verification` | `paid_processing` | **Kasir** | `handleQuickConfirmPayment` di `CashierPage.jsx` atau `handleConfirmAndApprove` di `CashierOrderModal.jsx` | `PATCH /api/orders/:id/approve` di `orders.js` | Kasir memverifikasi transfer QRIS masuk. Stok menu dipotong. |
| `paid_processing` | `completed` | **Kasir** | `handleCompleteOrder` di `CashierPage.jsx` atau `handleComplete` di `CashierOrderModal.jsx` | `PATCH /api/orders/:id/complete` di `orders.js` | Pesanan diserahkan ke pelanggan. Masuk ke arsip riwayat. |
| `waiting_payment` atau `waiting_qris_verification` | `cancelled` | **Pelanggan** | `handleCancelOrder` di `OrderTicket.jsx` $\rightarrow$ `cancelOrderApi(code, true)` | `PATCH /api/orders/:id/cancel` (`by_customer: true`) di `orders.js` | Pelanggan membatalkan mandiri. Ditolak HTTP 400 jika status sudah `paid_processing`. |
| `waiting_payment`, `waiting_qris_verification`, atau `paid_processing` | `cancelled` | **Kasir** | `handleCancelOrder` di `CashierPage.jsx` atau `handleCancel` di `CashierOrderModal.jsx` | `PATCH /api/orders/:id/cancel` di `orders.js` | Kasir menolak/membatalkan pesanan. |

---

### C. Status Titik Awal "Sedang Diproses/Dibuat"
- **Status:** `paid_processing`.
- **Aktor Pemicu:** **Kasir** (melalui aksi persetujuan pembayaran `approveOrderApi`).
- **Efek di Layar Pelanggan:**
  - `ActiveOrderTracker.jsx`: Label berubah menjadi *"Sedang Diracik Barista"* dengan ikon `ChefHat` dan status pill bernuansa proses.
  - `OrderTicket.jsx`: Status badge berubah dari "Menunggu Pembayaran" menjadi "Diproses".
  - Tombol batal mandiri milik pelanggan langsung **terkunci / hilang**.

---

## 2. Tombol Pelanggan

### A. Tombol "Konfirmasi Sudah Bayar QRIS" di Modal Tiket
- **Komponen & Baris:** `client/src/components/OrderTicket.jsx` (baris 109–120 dan 510–535).
- **Handler:** `handleConfirmQrisPayment`.
```javascript
// client/src/components/OrderTicket.jsx - handleConfirmQrisPayment
const handleConfirmQrisPayment = async () => {
  if (!order?.order_code) return;
  try {
    setIsConfirmingQris(true);
    await confirmQrisPaymentApi(order.order_code);
    setCurrentStatus('waiting_qris_verification');
  } catch (err) {
    alert(err.message || 'Gagal mengirim konfirmasi QRIS');
  } finally {
    setIsConfirmingQris(false);
  }
};
```
- **Apa yang Dikerjakan:**
  1. Mengirim request `PATCH /api/orders/:order_code/confirm-qris`.
  2. Server mengubah status pesanan dari `waiting_payment` menjadi `waiting_qris_verification`.
  3. Server memancarkan event SSE:
     `orderEvents.emit('order_changed', { type: 'QRIS_CONFIRMED', order_code, status })`.
  4. Local state di tiket diubah ke `waiting_qris_verification`, memicu tampilan animasi radar *"Menunggu Verifikasi Kasir..."*.
  5. Layar kasir yang mendengarkan SSE langsung membunyikan bel kasir (`playCashierBell()`) dan menampilkan badge kuning *"Klaim QRIS"*.

### B. Tombol "Salin Kode"
- **Komponen & Baris:** `client/src/components/OrderTicket.jsx` (baris 470–489).
- **Apa yang Disalin:** String `order?.order_code` (misalnya `#BC-101`) disalin ke clipboard menggunakan `navigator.clipboard.writeText(order?.order_code || '')`.
- **Tujuan:** Memudahkan pelanggan menempelkan kode pesanan ke berita/catatan transfer di aplikasi perbankan atau e-wallet saat membayar QRIS.
- **Feedback:** Menampilkan alert browser: ``Kode ${order?.order_code} disalin ke clipboard!``.

### C. Perilaku Tombol "Pesan Sekarang" di Keranjang
- **Komponen:** `client/src/components/CartDrawer.jsx` (baris 51–98 dan 406–425).
- **Kondisi Nonaktif (`disabled`):**
  Tombol terkunci nonaktif (`disabled={!canSubmit}`) jika salah satu kondisi berikut bernilai `false`:
  1. `isCartValid`: Keranjang belanja memiliki 0 item (`cartItems.length === 0`).
  2. `isNameValid`: Nama pemesan kurang dari 2 karakter (`customerName.trim().length < 2`).
  3. `isTableValid`: Nomor/area meja belum dipilih (`tableNumber.trim().length < 1`).
- **Validasi Submit:**
  Jika form di-submit dalam keadaan tidak valid, memicu toast:
  - *"Keranjang belanja Anda masih kosong"*
  - *"Mohon masukkan nama pemesan (minimal 2 karakter)"*
  - *"Mohon masukkan nomor meja"*
- **Setelah Pesanan Dibuat (`handleProceedToCheckout` di `client/src/App.jsx` baris 168–190):**
  1. Status awal pesanan di database/memori adalah `waiting_payment`.
  2. Keranjang belanja dikosongkan (`clearCart()`).
  3. Pesanan disimpan ke state `activeOrder` dan tersimpan persisten di `localStorage ('bluesukan_active_order')`.
  4. Muncul toast hijau: ``Pesanan ${createdOrder.order_code} berhasil dibuat!``.
  5. Pengguna dialihkan ke halaman Beranda (`setAppMode('home')`), dan modal tiket digital dibuka otomatis (`setIsTicketModalOpen(true)`).

### D. Perbedaan Alur: QRIS vs Tunai
- **Metode QRIS:**
  1. Pelanggan memilih radio/tombol "QRIS" di keranjang.
  2. Muncul notice di bawah rincian: *"Barcode QRIS & petunjuk pencantuman kode pesanan akan muncul di tiket."*
  3. Di tiket pesanan, ditampilkan gambar barcode QRIS merchant (jika kasir sudah upload), box kuning peringatan wajib mencantumkan kode transfer, tombol "Salin Kode", dan tombol aksi hijau **"✅ Konfirmasi Sudah Bayar QRIS"**.
  4. Pelanggan klik tombol konfirmasi $\rightarrow$ status menjadi `waiting_qris_verification`, memicu radar menunggu verifikasi.
- **Metode Tunai / Cash:**
  1. Pelanggan memilih radio/tombol "Tunai" di keranjang.
  2. Muncul notice di bawah rincian: *"Setelah memesan, silakan langsung menuju kasir untuk melakukan pembayaran tunai."*
  3. Di tiket pesanan, ditampilkan box hijau *"Pembayaran Tunai di Kasir"*, menginstruksikan pelanggan menuju meja kasir membawa HP untuk scan QR atau sebut kode pesanan.
  4. **TIDAK ADA tombol "Konfirmasi Sudah Bayar QRIS".**
  5. Pelanggan membayar uang fisik ke kasir $\rightarrow$ Kasir menekan "Konfirmasi Bayar".

---

## 3. Halaman Kasir (`CashierPage.jsx`)

### A. Tombol "Konfirmasi Bayar" (Hijau) vs "Verifikasi & Bayar" (Putih)
Di kartu antrean pesanan kasir (`client/src/pages/CashierPage.jsx` baris 669–745) terdapat dua tombol berbeda:

1. **Tombol Hijau "Konfirmasi Bayar" (`btn-quick-confirm`):**
   - **Fungsi:** Eksekusi langsung tanpa membuka modal detail.
   - **Handler:** `handleQuickConfirmPayment(order)` (baris 290–307).
   - Menampilkan konfirmasi browser `window.confirm`. Jika ditekan OK, langsung memanggil `approveOrderApi(order.id, method)`. Stok terpotong dan status pesanan langsung berubah ke `paid_processing`.
2. **Tombol "Verifikasi & Bayar" / "Cek & Setujui" / "Detail" (`btn-open-order`):**
   - **Fungsi:** **HANYA membuka modal inspeksi pesanan** (`CashierOrderModal.jsx`).
   - **Handler:** `setSelectedOrder(order)` (baris 738).
   - **Tidak ada perubahan status/data.** Di dalam modal detail barulah kasir dapat mengedit item, mengubah porsi, melihat bukti transfer QRIS, atau menolak pesanan.

---

### B. Inventaris Seluruh Aksi Kasir

| No | Nama Aksi / Elemen | Fungsi | Siapa & Kapan Dipakai | Kondisi & Efek |
|---:|:---|:---|:---|:---|
| 1 | **Tab Antrean** | Memfilter daftar pesanan yang belum dibayar | Kasir, setiap saat untuk melihat pesanan masuk | Menampilkan pesanan berstatus `waiting_payment` & `waiting_qris_verification`. Ada badge counter kuning jika ada klaim QRIS. |
| 2 | **Tab Proses** | Memfilter pesanan yang sedang diracik | Kasir & Barista, saat meracik pesanan | Menampilkan pesanan berstatus `paid_processing`. |
| 3 | **Tab Riwayat** | Memfilter arsip pesanan selesai & batal | Kasir, untuk audit & arsip transaksi | Menampilkan pesanan `completed` dan `cancelled`. Terbatasi max 25 item awal secara default. |
| 4 | **Kelola Menu & Stok** | Berpindah ke tampilan manajemen menu | Admin/Kasir, saat stok habis atau harga berubah | Membuka komponen `<MenuManagement />` untuk ubah stok, toggle aktif/nonaktif, dan tambah menu. |
| 5 | **Suara Aktif / Bisu** | Toggle nada bel notifikasi kasir | Kasir, saat shift operasional | Menyimpan preferensi ke `localStorage ('bluesukan_cashier_sound')`. Menguji AudioContext browser. |
| 6 | **Laporan Hari Ini** | Membuka laporan rekap penjualan | Kasir/Owner, saat pergantian shift atau tutup toko | Membuka `<SalesSummaryModal />` (`GET /api/orders/daily-summary`). Menghitung omzet, jumlah nota, dan top menu. |
| 7 | **Atur QRIS** | Mengunggah gambar QRIS merchant | Kasir/Admin, saat pertama setup atau ganti QRIS | Membuka `<QrisManagementModal />`. Mengompres gambar lewat canvas (< 300KB) ke base64. |
| 8 | **Tombol Refresh** | Sinkronisasi ulang data manual | Kasir, jika curiga koneksi terputus | Menampilkan spinner loading dan memanggil `loadData(false)` (`orders` + `menus`). |
| 9 | **Live Sync / SSE** | Background sync otomatis realtime | Sistem background | Terhubung ke `/api/orders/stream`. Re-fetch otomatis saat ada order baru / status berubah, plus polling 60s & visibilitychange. |
| 10 | **Panggil HP** | Mengirim sinyal bel ke ponsel pembeli | Kasir, saat pesanan siap diambil di meja kasir | Memanggil `POST /api/orders/:id/ring`. HP pembeli berbunyi chime & bergetar jika SSE terhubung. |
| 11 | **Selesai** | Menandai pesanan telah tuntas diserahkan | Kasir, setelah makanan/minuman disajikan | Memanggil `PATCH /api/orders/:id/complete`. Pesanan pindah dari tab Proses ke tab Riwayat. |

---

### C. Pengaturan QRIS Toko
- **Lokasi Penyimpanan:**
  - Database Prisma (PostgreSQL): Tabel `settings` (kolom `key = 'qris_image'`, nilai bertipe `Text` berisi data base64, dan `key = 'qris_merchant_name'`).
  - In-Memory Fallback (`server/src/db.js`): Variabel memori `settings.qris_image` dan `settings.qris_merchant_name`.
- **Penayangan ke Pelanggan:**
  - `OrderTicket.jsx` mengambil data via `GET /api/settings/qris`.
  - Jika ada: Dirender dalam frame gambar: `<img src={qrisSettings.qris_image} alt="QRIS Dagang Blue'sukan Kopi" />`.
- **Tampilan jika Belum Diatur:**
  - Ditampilkan box peringatan warna kuning gading:
    > *"Gambar barcode QRIS toko sedang disiapkan kasir. Tunjukkan kode tiket ini ke kasir."*

---

### D. Fitur Pencarian Kasir
Filter pencarian kasir (`CashierPage.jsx` baris 243–250) memeriksa variabel `searchQuery` (`q`) terhadap 3 field:
1. `o.order_code` (kode pesanan, misal: `#BC-101`)
2. `o.customer_name` (nama pelanggan)
3. `String(o.table_number)` (nomor atau nama area meja)
- **Catatan Audit:** **Nominal (`total_price`) dan nama menu yang dipesan TIDAK dicari.** Kasir tidak bisa mencari berdasarkan nominal transfer bank (misal "25000").

---

### E. Notifikasi Suara dan SSE

| Nama Event SSE | Dipancarkan Oleh | Diterima / Didengarkan Oleh | Respon Aksi |
|:---|:---|:---|:---|
| **`NEW_ORDER`** | `POST /api/orders` | `CashierPage.jsx` | `loadData(true)` + Bunyikan bel kasir (`playCashierBell()`) |
| **`QRIS_CONFIRMED`** | `PATCH /api/orders/:code/confirm-qris` | `CashierPage.jsx` | `loadData(true)` + Bunyikan bel kasir (`playCashierBell()`) |
| **`STATUS_UPDATED`** | `PATCH /:id/approve`, `/:id/complete`, `/:id/cancel`, `/:id/items` | `CashierPage.jsx`, `OrderTicket.jsx`, `App.jsx` | Sinkronisasi data order secara senyap tanpa bunyi bel |
| **`RING_CUSTOMER`** | `POST /api/orders/:id/ring` | `App.jsx`, `OrderTicket.jsx` | Bunyikan chime pelanggan (`playCustomerChime()`), getarkan ponsel (`navigator.vibrate`), dan tampilkan modal panggilan |

---

### F. Autentikasi Kasir
- **Status:** **TIDAK DITEMUKAN (TIDAK ADA AUTENTIKASI).**
- Rute kasir diaktifkan hanya berdasarkan URL hash `#cashier` di `client/src/App.jsx` (baris 24–35). Tidak ada login, input PIN, token sesi, maupun pengecekan hak akses di sisi client maupun server.

---

## 4. Model Data

### A. Bentuk Objek Pesanan (`Order`)
```typescript
interface Order {
  id: number;                          // Contoh: 1
  order_code: string;                  // Contoh: "#BC-101"
  customer_name: string;               // Contoh: "Budi Santoso"
  table_number: string;                // Contoh: "Indoor", "Outdoor", "Lt 2", "5"
  notes: string | null;                // Contoh: "Kopi panas less sugar" atau null
  total_price: number;                 // Contoh: 25000 (angka bulat IDR)
  payment_method: string | null;       // Contoh: "cash" | "qris" | "debit"
  status: string;                      // Contoh: "waiting_payment"
  paid_at: string | null;              // Contoh: "2026-11-22T10:05:00.000Z" atau null
  created_at: string;                  // Contoh: "2026-11-22T10:00:00.000Z"
  updated_at: string;                  // Contoh: "2026-11-22T10:05:00.000Z"
  items: Array<{
    id?: number;
    menu_id: number;                   // Contoh: 11
    name: string;                      // Contoh: "Mendoan (1 Porsi)"
    price: number;                     // Contoh: 10000
    quantity: number;                  // Contoh: 2
    subtotal: number;                  // Contoh: 20000
  }>;
}
```
- **Nominal Unik / Kode Referensi Pembayaran:** **TIDAK DITEMUKAN.**
  Nilai `total_price` adalah angka murni hasil penjumlahan item. Tidak ada penambahan kode unik 3 digit acak (misal Rp 25.143) dan tidak ada field referensi transaksi bank. Satu-satunya referensi yang digunakan adalah `order_code` (`#BC-101`).

---

### B. Bentuk Objek Menu (`Menu`)
```typescript
interface Menu {
  id: number;                          // Contoh: 11
  category_id: string;                 // Contoh: "cemilan-gorengan"
  name: string;                        // Contoh: "Mendoan (1 Porsi)"
  price: number;                       // Contoh: 10000
  stock: number;                       // Contoh: 25
  is_available: boolean;               // Contoh: true
  image_url: string;                   // Nama field gambar adalah: "image_url"
  description: string | null;          // Contoh: "Tempe mendoan hangat khas Banyumas..."
  is_popular: boolean;                 // Contoh: true
  created_at?: string;
  updated_at?: string;
}
```

---

## 5. Semua Tempat yang Merender Gambar Menu

| File & Komponen | Baris | Elemen Render | Jenis Gambar | Status & Dampak jika Dihapus |
|:---|---:|:---|:---|:---|
| `client/src/components/CartDrawer.jsx` | 172 | `<img src={item.imageUrl} alt={item.name} className="cart-item-img" />` | Thumbnail menu di keranjang belanja | **Aman dihapus**: Hanya elemen dekoratif daftar keranjang. |
| `client/src/components/RecommendedCard.jsx` | 40 | `<img src={optimizedSrc} alt={item.name} className="stitch-rec-image" />` | Thumbnail kartu rekomendasi menu lama | **Aman dihapus**: Komponen ini sudah tidak dipakai di `MenuPage.jsx`. |
| `client/src/components/MenuManagement.jsx` | 533 | `<img src={menu.image_url} alt={menu.name} />` | Thumbnail tabel kelola menu kasir | **Aman dihapus**: Hanya thumbnail visual tabel, tombol aksi stok & edit tetap utuh. |
| `client/src/components/MenuManagement.jsx` | 316 | `<img src={previewImage} alt="Preview" />` | Preview gambar menu saat diedit | **Punya efek logika**: Memberi feedback visual kasir saat memilih/mengunggah gambar. |
| `client/src/components/MenuManagement.jsx` | 410 | `<img src={img.url} alt={img.label} />` | Pilihan preset galeri foto menu | **Punya efek logika**: Digunakan kasir memilih gambar bawaan menu. |
| `client/src/components/MenuFormModal.jsx` | 302 | `<img src={previewImage} ... />` | Preview foto menu baru | **Punya efek logika**: Pratinjau form penambahan menu baru. |
| `client/src/components/QrisManagementModal.jsx` | 352 | `<img src={previewImage} alt="Preview QRIS" />` | Preview barcode QRIS toko | **Punya efek logika**: Terikat logika kompresi canvas & simpan gambar QRIS merchant. |
| `client/src/components/OrderTicket.jsx` | 395 | `<img src={qrisSettings.qris_image} alt="QRIS Dagang Blue'sukan Kopi" />` | Barcode QRIS toko di tiket pelanggan | **BUKAN GAMBAR MENU**: Ini gambar QRIS toko untuk pembayaran pelanggan. Punya efek fungsional transaksi. |
| `HomePage.jsx`, `MenuPage.jsx`, `MenuCard.jsx`, `CategoryFilter.jsx` | - | - | Foto hero, bento, suasana, thumbnail kategori | **Sudah dibersihkan**: Di Langkah 1–3, seluruh gambar menu pada komponen ini telah dihilangkan sesuai aturan anti-slop. |

---

## 6. Inventaris Teks Tampilan Per Komponen

Berikut adalah inventaris seluruh teks yang tampil ke pengguna pada setiap file antarmuka, beserta penanda teks dinamis (template string / variabel):

### 1. `client/src/components/Navbar.jsx`
| Jenis Elemen | Teks Tampilan Persis | Dinamis / Variabel |
|:---|:---|:---|
| Logo Brand | `Blue’sukan Kopi` | Statis |
| Pill Meja (Jika ada active order) | `Meja ${cleanOrderCode}` | Dinamis: `cleanOrderCode` (`activeOrder.order_code`) |
| Pill Meja (Default) | `Meja ${formatLocationDisplay(tableNumber)}` | Dinamis: `tableNumber` |
| Title / Aria Label | `Kembali ke Beranda`, `Lihat Tiket QR Pesanan (${cleanOrderCode})`, `Klik untuk mengubah lokasi duduk` | Dinamis: `cleanOrderCode`, `tableNumber` |

### 2. `client/src/components/Footer.jsx`
| Jenis Elemen | Teks Tampilan Persis | Dinamis / Variabel |
|:---|:---|:---|
| Judul Brand | `Blue’sukan Kopi` | Statis |
| Deskripsi | `Warung kayu di sisi Bendung Gerak Serayu, Rawalo, Banyumas.` | Statis |
| Heading Navigasi | `Navigasi`, `Layanan` | Statis |
| Tautan | `Beranda`, `Menu`, `Guru Honorer`, `Jam Buka & Alamat`, `Pesan Mandiri`, `Dashboard Kasir` | Statis |
| Hak Cipta | `© ${new Date().getFullYear()} Blue’sukan Kopi. Rawalo, Banyumas.` | Dinamis: tahun berjalan |

### 3. `client/src/pages/HomePage.jsx`
| Jenis Elemen | Teks Tampilan Persis | Dinamis / Variabel |
|:---|:---|:---|
| Hero Heading `h1` | `Ngopi di tepi Serayu.` | Statis |
| Hero Paragraf | `Warung kayu di sisi Bendung Gerak Serayu, Rawalo. Pilih menu dari HP, bayar di kasir.` | Statis |
| Tombol Hero | `Lihat menu` | Statis |
| Stiker Bulat Cangkir | `Meja ${tableCodeDisplay} / ${areaDisplay}` | Dinamis: `tableCodeDisplay`, `areaDisplay` |
| Pita Guru Honorer | `Guru honorer makan siang gratis.` | Statis |
| Subteks Pita Guru | `Tunjukkan kartu identitas guru aktif ke kasir.` | Statis |
| Judul Menu Andalan | `Menu andalan` | Statis |
| Tombol Katalog Menu | `Semua ${menus.length || 55} menu` | Dinamis: `menus.length` |
| Judul Info Operasional | `Jam buka`, `Alamat` | Statis |
| Subteks Jadwal | `Senin libur.`, `Kawasan Tepi Bendung Gerak Serayu, Rawalo, Banyumas.` | Statis |
| Baris Jadwal | `Senin`, `Libur`, `Selasa – Kamis`, `11.00 – 00.00 WIB`, `Jumat`, `15.00 – 00.00 WIB`, `Sabtu`, `10.00 – 00.00 WIB`, `Minggu`, `10.00 – 22.00 WIB` | Statis |
| Tombol Maps | `Buka di Google Maps` | Statis |

### 4. `client/src/pages/MenuPage.jsx`
| Jenis Elemen | Teks Tampilan Persis | Dinamis / Variabel |
|:---|:---|:---|
| Judul Halaman `h1` | `Menu` | Statis |
| Placeholder Input Cari | `Cari kopi, mendoan, nasi bakar...` | Statis |
| Empty State Title | `Menu tidak ditemukan` | Statis |
| Empty State Desc | `Coba gunakan kata kunci lain atau pilih kategori berbeda.` | Statis |

### 5. `client/src/components/MenuCard.jsx`
| Jenis Elemen | Teks Tampilan Persis | Dinamis / Variabel |
|:---|:---|:---|
| Nama Menu | `${item.name}` | Dinamis: `item.name` |
| Deskripsi Menu | `${item.description}` | Dinamis: `item.description` |
| Label Harga | `${formatRupiah(item.price)}` | Dinamis: `item.price` |
| Badge Habis | `Habis` | Statis |
| Warning Stok Tipis | `Sisa ${item.stock} porsi` | Dinamis: `item.stock` |
| Tombol Aksi | `Tambah` | Statis |
| Stepper Value | `${qtyInCart}` | Dinamis: `qtyInCart` |

### 6. `client/src/components/CategoryFilter.jsx`
| Jenis Elemen | Teks Tampilan Persis | Dinamis / Variabel |
|:---|:---|:---|
| Label Kategori | `Semua`, `Makanan`, `Cemilan`, `Kopi`, `Susu & Coklat`, `Teh & Lainnya` | Statis |
| Counter Menu | `(${count})` | Dinamis: `count` (jumlah menu per kategori) |

### 7. `client/src/components/FloatingCartBar.jsx`
| Jenis Elemen | Teks Tampilan Persis | Dinamis / Variabel |
|:---|:---|:---|
| Badge Counter | `${totalItemsCount}` | Dinamis: `totalItemsCount` |
| Label Ringkasan | `${totalItemsCount} menu dipilih` | Dinamis: `totalItemsCount` |
| Total Harga | `${formatRupiah(grandTotalPrice)}` | Dinamis: `grandTotalPrice` |
| Label Tombol | `Lihat pesanan` | Statis |

### 8. `client/src/components/CartDrawer.jsx`
| Jenis Elemen | Teks Tampilan Persis | Dinamis / Variabel |
|:---|:---|:---|
| Header Drawer | `Keranjang Pesanan`, `${totalItemsCount} Item`, `Kosongkan` | Dinamis: `totalItemsCount` |
| Empty State | `Keranjang Anda Masih Kosong`, `Yuk pilih menu kopi, minuman segar, atau makanan favoritmu dari katalog!`, `Lihat Menu` | Statis |
| Label Form | `Nama Pemesan`, `Lokasi Duduk / Meja`, `Pilihan Metode Pembayaran`, `Catatan Tambahan`, `Opsional` | Statis |
| Placeholder | `Masukkan nama Anda (min. 2 huruf)`, `Contoh: Kopi gula aren less sugar, sambal dipisah...` | Statis |
| Pilihan Metode Bayar | `QRIS (Transfer Bank / E-Wallet)`, `Tunai di Kasir` | Statis |
| Deskripsi Metode | `Scan barcode & masukkan kode pesanan`, `Bayar langsung dengan uang tunai ke kasir` | Statis |
| Ringkasan Tagihan | `Subtotal (${totalItemsCount} Menu)`, `Pajak & Layanan`, `Termasuk`, `Total Pembayaran` | Dinamis: `totalItemsCount`, `grandTotalPrice` |
| Info Notice Bayar | `Barcode QRIS & petunjuk pencantuman kode pesanan akan muncul di tiket.` / `Setelah memesan, silakan langsung menuju kasir untuk melakukan pembayaran tunai.` | Dinamis: tergantung pilihan `paymentMethod` |
| Tombol Checkout Submit | `Pesan Sekarang`, `${formatRupiah(grandTotalPrice)}` | Dinamis: `grandTotalPrice` |
| Toast Notifikasi | `Keranjang belanja Anda masih kosong`, `Mohon masukkan nama pemesan (minimal 2 karakter)`, `Mohon masukkan nomor meja`, `Keranjang telah dikosongkan` | Statis |

### 9. `client/src/components/TableModal.jsx`
| Jenis Elemen | Teks Tampilan Persis | Dinamis / Variabel |
|:---|:---|:---|
| Judul Modal | `Pilih Lokasi Duduk` | Statis |
| Deskripsi Modal | `Pilih area tempat Anda duduk di Angkringan Blue'sukan Kopi untuk mempermudah pesanan diantarkan ke meja Anda.` | Statis |
| Pilihan Area | `Indoor` (`Teras Beratap`), `Outdoor` (`Area Terbuka`), `Lt 2` (`Lantai Atas`) | Statis |
| Tombol Modal | `Batal`, `Simpan Lokasi` | Statis |
| Toast Notifikasi | `Lokasi duduk diubah ke ${selectedArea}` | Dinamis: `selectedArea` |

### 10. `client/src/components/Toast.jsx`
| Jenis Elemen | Teks Tampilan Persis | Dinamis / Variabel |
|:---|:---|:---|
| Isi Pesan Toast | `${msg}` | Dinamis: variabel pesan toast sistem |

### 11. `client/src/components/OrderTicket.jsx` & `ActiveOrderModal.jsx`
| Jenis Elemen | Teks Tampilan Persis | Dinamis / Variabel |
|:---|:---|:---|
| Header Modal | `Tiket Pesanan Digital`, `Beranda` | Statis |
| Banner Batal | `Pesanan Telah Dibatalkan`, `Pesanan ${order?.order_code} telah dibatalkan sebelum dikonfirmasi penjual.` | Dinamis: `order.order_code` |
| Banner Sukses Awal | `Pesanan Berhasil Dibuat!`, `Kode pesanan Anda adalah ${order?.order_code}. Simpan tiket ini untuk verifikasi kasir.` | Dinamis: `order.order_code` |
| Card Kode Pesanan | `KODE PESANAN`, `${order?.order_code}` | Dinamis: `order.order_code` |
| Badge Status Tiket | `Menunggu Pembayaran`, `Menunggu Verifikasi QRIS`, `Diproses`, `Selesai`, `Dibatalkan` | Dinamis: `currentStatus` |
| Waktu Dibuat | `Dipesan pada ${order?.created_at}` | Dinamis: tanggal format |
| QR Code Subtext | `Tunjukkan QR Code ini ke kasir untuk verifikasi cepat pesanan Anda.` | Statis |
| Box Peringatan QRIS | `PENTING SAAT TRANSFER:`, `Harap cantumkan Kode Pesanan berikut pada catatan/berita transfer Anda:`, `Salin Kode`, `Total Tagihan:`, `${formatRupiah(order?.total_price || 0)}` | Dinamis: `order.order_code`, `total_price` |
| Tombol Konfirmasi QRIS | `✅ Konfirmasi Sudah Bayar QRIS` / `Mengirim Konfirmasi...` | Dinamis: `isConfirmingQris` |
| Box Pembayaran Tunai | `Pembayaran Tunai di Kasir`, `Silakan langsung menuju ke meja kasir dan sebutkan Kode Pesanan ${order?.order_code} atau tunjukkan QR Tiket di atas.`, `Total Tagihan Tunai:`, `Kasir akan mengonfirmasi pesanan Anda setelah pembayaran tunai diterima.` | Dinamis: `order.order_code`, `total_price` |
| Tombol Batalkan Pembeli | `Batalkan Pesanan Ini` / `Membatalkan...`, `Pesanan hanya dapat dibatalkan selama belum dikonfirmasi penjual / kasir.` | Dinamis: `isCancelling` |
| Rincian Order | `Nama Pemesan`, `Lokasi Duduk`, `Catatan: ${order.notes}`, `Rincian Menu`, `${item.quantity}x ${item.name}`, `Total Pembayaran` | Dinamis: data order & item |
| Tombol Aksi Bawah | `Kembali ke Halaman Utama`, `Pesan Menu Tambahan` / `Kembali ke Katalog Menu` | Dinamis: `isProcessing` |

### 12. `client/src/components/ActiveOrderTracker.jsx`
| Jenis Elemen | Teks Tampilan Persis | Dinamis / Variabel |
|:---|:---|:---|
| Status Label | `Menunggu Pembayaran Kasir`, `Verifikasi Pembayaran QRIS`, `Sedang Diracik Barista`, `Pesanan Selesai / Siap`, `Pesanan Dibatalkan` | Dinamis: `currentStatus` |
| Meta Line Bar | `${order.order_code}`, `${formatLocationDisplay(order.table_number)}`, `${formatRupiah(order.total_price)}` | Dinamis: data order |
| Tombol Bar | `Tiket QR` | Statis |

### 13. `client/src/pages/CashierPage.jsx` & Subkomponen
| Jenis Elemen | Teks Tampilan Persis | Dinamis / Variabel |
|:---|:---|:---|
| Header Kasir | `POS Kasir`, `Angkringan Blue'sukan Kopi`, `Antrean Pesanan`, `Kelola Menu & Stok`, `Suara Aktif` / `Suara Bisu`, `Laporan Hari Ini`, `Atur QRIS`, `Live Sync` / `Reconnecting...` | Dinamis: status suara & koneksi |
| Tab Filter Antrean | `Belum Bayar (${counts.waiting_payment})`, `Klaim QRIS: ${counts.qris_claims}`, `Diproses (${counts.paid_processing})`, `Riwayat (${counts.completed + counts.cancelled})` | Dinamis: `counts` |
| Placeholder Cari | `Cari kode (#BC-101), nama pemesan, atau meja...` | Statis |
| Kartu Antrean | `${order.order_code}`, `${formatLocationDisplay(order.table_number)}`, `${order.customer_name}`, `${order.items.length} menu`, `${formatRupiah(order.total_price)}`, `Metode: ${order.payment_method}` | Dinamis: data order |
| Tombol Kartu Antrean | `Konfirmasi Bayar`, `Panggil HP`, `Selesai`, `Cek & Setujui` / `Verifikasi & Bayar` / `Detail` | Dinamis: status order |
| Empty State Antrean | `Tidak Ada Pesanan`, `Semua pesanan saat ini sudah selesai diproses.` / `Coba kata kunci pencarian yang berbeda.` | Dinamis: jika ada search query |
| Modal Detail Kasir (`CashierOrderModal.jsx`) | `Detail & Konfirmasi Pesanan`, `ID Pesanan`, `Tambah Menu`, `Metode Pembayaran`, `Tunai`, `QRIS`, `Debit`, `Batalkan Pesanan`, `Panggil HP Pembeli`, `Selesai Diracik`, `Konfirmasi Sudah Bayar (${formatRupiah(currentTotalPrice)})` | Dinamis: `currentTotalPrice` |
| Modal Laporan (`SalesSummaryModal.jsx`) | `Laporan Penjualan Harian`, `Pilih Tanggal Laporan:`, `Total Omzet Bersih`, `Pesanan Berhasil`, `Rata-rata Nota`, `Rincian Pembayaran (Tunai, QRIS, Debit)`, `5 Menu Terlaris` | Dinamis: data ringkasan harian |
| Modal QRIS (`QrisManagementModal.jsx`) | `Pengaturan QRIS Merchant`, `Nama Toko / Usaha`, `Upload Foto QRIS`, `Hapus QRIS`, `Simpan Pengaturan` | Statis |
| Kelola Stok (`MenuManagement.jsx`) | `Kelola Menu & Stok`, `Tambah Menu Baru`, `Kelola Kategori`, `Total Menu`, `Tersedia`, `Stok Habis / Nonaktif` | Dinamis: data agregasi stok |

---

## 7. Temuan (Temuan Bug Tampilan & Teks Menyesatkan)

### A. Bug Tampilan & Teks yang Teridentifikasi
1. **Penyebutan Tanda `#` Ganda (`##BC-101`):**
   - Di backend (`server/src/routes/orders.js`), fungsi `generateOrderCode()` sudah menyertakan simbol `#` (misal `#BC-101`).
   - Namun di beberapa komponen frontend lama, string dirender dengan template `#{order.order_code}`:
     - `client/src/App.jsx` baris 164: `<span>Tiket <strong className="tabular">#{activeOrder.order_code}</strong></span>` $\rightarrow$ Tampil di layar sebagai **`Tiket ##BC-101`**.
     - `client/src/components/CashierOrderModal.jsx` baris 179: `#{order.order_code}` $\rightarrow$ Tampil **`##BC-101`**.
     - `client/src/pages/CashierPage.jsx` baris 618: `#{order.order_code}` $\rightarrow$ Tampil **`##BC-101`**.
2. **Tombol "Verifikasi & Bayar" di Kartu Kasir Memiliki Label Ambigu:**
   - Label tombol tertulis *"Verifikasi & Bayar"*, padahal fungsinya hanya membuka modal detail pesanan (`setSelectedOrder(order)`), bukan melakukan aksi verifikasi pembayaran. Sebaliknya, tombol hijau di sebelahnya (*"Konfirmasi Bayar"*) yang justru langsung memproses verifikasi dan approve pesanan. Hal ini rawan membingungkan operator kasir baru.
3. **Pencarian Kasir (`searchQuery`) Mengabaikan Nominal Pembayaran:**
   - Kasir sering kali mengecek mutasi masuk rekening berdasarkan nominal uang (misal transfer masuk Rp 15.000). Saat kasir mengetik `"15000"` di kotak pencarian kasir, daftar pesanan menjadi kosong karena filter pencarian hanya mencocokkan `order_code`, `customer_name`, dan `table_number`.

### B. Teks yang Berbunyi Menyesatkan / Inkonsisten
1. **Menyebut "Barcode QRIS" padahal QR Code 2D:**
   - Pada `client/src/components/CartDrawer.jsx` baris 396:
     > *"Barcode QRIS & petunjuk pencantuman kode pesanan akan muncul di tiket."*
   - Pada `client/src/components/OrderTicket.jsx` baris 415:
     > *"Gambar barcode QRIS toko sedang disiapkan kasir. Tunjukkan kode tiket ini ke kasir."*
   - QRIS standar Bank Indonesia adalah **QR Code** (matriks 2 dimensi), bukan **barcode** (garis 1 dimensi). Istilah yang tepat adalah *"QR Code QRIS"*.
2. **Instruksi Pencantuman Kode Pesanan Tanpa Nominal Unik:**
   - Teks instruksi di tiket berbunyi: *"Harap cantumkan Kode Pesanan berikut pada catatan/berita transfer Anda"*.
   - Kenyataannya, banyak aplikasi mobile banking (BCA, Mandiri, BRI) atau e-wallet saat memindai QRIS statis **tidak menyediakan field catatan berita transfer**, atau pelanggan sering lupa mengisinya.
   - Karena sistem Blue’sukan Kopi tidak menghasilkan 3 digit nominal unik (misalnya Rp 10.104 untuk order #BC-104), kasir akan kesulitan membedakan jika ada beberapa pelanggan yang mentransfer nominal bulat yang sama (misal sama-sama Rp 10.000) pada jam sibuk.
3. **Ketiadaan Pembatasan Hak Akses (Security Slop):**
   - Di navigasi footer terdapat tombol *"Dashboard Kasir"*, dan URL kasir terbuka bebas di `#cashier`. Tidak ada peringatan atau form PIN/login, sehingga pelanggan yang mengklik tautan tersebut langsung masuk ke sistem administrasi kasir.
