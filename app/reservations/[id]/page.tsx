import ReservationDetailsClient from '@/components/reservation-details-client';

interface ReservationPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function ReservationPage({ params }: ReservationPageProps) {
  const { id } = await params;
  return <ReservationDetailsClient reservationId={id} />;
}
