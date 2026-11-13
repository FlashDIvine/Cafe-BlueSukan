/**
 * In-Memory Database for Angkringan Blue'sukan Kopi (Rawalo, Banyumas)
 * Dual-engine fallback when DATABASE_URL is not set
 */

// ─── Categories ────────────────────────────────────────────────
export const categories = [
  { id: 'makanan-utama', name: 'Makanan Utama' },
  { id: 'cemilan-gorengan', name: 'Cemilan & Gorengan' },
  { id: 'minuman-kopi', name: 'Minuman Kopi' },
  { id: 'minuman-susu-coklat', name: 'Minuman Susu & Coklat' },
  { id: 'minuman-teh-lainnya', name: 'Minuman Teh & Lainnya' },
];

// ─── Menus (55 Items Asli Angkringan Blue'sukan Kopi) ──────────
export const menus = [
  // 1. Makanan Utama
  {
    id: 1,
    category_id: 'makanan-utama',
    name: 'Makanan Prasmanan',
    price: 12000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
    description: 'Prasmanan lauk pauk & sayur khas angkringan (harga variatif Rp 8.000 - Rp 20.000).',
    is_popular: true,
  },
  {
    id: 2,
    category_id: 'makanan-utama',
    name: 'Pecel dan Kupat',
    price: 10000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    description: 'Kupat tahu dan pecel sayuran segar bumbu kacang gurih khas Banyumas.',
    is_popular: true,
  },
  {
    id: 3,
    category_id: 'makanan-utama',
    name: 'Nasi Bakar',
    price: 6000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=600&q=80',
    description: 'Nasi bakar harum aroma daun pisang dengan isian suwiran ayam/tongkol gurih.',
    is_popular: true,
  },
  {
    id: 4,
    category_id: 'makanan-utama',
    name: 'Intel Goreng / Rebus',
    price: 10000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    description: 'Indomie Telur (Goreng/Rebus) komplit dengan sayur sawi & cabai rawit.',
    is_popular: false,
  },
  {
    id: 5,
    category_id: 'makanan-utama',
    name: 'Tante Goreng / Rebus',
    price: 8000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
    description: 'Indomie Tanpa Telur (Goreng/Rebus) sedap gurih cepat saji.',
    is_popular: false,
  },
  {
    id: 6,
    category_id: 'makanan-utama',
    name: 'Mie Nyemek Telor',
    price: 12000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80',
    description: 'Mie kuah nyemek kental dengan bumbu spesial & telur orak-arik lezat.',
    is_popular: true,
  },

  // 2. Cemilan & Gorengan
  {
    id: 7,
    category_id: 'cemilan-gorengan',
    name: 'Sate-satean',
    price: 3000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
    description: 'Pilihan sate usus, kulit, puyuh, dan ati ampela bakar bumbu manis gurih.',
    is_popular: true,
  },
  {
    id: 8,
    category_id: 'cemilan-gorengan',
    name: 'Dumpling',
    price: 4000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80',
    description: 'Dumpling isi ayam / keju gurih disajikan dengan saus pedas manis.',
    is_popular: false,
  },
  {
    id: 9,
    category_id: 'cemilan-gorengan',
    name: 'Cireng (1 Porsi)',
    price: 10000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    description: 'Cireng krispi kenyal disajikan hangat dengan cocolan bumbu rujak pedas manis.',
    is_popular: false,
  },
  {
    id: 10,
    category_id: 'cemilan-gorengan',
    name: 'Kentang Goreng (1 Porsi)',
    price: 10000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
    description: 'French fries renyah keemasan bertabur garam gurih & saus sambal.',
    is_popular: false,
  },
  {
    id: 11,
    category_id: 'cemilan-gorengan',
    name: 'Mendoan (1 Porsi)',
    price: 10000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=600&q=80',
    description: 'Tempe mendoan hangat khas Banyumas berbalut daun bawang + sambal kecap cabai rawit.',
    is_popular: true,
  },
  {
    id: 12,
    category_id: 'cemilan-gorengan',
    name: 'Pisang Goreng (1 Porsi)',
    price: 10000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
    description: 'Pisang goreng renyah manis legit cocok untuk teman ngopi santai di tepi sungai.',
    is_popular: true,
  },

  // 3. Minuman Kopi
  {
    id: 13,
    category_id: 'minuman-kopi',
    name: 'Kapal Api (Panas)',
    price: 5000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    description: 'Kopi hitam Kapal Api seduh air panas beraroma mantap.',
    is_popular: false,
  },
  {
    id: 14,
    category_id: 'minuman-kopi',
    name: 'Kapal Api (Dingin)',
    price: 6000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    description: 'Es kopi hitam Kapal Api dingin menyegarkan.',
    is_popular: false,
  },
  {
    id: 15,
    category_id: 'minuman-kopi',
    name: 'Kopi Jahe (Panas)',
    price: 6000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    description: 'Perpaduan kopi hitam dengan sari jahe hangat yang menyehatkan badan.',
    is_popular: false,
  },
  {
    id: 16,
    category_id: 'minuman-kopi',
    name: 'Kopi Tubruk (Panas)',
    price: 5000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
    description: 'Kopi tubruk hitam pekat klasik racikan angkringan Blue\'sukan Kopi.',
    is_popular: true,
  },
  {
    id: 17,
    category_id: 'minuman-kopi',
    name: 'Nescafe Classic (Panas)',
    price: 5000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=600&q=80',
    description: 'Kopi Nescafe Classic seduh panas beraroma lembut.',
    is_popular: false,
  },
  {
    id: 18,
    category_id: 'minuman-kopi',
    name: 'Nescafe Ice (Dingin)',
    price: 6000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80',
    description: 'Es Nescafe dingin segar pelepas kantuk dan dahaga.',
    is_popular: false,
  },
  {
    id: 19,
    category_id: 'minuman-kopi',
    name: 'Indocafe (Panas)',
    price: 5000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
    description: 'Indocafe Coffeemix seduh panas nikmat & manis pas.',
    is_popular: false,
  },
  {
    id: 20,
    category_id: 'minuman-kopi',
    name: 'Indocafe (Dingin)',
    price: 6000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
    description: 'Es Indocafe Coffeemix dingin berpadu es kristal.',
    is_popular: false,
  },
  {
    id: 21,
    category_id: 'minuman-kopi',
    name: 'White Coffe Luwak (Panas)',
    price: 5000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=600&q=80',
    description: 'Luwak White Koffie seduh panas, lembut dan nyaman di lambung.',
    is_popular: false,
  },
  {
    id: 22,
    category_id: 'minuman-kopi',
    name: 'White Coffe Luwak (Dingin)',
    price: 6000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80',
    description: 'Es Luwak White Koffie dingin creamy & menyegarkan.',
    is_popular: false,
  },
  {
    id: 23,
    category_id: 'minuman-kopi',
    name: 'ABC Susu (Panas)',
    price: 5000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80',
    description: 'Kopi ABC Plus Susu seduh panas mantap khas tongkrongan.',
    is_popular: false,
  },
  {
    id: 24,
    category_id: 'minuman-kopi',
    name: 'ABC Susu (Dingin)',
    price: 6000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?auto=format&fit=crop&w=600&q=80',
    description: 'Es Kopi ABC Plus Susu dingin manis pas.',
    is_popular: false,
  },
  {
    id: 25,
    category_id: 'minuman-kopi',
    name: 'Gooday Original (Panas)',
    price: 5000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1518832553480-cd0e625ed3e6?auto=format&fit=crop&w=600&q=80',
    description: 'Good Day Original seduh panas rasa kopi otentik.',
    is_popular: false,
  },
  {
    id: 26,
    category_id: 'minuman-kopi',
    name: 'Gooday Original (Dingin)',
    price: 6000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1499961024600-adf094db305d?auto=format&fit=crop&w=600&q=80',
    description: 'Es Good Day Original dingin mantap.',
    is_popular: false,
  },
  {
    id: 27,
    category_id: 'minuman-kopi',
    name: 'Gooday Latte (Panas)',
    price: 6000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=600&q=80',
    description: 'Good Day Vanilla Latte / Mocacinno seduh panas creamy.',
    is_popular: false,
  },
  {
    id: 28,
    category_id: 'minuman-kopi',
    name: 'Gooday Latte (Dingin)',
    price: 7000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1530373239216-42518e6b4063?auto=format&fit=crop&w=600&q=80',
    description: 'Es Good Day Vanilla Latte / Mocacinno dingin manis.',
    is_popular: false,
  },
  {
    id: 29,
    category_id: 'minuman-kopi',
    name: 'Gooday Creamy (Panas)',
    price: 6000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=600&q=80',
    description: 'Good Day Chococino / Carrebian Nut seduh panas gurih legit.',
    is_popular: false,
  },
  {
    id: 30,
    category_id: 'minuman-kopi',
    name: 'Gooday Creamy (Dingin)',
    price: 7000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    description: 'Es Good Day Creamy dingin nikmat favorit anak muda.',
    is_popular: false,
  },

  // 4. Minuman Susu & Coklat
  {
    id: 31,
    category_id: 'minuman-susu-coklat',
    name: 'Susu Putih (Panas)',
    price: 5000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
    description: 'Susu kental manis putih diseduh air panas manis gurih.',
    is_popular: false,
  },
  {
    id: 32,
    category_id: 'minuman-susu-coklat',
    name: 'Susu Putih (Dingin)',
    price: 6000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80',
    description: 'Es susu kental manis putih dingin menyegarkan.',
    is_popular: false,
  },
  {
    id: 33,
    category_id: 'minuman-susu-coklat',
    name: 'Susu Coklat (Panas)',
    price: 5000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80',
    description: 'Susu kental manis coklat seduh panas nikmat.',
    is_popular: false,
  },
  {
    id: 34,
    category_id: 'minuman-susu-coklat',
    name: 'Susu Coklat (Dingin)',
    price: 6000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=600&q=80',
    description: 'Es susu kental manis coklat dingin manis lezat.',
    is_popular: true,
  },
  {
    id: 35,
    category_id: 'minuman-susu-coklat',
    name: 'Dancow Putih (Panas)',
    price: 7000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
    description: 'Susu bubuk Dancow FortiGro putih seduh panas berprotein tinggi.',
    is_popular: false,
  },
  {
    id: 36,
    category_id: 'minuman-susu-coklat',
    name: 'Dancow Putih (Dingin)',
    price: 8000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80',
    description: 'Es susu Dancow putih dingin lezat & creamy.',
    is_popular: false,
  },
  {
    id: 37,
    category_id: 'minuman-susu-coklat',
    name: 'Dancow Coklat (Panas)',
    price: 7000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80',
    description: 'Susu bubuk Dancow FortiGro coklat seduh panas nikmat.',
    is_popular: false,
  },
  {
    id: 38,
    category_id: 'minuman-susu-coklat',
    name: 'Dancow Coklat (Dingin)',
    price: 8000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=600&q=80',
    description: 'Es susu Dancow coklat dingin kesukaan semua kalangan.',
    is_popular: true,
  },
  {
    id: 39,
    category_id: 'minuman-susu-coklat',
    name: 'Milo (Panas)',
    price: 7000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
    description: 'Minuman coklat malt Milo seduh panas kaya energi.',
    is_popular: false,
  },
  {
    id: 40,
    category_id: 'minuman-susu-coklat',
    name: 'Milo (Dingin)',
    price: 8000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80',
    description: 'Es Milo dingin manis gurih coklat malt pekat.',
    is_popular: true,
  },
  {
    id: 41,
    category_id: 'minuman-susu-coklat',
    name: 'Drink Beng-Beng (Panas)',
    price: 6000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80',
    description: 'Drink Beng-Beng coklat hangat berpadu malt & krimer lezat.',
    is_popular: false,
  },
  {
    id: 42,
    category_id: 'minuman-susu-coklat',
    name: 'Drink Beng-Beng (Dingin)',
    price: 7000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=600&q=80',
    description: 'Es Drink Beng-Beng dingin manis nikmat disukai saat santai.',
    is_popular: false,
  },
  {
    id: 43,
    category_id: 'minuman-susu-coklat',
    name: 'Chocolatos All Varian (Panas)',
    price: 6000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
    description: 'Chocolatos Drink seduh panas dengan rasa coklat Italia pekat.',
    is_popular: false,
  },
  {
    id: 44,
    category_id: 'minuman-susu-coklat',
    name: 'Chocolatos All Varian (Dingin)',
    price: 7000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80',
    description: 'Es Chocolatos Drink dingin manis pekat menyegarkan.',
    is_popular: false,
  },

  // 5. Minuman Teh & Lainnya
  {
    id: 45,
    category_id: 'minuman-teh-lainnya',
    name: 'Teh Manis (Panas)',
    price: 4000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    description: 'Teh melati seduh panas manis harum khas angkringan.',
    is_popular: false,
  },
  {
    id: 46,
    category_id: 'minuman-teh-lainnya',
    name: 'Teh Manis (Dingin)',
    price: 4000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
    description: 'Es teh manis segar dingin pelepas dahaga nomor satu.',
    is_popular: true,
  },
  {
    id: 47,
    category_id: 'minuman-teh-lainnya',
    name: 'Teh Tawar (Panas)',
    price: 3000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    description: 'Teh tawar seduh hangat harum melati tanpa gula.',
    is_popular: false,
  },
  {
    id: 48,
    category_id: 'minuman-teh-lainnya',
    name: 'Teh Tawar (Dingin)',
    price: 4000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
    description: 'Es teh tawar dingin segar tanpa pemanis.',
    is_popular: false,
  },
  {
    id: 49,
    category_id: 'minuman-teh-lainnya',
    name: 'Bonteh All Varian (Panas)',
    price: 6000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    description: 'Bonteh seduh panas dengan racikan rempah wangi.',
    is_popular: false,
  },
  {
    id: 50,
    category_id: 'minuman-teh-lainnya',
    name: 'Bonteh All Varian (Dingin)',
    price: 7000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
    description: 'Es Bonteh aneka varian rasa dingin menyegarkan.',
    is_popular: false,
  },
  {
    id: 51,
    category_id: 'minuman-teh-lainnya',
    name: 'Jahe Susu (Panas)',
    price: 5000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    description: 'Wedang jahe murni dipadu susu kental manis hangat pelepas lelah.',
    is_popular: true,
  },
  {
    id: 52,
    category_id: 'minuman-teh-lainnya',
    name: 'Nutrisari (Dingin)',
    price: 5000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
    description: 'Es Nutrisari aneka rasa jeruk segar dingin kaya vitamin C.',
    is_popular: false,
  },
  {
    id: 53,
    category_id: 'minuman-teh-lainnya',
    name: 'Klepon (Panas)',
    price: 6000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
    description: 'Minuman seduh panas rasa kue klepon pandan & gula aren wangi gurih.',
    is_popular: false,
  },
  {
    id: 54,
    category_id: 'minuman-teh-lainnya',
    name: 'Klepon (Dingin)',
    price: 7000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80',
    description: 'Es rasa klepon dingin manis wangi pandan lembut.',
    is_popular: false,
  },
  {
    id: 55,
    category_id: 'minuman-teh-lainnya',
    name: 'Air Es',
    price: 2000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80',
    description: 'Air mineral dingin dengan es batu kristal bersih.',
    is_popular: false,
  },
];

// ─── Orders store ──────────────────────────────────────────────
export const orders = [];

// ─── App Settings (QRIS & Store Configurations) ────────────────
export const settings = {
  qris_image: null,
  qris_merchant_name: "Angkringan Blue'sukan Kopi",
};

export function getSettings() {
  return { ...settings };
}

export function updateSettings(partial = {}) {
  if (partial.qris_image !== undefined) {
    settings.qris_image = partial.qris_image;
  }
  if (partial.qris_merchant_name !== undefined) {
    settings.qris_merchant_name = partial.qris_merchant_name;
  }
  return { ...settings };
}

let nextOrderId = 1;

/**
 * Generate unique order code: #BC-101, #BC-102, ...
 */
export function generateOrderCode() {
  const code = `#BC-${String(100 + nextOrderId).padStart(3, '0')}`;
  nextOrderId++;
  return code;
}

/**
 * Find a menu item by its ID
 */
export function findMenuById(id) {
  return menus.find((m) => m.id === id) || null;
}

/**
 * Find an order by its unique order_code string
 */
export function findOrderByCode(orderCode) {
  return orders.find((o) => o.order_code === orderCode) || null;
}

/**
 * Find an order by its numeric ID
 */
export function findOrderById(id) {
  return orders.find((o) => o.id === id) || null;
}

/**
 * Auto-prune orders to keep memory footprint low in in-memory mode.
 * - Removes completed or cancelled orders older than 24 hours.
 * - Retains at most the 200 most recent orders in memory.
 * - Mutates array in-place to preserve external references.
 */
export function pruneOrders() {
  if (!orders || orders.length === 0) return 0;

  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const initialCount = orders.length;

  // Filter out completed or cancelled orders older than 24h
  const filtered = orders.filter((o) => {
    if (o.status === 'completed' || o.status === 'cancelled') {
      const orderTime = new Date(o.created_at || Date.now()).getTime();
      if (now - orderTime > ONE_DAY_MS) {
        return false;
      }
    }
    return true;
  });

  // Retain at most 200 newest orders
  if (filtered.length > 200) {
    filtered.splice(200);
  }

  // Mutate in-place
  orders.length = 0;
  orders.push(...filtered);

  return initialCount - orders.length;
}

// Background auto-pruning every 1 hour (unref'd so it does not block Node.js exit)
if (typeof setInterval !== 'undefined') {
  const pruneTimer = setInterval(() => {
    try {
      pruneOrders();
    } catch (err) {
      console.error('Error during auto-pruning orders:', err);
    }
  }, 60 * 60 * 1000);

  if (pruneTimer.unref) {
    pruneTimer.unref();
  }
}
