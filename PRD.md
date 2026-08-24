# Product Requirement Document (PRD) - Bantu Cafe Self-Order (Customer Module)

## 1. Project Overview
Aplikasi web self-order berbasis mobile-first untuk kafe ("Bantu Cafe"). Pelanggan memesan mandiri via web tanpa login (Guest Mode) setelah memindai QR meja menggunakan kuota internet sendiri, lalu melakukan verifikasi dan pembayaran di kasir fisik.

## 2. Color Palette & UI Theme
- Primary: Deep Navy Blue (`#0F3E7D`)
- Accent: Ocean Blue (`#1E6091`), Sky Blue (`#EBF3FC`)
- Neutral: Clean White (`#FFFFFF`), Slate Gray (`#64748B`), Background Off-White (`#F8FAFC`)

## 3. User Flow & Core Features

### Phase 1: Katalog & Keranjang
- **QR Table Detection:** Membaca parameter URL `?table=XX` (misal `?table=04`). Jika kosong, fallback ke input manual.
- **Filter Kategori:** Tab filter horizontal (Semua, Kopi & Espresso, Non-Coffee, Makanan Ringan, dll).
- **Katalog & Indikator Stok:**
  - Menampilkan foto, nama, deskripsi singkat, dan harga (Rp).
  - Menampilkan sisa stok menu.
  - Jika stok = 0, tombol order nonaktif (status "Habis").
- **Keranjang Belanja:**
  - Tambah item, ubah kuantitas `[- 1 +]`, dan hapus item.
  - Validasi kuantitas tidak boleh melebihi stok yang tersedia.
  - Menghitung subtotal dan grand total secara otomatis.

### Phase 2: Formulir Checkout
- **Input Data Pemesan:**
  - Nama Pemesan (Wajib, Text)
  - Nomor Meja (Wajib, Auto-fill dari URL / Editable)
  - Catatan Tambahan (Opsional, Textarea)
- **Submit Pesanan:** Mengirim payload pesanan ke backend REST API dan menginisialisasi status pesanan `waiting_payment`.

### Phase 3: Tiket Pesanan & Realtime Status
- **Layar Tiket Pesanan:**
  - Menampilkan Kode Pesanan unik (contoh: `#BC-104`).
  - Menampilkan Barcode / QR Code interaktif yang berisi Order ID untuk di-scan kasir.
  - Petunjuk jelas: *"Tunjukkan QR/Kode ini ke kasir untuk verifikasi menu dan pembayaran (Cash/QRIS)."*
- **Polling Status Pesanan:**
  - Frontend melakukan polling API berkala (`GET /api/customer/orders/:order_code/status`).
  - Saat kasir menyetujui transaksi (status berubah ke `paid_processing`), UI otomatis bertransisi ke tampilan status "Pesanan Sedang Diproses".

## 4. Database Schema Reference

### Table: `menus`
- `id` (PK)
- `category_id` (FK)
- `name` (String)
- `price` (Integer)
- `stock` (Integer, Unsigned, Default: 0)
- `is_available` (Boolean, Default: true)
- `image_url` (String)

### Table: `orders`
- `id` (PK)
- `order_code` (String, Unique)
- `customer_name` (String)
- `table_number` (String)
- `notes` (Text, Nullable)
- `total_price` (Integer)
- `payment_method` (Enum: `cash`, `qris`, `debit`, Nullable)
- `status` (Enum: `waiting_payment`, `paid_processing`, `completed`, `cancelled`)

### Table: `order_items`
- `id` (PK)
- `order_id` (FK)
- `menu_id` (FK)
- `quantity` (Integer)
- `price` (Integer)
- `subtotal` (Integer)