import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { reservationCreateSchema } from '@/lib/validators';

interface InventoryRow {
  id: string;
  totalUnits: number;
  reservedUnits: number;
}

export async function GET() {
  const reservations = await prisma.reservation.findMany({
    include: {
      product: true,
      warehouse: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    reservations.map((reservation) => ({
      id: reservation.id,
      productId: reservation.productId,
      productName: reservation.product.name,
      warehouseId: reservation.warehouseId,
      warehouseName: reservation.warehouse.name,
      quantity: reservation.quantity,
      status: reservation.status,
      expiresAt: reservation.expiresAt.toISOString(),
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),
    }))
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const parseResult = reservationCreateSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid request body', details: parseResult.error.flatten() }, { status: 400 });
  }

  const { productId, warehouseId, quantity } = parseResult.data;

  try {
    const reservation = await prisma.$transaction(async (tx) => {
      const [inventory] = await tx.$queryRaw<InventoryRow[]>`
        UPDATE "Inventory"
        SET "reservedUnits" = "reservedUnits" + ${quantity}
        WHERE "productId" = ${productId}
          AND "warehouseId" = ${warehouseId}
          AND ("totalUnits" - "reservedUnits") >= ${quantity}
        RETURNING *
      `;

      if (!inventory) {
        const [existing] = await tx.$queryRaw<Pick<InventoryRow, 'id'>[]>`
          SELECT "id" FROM "Inventory"
          WHERE "productId" = ${productId}
            AND "warehouseId" = ${warehouseId}
        `;

        if (!existing) {
          throw new Error('inventory:not-found');
        }

        throw new Error('inventory:insufficient');
      }

      const reservation = await tx.reservation.create({
        data: {
          productId,
          warehouseId,
          quantity,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      return reservation;
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'inventory:insufficient') {
      return NextResponse.json({ error: 'Insufficient stock available' }, { status: 409 });
    }

    if (error instanceof Error && error.message === 'inventory:not-found') {
      return NextResponse.json({ error: 'Product inventory not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Could not create reservation' }, { status: 500 });
  }
}
