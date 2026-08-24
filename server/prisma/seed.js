import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INITIAL_MENUS = [
  {
    id: 1,
    category_id: 'coffee',
    name: 'Kopi Susu Gula Aren',
    price: 22000,
    stock: 15,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
    description: 'Espresso double shot dengan susu segar creamy dan sirup aren murni asli.',
    is_popular: true,
  },
  {
    id: 2,
    category_id: 'coffee',
    name: 'Americano Ice',
    price: 18000,
    stock: 25,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    description: 'Espresso segar dengan air dingin dan es batu kristal, rasa bersih & menyegarkan.',
    is_popular: false,
  },
  {
    id: 3,
    category_id: 'coffee',
    name: 'Caramel Macchiato',
    price: 28000,
    stock: 4,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80',
    description: 'Steamed milk dengan sentuhan vanilla, espresso, dan saus karamel legit.',
    is_popular: true,
  },
  {
    id: 4,
    category_id: 'coffee',
    name: 'Cold Brew Oat Milk',
    price: 32000,
    stock: 0,
    is_available: false,
    image_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80',
    description: 'Cold brew 16 jam dipadu dengan oat milk vegan yang lembut dan harum.',
    is_popular: false,
  },
  {
    id: 5,
    category_id: 'non-coffee',
    name: 'Matcha Latte Uji',
    price: 26000,
    stock: 10,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
    description: 'Bubuk matcha murni asal Kyoto dengan susu segar pilihan, manis pas dan harum.',
    is_popular: true,
  },
  {
    id: 6,
    category_id: 'non-coffee',
    name: 'Artisan Chocolate Berry',
    price: 25000,
    stock: 8,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80',
    description: 'Cokelat dark Belgia kental dipadu puree strawberry segar dan susu creamy.',
    is_popular: false,
  },
  {
    id: 7,
    category_id: 'non-coffee',
    name: 'Lychee Yakult Breeze',
    price: 23000,
    stock: 12,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    description: 'Perpaduan Yakult fermentasi, sirup leci, biji selasih, dan buah leci utuh.',
    is_popular: false,
  },
  {
    id: 8,
    category_id: 'snacks',
    name: 'Crispy Truffle Fries',
    price: 24000,
    stock: 14,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
    description: 'Kentang goreng renyah dengan minyak truffle aromatik, keju parmesan, dan saus cocol.',
    is_popular: true,
  },
  {
    id: 9,
    category_id: 'snacks',
    name: 'Pisang Goreng Wijen Karamel',
    price: 20000,
    stock: 6,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
    description: 'Pisang kepok manis berbalut tepung renyah, taburan biji wijen, dan cocolan gula merah.',
    is_popular: false,
  },
  {
    id: 10,
    category_id: 'snacks',
    name: 'Croissant Butter Paris',
    price: 22000,
    stock: 0,
    is_available: false,
    image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
    description: 'Pastry khas Perancis berlapis renyah dengan butter premium aroma wangi.',
    is_popular: false,
  },
  {
    id: 11,
    category_id: 'food',
    name: 'Nasi Goreng Spesial Bantu',
    price: 35000,
    stock: 9,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
    description: 'Nasi goreng bumbu rempah khas, suwiran ayam, telur mata sapi, kerupuk, dan acar segar.',
    is_popular: true,
  },
  {
    id: 12,
    category_id: 'food',
    name: 'Spaghetti Aglio Olio Smoked Beef',
    price: 34000,
    stock: 7,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
    description: 'Pasta aldente ditumis dengan minyak zaitun, bawang putih, cabai kering, dan smoked beef gurih.',
    is_popular: false,
  },
];

async function main() {
  console.log('🌱 Starting Prisma database seeding...');

  for (const menu of INITIAL_MENUS) {
    await prisma.menu.upsert({
      where: { id: menu.id },
      update: {},
      create: menu,
    });
  }

  console.log(`✅ Seeded ${INITIAL_MENUS.length} cafe menus successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
