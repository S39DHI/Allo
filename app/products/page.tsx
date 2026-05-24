'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

interface WarehouseView {
  id: string;
  name: string;
}

interface ProductView {
  id: string;
  name: string;
  inventories: InventoryView[];
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentWarehouseId = searchParams?.get('warehouseId') ?? '';
  const currentSearch = searchParams?.get('search') ?? '';
  const [products, setProducts] = useState<ProductView[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseView[]>([]);
  const [quantityByKey, setQuantityByKey] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(currentSearch);
  const [selectedWarehouse, setSelectedWarehouse] = useState(currentWarehouseId);

  const buildQuery = (warehouseId: string, searchValue: string) => {
    const params = new URLSearchParams();
    if (warehouseId) params.set('warehouseId', warehouseId);
    if (searchValue.trim()) params.set('search', searchValue.trim());
    return params.toString() ? `?${params.toString()}` : '';
  };

  const fetchProducts = async (warehouseId = currentWarehouseId, searchValue = currentSearch) => {
    setError(null);
    setLoading(true);
    try {
      const query = buildQuery(warehouseId, searchValue);
      const response = await fetch(`/api/products${query}`, { cache: 'no-store' });
      if (!response.ok) {
        setError('Unable to load products.');
        return;
      }
      const data = (await response.json()) as ProductView[];
      setProducts(data);
    } catch {
      setError('Unable to load products.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses', { cache: 'no-store' });
      if (!response.ok) return;
      const data = (await response.json()) as WarehouseView[];
      setWarehouses(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setSelectedWarehouse(currentWarehouseId);
    setSearch(currentSearch);
    fetchProducts(currentWarehouseId, currentSearch);
  }, [currentWarehouseId, currentSearch]);

  useEffect(() => {
    fetchWarehouses();
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

  const applyFilters = (warehouseId: string, searchValue: string) => {
    const query = buildQuery(warehouseId, searchValue);
    router.push(`/products${query}`);
  };

  return (
    <main className="min-h-screen px-6 py-10 sm:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Product inventory</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Reserve stock safely</h1>
          </div>
          <Button variant="secondary" onClick={() => fetchProducts(selectedWarehouse, search)} disabled={loading}>
            Refresh stock
          </Button>
        </div>

        <Card className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr] items-end">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500" htmlFor="warehouse-filter">
              Warehouse filter
            </label>
            <select
              id="warehouse-filter"
              value={selectedWarehouse}
              onChange={(event) => setSelectedWarehouse(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
            >
              <option value="">All warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500" htmlFor="product-search">
              Search products
            </label>
            <Input
              id="product-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by product name"
            />
          </div>
          <div className="flex items-end gap-3">
            <Button onClick={() => applyFilters(selectedWarehouse, search)} disabled={loading}>
              Apply filters
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedWarehouse('');
                setSearch('');
                applyFilters('', '');
              }}
            >
              Clear filters
            </Button>
          </div>
        </Card>

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
