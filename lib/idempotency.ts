import { NextResponse } from 'next/server';
import { redis } from './redis';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface StoredResponse {
  status: number;
  body: unknown;
}

function createResponse(result: StoredResponse) {
  return NextResponse.json(result.body, { status: result.status });
}

function parseStoredResponse(value: string | null): StoredResponse | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as StoredResponse;
    return parsed;
  } catch {
    return null;
  }
}

async function restoreOrWait(cacheKey: string) {
  if (!redis) return null;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const stored = await redis.get<string>(cacheKey);
    if (!stored) return null;

    const parsed = parseStoredResponse(stored);
    if (!parsed) return null;

    if (typeof parsed.body === 'object' && parsed.body !== null && (parsed.body as any).__inFlight) {
      await delay(100);
      continue;
    }

    return parsed;
  }

  return null;
}

export async function withIdempotency(
  request: Request,
  resourceKey: string,
  action: () => Promise<StoredResponse>
) {
  if (!redis) {
    return createResponse(await action());
  }

  const idempotencyKey = request.headers.get('Idempotency-Key')?.trim();
  if (!idempotencyKey) {
    return createResponse(await action());
  }

  const cacheKey = `idempotency:${resourceKey}:${idempotencyKey}`;
  const cachedResponse = await restoreOrWait(cacheKey);
  if (cachedResponse) {
    return createResponse(cachedResponse);
  }

  const placeholder = JSON.stringify({ status: 202, body: { __inFlight: true } });
  const claimed = await redis.set(cacheKey, placeholder, { nx: true, ex: 60 });

  if (!claimed) {
    const response = await restoreOrWait(cacheKey);
    if (response) {
      return createResponse(response);
    }
  }

  const result = await action();

  if (result.status >= 500 && result.status < 600) {
    await redis.del(cacheKey);
    return createResponse(result);
  }

  await redis.set(cacheKey, JSON.stringify(result), { ex: 3600 });
  return createResponse(result);
}
