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

interface ReservationDetailsClientProps {
  reservationId: string;
}

const formatCountdown = (seconds: number) => {
  if (seconds <= 0) return 'Expired';
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

export default function ReservationDetailsClient({ reservationId }: ReservationDetailsClientProps) {
  const router = useRouter();
  const [reservation, setReservation] = useState<ReservationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);

  const fetchReservation = async () => {
    setError(null);
    const response = await fetch(`/api/reservations/${reservationId}`, { cache: 'no-store' });
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
  }, [reservationId]);

  const handleAction = async (action: 'confirm' | 'release') => {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reservations/${reservationId}/${action}`, {
        method: 'POST',
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? 'Could not complete action.');
        return;
      }
      setSuccessMessage(
        action === 'confirm'
          ? 'Purchase confirmed. Inventory has been updated.'
          : 'Reservation canceled. Inventory was released.'
      );
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

        {error ? (
          <Card className="border-red-200 bg-red-50 text-red-900">{error}</Card>
        ) : null}

        {successMessage ? (
          <Card className="border-emerald-200 bg-emerald-50 text-emerald-900">{successMessage}</Card>
        ) : null}

        {reservation ? (
          <Card className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Reservation ID</p>
                <p className="text-lg font-semibold text-slate-950 break-all">{reservation.id}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Product</p>
                <p className="text-lg font-semibold text-slate-950">{reservation.productName}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Warehouse</p>
                <p className="text-lg font-semibold text-slate-950">{reservation.warehouseName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Quantity</p>
                <p className="text-lg font-semibold text-slate-950">{reservation.quantity}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <Badge variant={statusVariant}>{reservation.status}</Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">Expires in</p>
                <p className="text-3xl font-semibold text-slate-950">{formatCountdown(countdown)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => handleAction('confirm')} disabled={isSubmitting || reservation.status !== 'PENDING' || countdown <= 0}>
                Confirm purchase
              </Button>
              <Button variant="destructive" onClick={() => handleAction('release')} disabled={isSubmitting || reservation.status !== 'PENDING'}>
                Cancel reservation
              </Button>
            </div>

            {reservation.status === 'CONFIRMED' ? (
              <Card className="border-green-200 bg-green-50 text-green-900">
                <div className="flex flex-col gap-3">
                  <p className="font-medium">Purchase complete.</p>
                  <p>Your reservation is confirmed and stock has been updated.</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => router.push('/products')}>
                      Continue shopping
                    </Button>
                    <Button variant="secondary" onClick={() => router.push('/reservations')}>
                      View reservations
                    </Button>
                  </div>
                </div>
              </Card>
            ) : reservation.status === 'RELEASED' ? (
              <Card className="border-slate-200 bg-slate-50 text-slate-900">
                <p>Reservation canceled. The reserved quantity has been released back into stock.</p>
              </Card>
            ) : null}
          </Card>
        ) : (
          <Card className="border-slate-200 bg-slate-50">Loading reservation…</Card>
        )}
      </div>
    </main>
  );
}
