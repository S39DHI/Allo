'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface InventoryView {
  warehouseId: string;
  warehouseName: string;
  totalUnits: number;
  reservedUnits: number;
  availableUnits: number;
}

interface ProductView {
  id: string;
  name: string;
  inventories: InventoryView[];
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductView[]>([]);
  const [quantityByKey, setQuantityByKey] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    setError(null);
    const response = await fetch('/api/products', { cache: 'no-store' });
    if (!response.ok) {
      setError('Unable to load products.');
      return;
    }
    const data = (await response.json()) as ProductView[];
    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const reserve = async (productId: string, warehouseId: string) => {
    setLoading(true);
    setError(null);
    const key = `${productId}-${warehouseId}`;
    const quantity = Number(quantityByKey[key] ?? 1);

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, warehouseId, quantity }),
      });

      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? 'Unable to reserve stock');
        return;
      }

      router.push(`/reservations/${body.id}`);
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo(
    () =>
      products.flatMap((product) =>
        product.inventories.map((inventory) => ({
          product,
          inventory,
          key: `${product.id}-${inventory.warehouseId}`,
        }))
      ),
    [products]
  );

  return (
    <main className="min-h-screen px-6 py-10 sm:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Product inventory</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Reserve stock safely</h1>
          </div>
          <Button variant="secondary" onClick={fetchProducts} disabled={loading}>
            Refresh stock
          </Button>
        </div>

        {error ? (
          <Card className="border-red-200 bg-red-50 text-red-900">{error}</Card>
        ) : null}

        <div className="space-y-4">
          {rows.map(({ product, inventory, key }) => (
            <Card key={key} className="grid gap-4 md:grid-cols-[1.8fr_1fr_1fr_1fr] md:items-center">
              <div>
                <p className="text-base font-semibold text-slate-900">{product.name}</p>
                <p className="text-sm text-slate-500">{inventory.warehouseName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">Available</p>
                <p className="text-lg font-semibold text-slate-950">{inventory.availableUnits}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">Reserved</p>
                <p className="text-lg font-semibold text-slate-950">{inventory.reservedUnits}</p>
              </div>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500" htmlFor={`${key}-quantity`}>
                    Quantity
                  </label>
                  <Input
                    id={`${key}-quantity`}
                    type="number"
                    min={1}
                    value={quantityByKey[key] ?? '1'}
                    onChange={(event) => setQuantityByKey((current) => ({ ...current, [key]: event.target.value }))}
                  />
                </div>
                <Button onClick={() => reserve(product.id, inventory.warehouseId)} disabled={loading || inventory.availableUnits < 1}>
                  Reserve
                </Button>
                <Badge variant={inventory.availableUnits > 0 ? 'success' : 'danger'}>
                  {inventory.availableUnits > 0 ? 'In stock' : 'Out of stock'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
