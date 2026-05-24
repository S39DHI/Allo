'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReservationDetails {
  id: string;
  productName: string;
  warehouseName: string;
  quantity: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

const formatCountdown = (seconds: number) => {
  if (seconds <= 0) return 'Expired';
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

export default function ReservationPage(props: any) {
  const { params } = props;
  const router = useRouter();
  const [reservation, setReservation] = useState<ReservationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);

  const fetchReservation = async () => {
    setError(null);
    const response = await fetch(`/api/reservations/${params.id}`, { cache: 'no-store' });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? 'Unable to load reservation');
      return;
    }
    const data = (await response.json()) as ReservationDetails;
    setReservation(data);
    setCountdown(Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000)));
  };

  useEffect(() => {
    fetchReservation();
    const interval = setInterval(() => {
      setReservation((current) => {
        if (!current) return current;
        const seconds = Math.max(0, Math.floor((new Date(current.expiresAt).getTime() - Date.now()) / 1000));
        setCountdown(seconds);
        return current;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [params.id]);

  const handleAction = async (action: 'confirm' | 'release') => {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reservations/${params.id}/${action}`, {
        method: 'POST',
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? 'Could not complete action.');
        return;
      }
      await fetchReservation();
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusVariant = useMemo(() => {
    if (!reservation) return 'default';
    if (reservation.status === 'CONFIRMED') return 'success';
    if (reservation.status === 'RELEASED') return 'danger';
    return countdown > 0 ? 'warning' : 'danger';
  }, [reservation, countdown]);

  return (
    <main className="min-h-screen px-6 py-10 sm:px-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Reservation details</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Checkout preview</h1>
          </div>
          <Button variant="secondary" onClick={() => router.push('/products')}>
            Back to products
          </Button>
        </div>

        {error ? <Card className="border-red-200 bg-red-50 text-red-900">{error}</Card> : null}

        {reservation ? (
          <Card className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Product</p>
                <p className="text-lg font-semibold text-slate-950">{reservation.productName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Warehouse</p>
                <p className="text-lg font-semibold text-slate-950">{reservation.warehouseName}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Quantity</p>
                <p className="text-lg font-semibold text-slate-950">{reservation.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <Badge variant={statusVariant}>{reservation.status}</Badge>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Expires in</p>
                <p className="text-3xl font-semibold text-slate-950">{formatCountdown(countdown)}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => handleAction('confirm')} disabled={isSubmitting || reservation.status !== 'PENDING' || countdown <= 0}>
                  Confirm purchase
                </Button>
                <Button variant="destructive" onClick={() => handleAction('release')} disabled={isSubmitting || reservation.status !== 'PENDING'}>
                  Cancel reservation
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="border-slate-200 bg-slate-50">Loading reservation…</Card>
        )}
      </div>
    </main>
  );
}
