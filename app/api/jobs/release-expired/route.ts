import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface ExpiredReservation {
  id: string;
  quantity: number;
  productId: string;
  warehouseId: string;
}

export async function POST() {
  const updated = await prisma.$transaction(async (tx) => {
    const expiredReservations = await tx.$queryRaw<ExpiredReservation[]>`
      SELECT * FROM "Reservation"
      WHERE status = 'PENDING'
        AND "expiresAt" < NOW()
      FOR UPDATE SKIP LOCKED
    `;

    for (const reservation of expiredReservations) {
      await tx.inventory.updateMany({
        where: {
          productId: reservation.productId,
          warehouseId: reservation.warehouseId,
        },
        data: {
          reservedUnits: { decrement: reservation.quantity },
        },
      });

      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: 'RELEASED' },
      });
    }

    return expiredReservations.length;
  });

  return NextResponse.json({ released: updated });
}
