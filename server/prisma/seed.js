import { PrismaClient } from '@prisma/client';
import { menus as INITIAL_MENUS } from '../src/db.js';
import { DEFAULT_CATEGORIES } from '../src/routes/categories.js';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Prisma database seeding for Angkringan Blue'sukan Kopi...");

  // 1. Seed Categories
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, image: cat.image },
      create: { id: cat.id, name: cat.name, image: cat.image },
    });
  }
  console.log(`✅ Seeded ${DEFAULT_CATEGORIES.length} categories.`);

  // 2. Seed Menus
  for (const menu of INITIAL_MENUS) {
    await prisma.menu.upsert({
      where: { id: menu.id },
      update: {
        category_id: menu.category_id,
        name: menu.name,
        price: menu.price,
        stock: menu.stock,
        is_available: menu.is_available,
        image_url: menu.image_url,
        description: menu.description,
        is_popular: menu.is_popular,
      },
      create: {
        id: menu.id,
        category_id: menu.category_id,
        name: menu.name,
        price: menu.price,
        stock: menu.stock,
        is_available: menu.is_available,
        image_url: menu.image_url,
        description: menu.description,
        is_popular: menu.is_popular,
      },
    });
  }

  console.log(`✅ Seeded ${INITIAL_MENUS.length} authentic Angkringan Blue'sukan Kopi menus successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
