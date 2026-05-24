import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { reservationCreateSchema } from '@/lib/validators';
import { withIdempotency } from '@/lib/idempotency';

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

  return withIdempotency(request, 'POST:/api/reservations', async () => {
    try {
      const reservation = await prisma.$transaction(async (tx) => {
        const [inventory] = await tx.$queryRaw<InventoryRow[]>`
          SELECT * FROM "Inventory"
          WHERE "productId" = ${productId}
            AND "warehouseId" = ${warehouseId}
          FOR UPDATE
        `;

        if (!inventory) {
          throw new Error('inventory:not-found');
        }

        const [reservedRow] = await tx.$queryRaw<{ reserved: string }[]>`
          SELECT COALESCE(SUM("quantity")::text, '0') AS "reserved"
          FROM "Reservation"
          WHERE "productId" = ${productId}
            AND "warehouseId" = ${warehouseId}
            AND status = 'PENDING'
            AND "expiresAt" > NOW()
        `;

        const currentReserved = Number(reservedRow?.reserved ?? '0');
        if (inventory.totalUnits - currentReserved < quantity) {
          throw new Error('inventory:insufficient');
        }

        await tx.inventory.update({
          where: { id: inventory.id },
          data: { reservedUnits: currentReserved + quantity },
        });

        return tx.reservation.create({
          data: {
            productId,
            warehouseId,
            quantity,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          },
        });
      });

      return { status: 201, body: reservation };
    } catch (error) {
      if (error instanceof Error && error.message === 'inventory:insufficient') {
        return { status: 409, body: { error: 'Insufficient stock available' } };
      }

      if (error instanceof Error && error.message === 'inventory:not-found') {
        return { status: 404, body: { error: 'Product inventory not found' } };
      }

      return { status: 500, body: { error: 'Could not create reservation' } };
    }
  });
}
