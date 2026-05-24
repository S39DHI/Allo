import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ReleaseExpiredButton } from '@/components/release-expired-button';

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <Card className="border-slate-200 bg-slate-50">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Allo Take-Home Exercise</p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Inventory reservation system</h1>
            <p className="max-w-2xl text-slate-700">
              Reserve stock from multiple warehouses, confirm purchases before expiry, and release expired holds automatically.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products">
                <Button>View products</Button>
              </Link>
            </div>
          </div>
        </Card>
        <ReleaseExpiredButton />
          </div>
        </Card>
      </div>
    </main>
  );
}
