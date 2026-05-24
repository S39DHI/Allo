import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const warehouseId = url.searchParams.get('warehouseId') ?? undefined;
  const search = url.searchParams.get('search')?.trim();

  const products = await prisma.product.findMany({
    where: {
      AND: [
        search
          ? {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            }
          : {},
        warehouseId
          ? {
              inventories: {
                some: {
                  warehouseId,
                },
              },
            }
          : {},
      ],
    },
    include: {
      inventories: {
        include: {
          warehouse: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  const payload = products.map((product) => ({
    id: product.id,
    name: product.name,
    createdAt: product.createdAt.toISOString(),
    inventories: product.inventories.map((inventory) => ({
      warehouseId: inventory.warehouseId,
      warehouseName: inventory.warehouse.name,
      totalUnits: inventory.totalUnits,
      reservedUnits: inventory.reservedUnits,
      availableUnits: inventory.totalUnits - inventory.reservedUnits,
    })),
  }));

  return NextResponse.json(payload);
}
