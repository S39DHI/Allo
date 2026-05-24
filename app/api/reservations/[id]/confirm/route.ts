import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { reservationIdSchema } from '@/lib/validators';
import { withIdempotency } from '@/lib/idempotency';

interface ReservationRow {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: string;
  expiresAt: Date;
}

interface InventoryRow {
  id: string;
}

export async function POST(request: Request, context: any) {
  const params = await context.params;
  const reservationId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  if (!reservationId) {
    return NextResponse.json({ error: 'Reservation id is required' }, { status: 400 });
  }

  const parseResult = reservationIdSchema.safeParse({ id: reservationId });
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Reservation id must be a uuid' }, { status: 400 });
  }

  return withIdempotency(request, `POST:/api/reservations/${reservationId}/confirm`, async () => {
    try {
      const updated = await prisma.$transaction(async (tx) => {
        const [reservation] = await tx.$queryRaw<ReservationRow[]>`
          SELECT * FROM "Reservation"
          WHERE "id" = ${reservationId}
          FOR UPDATE
        `;

        if (!reservation) {
          throw new Error('reservation:not-found');
        }

        if (reservation.status !== 'PENDING') {
          throw new Error('reservation:invalid-status');
        }

        if (new Date(reservation.expiresAt) < new Date()) {
          throw new Error('reservation:expired');
        }

        const [inventory] = await tx.$queryRaw<InventoryRow[]>`
          SELECT * FROM "Inventory"
          WHERE "productId" = ${reservation.productId}
            AND "warehouseId" = ${reservation.warehouseId}
          FOR UPDATE
        `;

        if (!inventory) {
          throw new Error('inventory:not-found');
        }

        const [reservedRow] = await tx.$queryRaw<{ reserved: string }[]>`
          SELECT COALESCE(SUM("quantity")::text, '0') AS "reserved"
          FROM "Reservation"
          WHERE "productId" = ${reservation.productId}
            AND "warehouseId" = ${reservation.warehouseId}
            AND status = 'PENDING'
            AND "expiresAt" > NOW()
            AND "id" != ${reservation.id}
        `;

        const currentReserved = Number(reservedRow?.reserved ?? '0');

        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            totalUnits: { decrement: reservation.quantity },
            reservedUnits: currentReserved,
          },
        });

        const confirmed = await tx.reservation.update({
          where: { id: reservation.id },
          data: { status: 'CONFIRMED' },
        });

        return confirmed;
      });

      return { status: 200, body: updated };
    } catch (error) {
      if (error instanceof Error && error.message === 'reservation:not-found') {
        return { status: 404, body: { error: 'Reservation not found' } };
      }
      if (error instanceof Error && error.message === 'reservation:expired') {
        return { status: 410, body: { error: 'Reservation has expired' } };
      }
      if (error instanceof Error && error.message === 'reservation:invalid-status') {
        return { status: 400, body: { error: 'Reservation cannot be confirmed' } };
      }
      return { status: 500, body: { error: 'Unable to confirm reservation' } };
    }
  });
}
