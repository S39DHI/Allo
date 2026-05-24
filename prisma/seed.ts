import { PrismaClient, ReservationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  const warehouses = await prisma.warehouse.createMany({
    data: [
      { name: 'Dallas Fulfillment' },
      { name: 'Seattle Distribution' },
      { name: 'Chicago Hub' },
    ],
  });

  const products = await prisma.product.createMany({
    data: [
      { name: 'Allo Cloud Backpack' },
      { name: 'Everyday Travel Jacket' },
      { name: 'Modular Coffee Kit' },
      { name: 'Slim Power Bank' },
      { name: 'Weekend Packing Cube' },
    ],
  });

  const [dallas, seattle, chicago] = await prisma.warehouse.findMany({ orderBy: { name: 'asc' } });
  const productList = await prisma.product.findMany({ orderBy: { name: 'asc' } });

  const inventoryData = [
    { productId: productList[0].id, warehouseId: dallas.id, totalUnits: 32, reservedUnits: 2 },
    { productId: productList[0].id, warehouseId: seattle.id, totalUnits: 18, reservedUnits: 0 },
    { productId: productList[1].id, warehouseId: dallas.id, totalUnits: 14, reservedUnits: 1 },
    { productId: productList[1].id, warehouseId: chicago.id, totalUnits: 24, reservedUnits: 3 },
    { productId: productList[2].id, warehouseId: seattle.id, totalUnits: 40, reservedUnits: 5 },
    { productId: productList[2].id, warehouseId: chicago.id, totalUnits: 28, reservedUnits: 0 },
    { productId: productList[3].id, warehouseId: dallas.id, totalUnits: 12, reservedUnits: 0 },
    { productId: productList[3].id, warehouseId: seattle.id, totalUnits: 20, reservedUnits: 4 },
    { productId: productList[4].id, warehouseId: dallas.id, totalUnits: 26, reservedUnits: 5 },
    { productId: productList[4].id, warehouseId: chicago.id, totalUnits: 22, reservedUnits: 2 },
  ];

  await prisma.inventory.createMany({ data: inventoryData });

  const reservations = [
    {
      productId: productList[0].id,
      warehouseId: dallas.id,
      quantity: 2,
      status: ReservationStatus.PENDING,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
    {
      productId: productList[1].id,
      warehouseId: dallas.id,
      quantity: 1,
      status: ReservationStatus.PENDING,
      expiresAt: new Date(Date.now() + 7 * 60 * 1000),
    },
    {
      productId: productList[1].id,
      warehouseId: chicago.id,
      quantity: 3,
      status: ReservationStatus.PENDING,
      expiresAt: new Date(Date.now() + 8 * 60 * 1000),
    },
    {
      productId: productList[2].id,
      warehouseId: seattle.id,
      quantity: 5,
      status: ReservationStatus.PENDING,
      expiresAt: new Date(Date.now() + 9 * 60 * 1000),
    },
    {
      productId: productList[3].id,
      warehouseId: seattle.id,
      quantity: 4,
      status: ReservationStatus.PENDING,
      expiresAt: new Date(Date.now() + 6 * 60 * 1000),
    },
    {
      productId: productList[4].id,
      warehouseId: dallas.id,
      quantity: 5,
      status: ReservationStatus.PENDING,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
    {
      productId: productList[4].id,
      warehouseId: chicago.id,
      quantity: 2,
      status: ReservationStatus.PENDING,
      expiresAt: new Date(Date.now() + 4 * 60 * 1000),
    },
  ];

  await prisma.reservation.createMany({ data: reservations });

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
