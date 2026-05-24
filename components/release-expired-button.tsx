'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function ReleaseExpiredButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    <Card className="flex flex-col gap-3 border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Run the expiry cleanup endpoint to release timed-out holds.</p>
        <Button variant="secondary" onClick={runCleanup} disabled={isLoading}>
          {isLoading ? 'Running...' : 'Run expiry cleanup'}
        </Button>
      </div>
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </Card>
  );
}
