import { NextResponse } from 'next/server';
import { releaseExpiredReservations } from '@/lib/cleanup';

export async function POST() {
  const released = await releaseExpiredReservations();
  return NextResponse.json({ released });
}
