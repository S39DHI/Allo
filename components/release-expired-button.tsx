'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function ReleaseExpiredButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const runCleanup = async () => {
    setMessage(null);
    setIsLoading(true);
    try {
      const response = await fetch('/api/jobs/release-expired', { method: 'POST' });
      const body = await response.json();
      if (!response.ok) {
        setMessage(body.error ?? 'Unable to run cleanup');
        return;
      }
      setMessage(`Released ${body.released} expired reservation(s).`);
    } catch (error) {
      setMessage('Unable to run cleanup.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-900">Maintenance actions</p>
          <p className="text-xs text-slate-500">Hidden by default for testing purposes.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Options
          <span className={`inline-block transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
            ▼
          </span>
        </button>
      </div>

      {isOpen ? (
        <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">Run the expiry cleanup endpoint to release timed-out holds.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={runCleanup} disabled={isLoading}>
              {isLoading ? 'Running...' : 'Run expiry cleanup'}
            </Button>
            {message ? <p className="text-sm text-slate-700">{message}</p> : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
