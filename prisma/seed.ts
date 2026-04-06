import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORY_SEED = [
  'Fruits',
  'Vegetables',
  'Dairy',
  'Bakery',
  'Beverages',
  'Snacks',
  'Frozen',
  'Household',
];

const PRODUCT_SEED: Array<{
  name: string;
  description: string;
  price: string;
  stock: number;
  category: string;
}> = [
  { name: 'Banana', description: 'Fresh yellow bananas', price: '1.20', stock: 40, category: 'Fruits' },
  { name: 'Apple', description: 'Crisp red apples', price: '1.50', stock: 35, category: 'Fruits' },
  { name: 'Orange', description: 'Juicy oranges', price: '1.80', stock: 30, category: 'Fruits' },
  { name: 'Tomato', description: 'Ripe red tomatoes', price: '2.30', stock: 50, category: 'Vegetables' },
  { name: 'Potato', description: 'All-purpose potatoes', price: '1.10', stock: 60, category: 'Vegetables' },
  { name: 'Carrot', description: 'Crunchy carrots', price: '1.70', stock: 45, category: 'Vegetables' },
  { name: 'Milk 1L', description: 'Whole milk 1 liter', price: '2.50', stock: 25, category: 'Dairy' },
  { name: 'Cheddar Cheese', description: 'Aged cheddar block', price: '4.20', stock: 18, category: 'Dairy' },
  { name: 'Yogurt', description: 'Plain greek yogurt', price: '3.00', stock: 22, category: 'Dairy' },
  { name: 'Sourdough Bread', description: 'Artisan sourdough loaf', price: '3.80', stock: 20, category: 'Bakery' },
  { name: 'Croissant', description: 'Butter croissant', price: '2.20', stock: 28, category: 'Bakery' },
  { name: 'Bagel', description: 'Classic bagel', price: '1.90', stock: 26, category: 'Bakery' },
  { name: 'Orange Juice', description: 'No sugar added', price: '3.40', stock: 21, category: 'Beverages' },
  { name: 'Sparkling Water', description: 'Natural sparkling water', price: '1.30', stock: 70, category: 'Beverages' },
  { name: 'Coffee Beans', description: 'Medium roast beans', price: '8.50', stock: 15, category: 'Beverages' },
  { name: 'Potato Chips', description: 'Sea salt chips', price: '2.70', stock: 34, category: 'Snacks' },
  { name: 'Mixed Nuts', description: 'Roasted mixed nuts', price: '5.60', stock: 24, category: 'Snacks' },
  { name: 'Dark Chocolate', description: '70% cocoa', price: '3.10', stock: 27, category: 'Snacks' },
  { name: 'Frozen Peas', description: 'Green peas 500g', price: '2.90', stock: 29, category: 'Frozen' },
  { name: 'Frozen Pizza', description: 'Margherita pizza', price: '6.90', stock: 16, category: 'Frozen' },
  { name: 'Ice Cream', description: 'Vanilla tub 1L', price: '5.20', stock: 14, category: 'Frozen' },
  { name: 'Dish Soap', description: 'Lemon dish soap', price: '3.30', stock: 40, category: 'Household' },
  { name: 'Laundry Detergent', description: 'Liquid detergent 2L', price: '9.90', stock: 12, category: 'Household' },
  { name: 'Paper Towels', description: '6-roll pack', price: '7.40', stock: 19, category: 'Household' },
];

async function main() {
  for (const name of CATEGORY_SEED) {
    await prisma.category.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((cat) => [cat.name, cat.id]));

  for (const product of PRODUCT_SEED) {
    const categoryId = categoryMap.get(product.category);

    if (!categoryId) {
      throw new Error(`Missing category for ${product.name}`);
    }

    await prisma.product.upsert({
      where: { name: product.name },
      create: {
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        categoryId,
      },
      update: {
        description: product.description,
        price: product.price,
        stock: product.stock,
        categoryId,
        deletedAt: null,
      },
    });
  }

  console.log('Seed completed successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
