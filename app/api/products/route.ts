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
      // Compute reserved units from currently pending, non-expired reservations
      // so expired reservations do not continue to reduce availability.
      reservedUnits: 0,
      availableUnits: inventory.totalUnits,
    })),
  }));

  // Load currently active pending reservations and sum quantities by product+warehouse
  const reservedRows = await prisma.$queryRaw<{ productId: string; warehouseId: string; reserved: string }[]>`
    SELECT "productId", "warehouseId", COALESCE(SUM("quantity")::text, '0') AS "reserved"
    FROM "Reservation"
    WHERE status = 'PENDING' AND "expiresAt" > NOW()
    GROUP BY "productId", "warehouseId"
  `;

  const reservedMap = new Map<string, number>();
  for (const r of reservedRows) {
    reservedMap.set(`${r.productId}-${r.warehouseId}`, Number(r.reserved));
  }

  // Apply computed reserved totals to payload
  for (const p of payload) {
    for (const inv of p.inventories) {
      const key = `${p.id}-${inv.warehouseId}`;
      const reserved = reservedMap.get(key) ?? 0;
      inv.reservedUnits = reserved;
      inv.availableUnits = Math.max(0, inv.totalUnits - reserved);
    }
  }

  return NextResponse.json(payload);
}
