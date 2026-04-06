const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const product = await prisma.product.update({
      where: { id: 'cmnn8xs3h000nwpbwf1ld0ik0' },
      data: { stock: 1 }
    });
    console.log('✅ Stock updated successfully!');
    console.log(`Product: ${product.name}`);
    console.log(`New stock: ${product.stock}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();