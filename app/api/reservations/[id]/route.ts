import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { reservationIdSchema } from '@/lib/validators';

export async function GET(_: Request, context: any) {
  const { params } = context;
  const parseResult = reservationIdSchema.safeParse(params);
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Reservation id must be a uuid' }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: {
      product: true,
      warehouse: true,
    },
  });

  if (!reservation) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  }

  return NextResponse.json({
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
  });
}
