'use client';

import { useEffect, useState } from 'react';
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

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<ReservationListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          {reservations.map((reservation) => (
            <Card key={reservation.id} className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_1fr] md:items-center">
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
              <div className="flex items-center gap-2">
                <Link href={`/reservations/${reservation.id}`} className="text-sm font-medium text-slate-700 hover:text-slate-950">
                  View details
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
