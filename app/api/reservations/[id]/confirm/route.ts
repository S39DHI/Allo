import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { reservationIdSchema } from '@/lib/validators';

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
  totalUnits: number;
  reservedUnits: number;
}

export async function POST(_: Request, context: any) {
  const { params } = context;
  const parseResult = reservationIdSchema.safeParse(params);
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Reservation id must be a uuid' }, { status: 400 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const [reservation] = await tx.$queryRaw<ReservationRow[]>`
        SELECT * FROM "Reservation"
        WHERE "id" = ${params.id}
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

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          totalUnits: { decrement: reservation.quantity },
          reservedUnits: { decrement: reservation.quantity },
        },
      });

      const confirmed = await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: 'CONFIRMED' },
      });

      return confirmed;
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'reservation:not-found') {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }
    if (error instanceof Error && error.message === 'reservation:expired') {
      return NextResponse.json({ error: 'Reservation has expired' }, { status: 410 });
    }
    if (error instanceof Error && error.message === 'reservation:invalid-status') {
      return NextResponse.json({ error: 'Reservation cannot be confirmed' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Unable to confirm reservation' }, { status: 500 });
  }
}
