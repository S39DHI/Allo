import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function CartPage() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <Card className="border-slate-200 bg-slate-50">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Cart overview</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Your cart</h1>
            <p className="text-slate-700">
              This app uses reservations instead of a traditional cart. You can reserve stock from the Products page and then confirm or release that reservation on the reservation details page.
            </p>
            <Link href="/products">
              <Button>Browse products</Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
