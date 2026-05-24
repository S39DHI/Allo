import Link from 'next/link';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Allo Inventory Reservations',
  description: 'Reserve inventory safely across warehouses.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <div className="mx-auto flex flex-wrap items-center justify-between gap-3 px-6 py-4 sm:px-12">
            <Link href="/" className="text-lg font-semibold tracking-tight text-slate-950">
              Allo Inventory
            </Link>
            <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700">
              <Link href="/products" className="hover:text-slate-950">
                Products
              </Link>
              <Link href="/warehouses" className="hover:text-slate-950">
                Warehouses
              </Link>
              <Link href="/reservations" className="hover:text-slate-950">
                Reservations
              </Link>
              <Link href="/cart" className="hover:text-slate-950">
                Cart
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
