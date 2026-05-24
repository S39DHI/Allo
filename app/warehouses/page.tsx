'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface WarehouseView {
  id: string;
  name: string;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWarehouses = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/warehouses', { cache: 'no-store' });
      if (!response.ok) {
        setError('Unable to load warehouses.');
        return;
      }
      const data = (await response.json()) as WarehouseView[];
      setWarehouses(data);
    } catch {
      setError('Unable to load warehouses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  return (
    <main className="min-h-screen px-6 py-10 sm:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Warehouse locations</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Warehouse inventory positions</h1>
          </div>
          <Button variant="secondary" onClick={fetchWarehouses} disabled={loading}>
            Refresh
          </Button>
        </div>

        {error ? (
          <Card className="border-red-200 bg-red-50 text-red-900">{error}</Card>
        ) : null}

        <div className="space-y-4">
          {warehouses.map((warehouse) => (
            <Link key={warehouse.id} href={`/products?warehouseId=${warehouse.id}`} className="block">
              <Card className="flex items-center justify-between gap-4 transition hover:-translate-y-0.5 hover:border-slate-300">
                <div>
                  <p className="text-lg font-semibold text-slate-950">{warehouse.name}</p>
                  <p className="text-sm text-slate-500 break-all">{warehouse.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">Warehouse</Badge>
                  <span className="text-sm text-slate-500">View products</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
