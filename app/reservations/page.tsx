'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReservationListItem {
  id: string;
  productName: string;
  warehouseName: string;
  quantity: number;
  status: string;
  expiresAt: string;
  createdAt: string;
}

const formatCountdown = (seconds: number) => {
  if (seconds <= 0) return 'Expired';
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<ReservationListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  const fetchReservations = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/reservations', { cache: 'no-store' });
      if (!response.ok) {
        setError('Unable to load reservations.');
        return;
      }
      const data = (await response.json()) as ReservationListItem[];
      setReservations(data);
    } catch {
      setError('Unable to load reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const reservationRows = useMemo(
    () =>
      reservations.map((reservation) => {
        const secondsLeft = Math.max(0, Math.floor((new Date(reservation.expiresAt).getTime() - now) / 1000));
        return {
          ...reservation,
          secondsLeft,
        };
      }),
    [reservations, now]
  );

  return (
    <main className="min-h-screen px-6 py-10 sm:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Reservations</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Your reservations</h1>
          </div>
          <Button variant="secondary" onClick={fetchReservations} disabled={loading}>
            Refresh
          </Button>
        </div>

        {error ? (
          <Card className="border-red-200 bg-red-50 text-red-900">{error}</Card>
        ) : null}

        <div className="space-y-4">
          {reservationRows.map((reservation) => (
            <Link key={reservation.id} href={`/reservations/${reservation.id}`} className="block group">
              <Card className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_1fr] md:items-center transition hover:border-slate-300 hover:shadow-lg">
                <div>
                  <p className="text-base font-semibold text-slate-900">{reservation.productName}</p>
                  <p className="text-sm text-slate-500">{reservation.warehouseName}</p>
                  <p className="text-xs text-slate-500">Created {new Date(reservation.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Quantity</p>
                  <p className="text-lg font-semibold text-slate-950">{reservation.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge variant={reservation.status === 'CONFIRMED' ? 'success' : reservation.status === 'RELEASED' ? 'danger' : 'warning'}>
                    {reservation.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">{reservation.status === 'PENDING' ? 'Expires in' : 'Expires'}</p>
                  <p className="text-lg font-semibold text-slate-950">
                    {reservation.status === 'PENDING' ? formatCountdown(reservation.secondsLeft) : new Date(reservation.expiresAt).toLocaleString()}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
