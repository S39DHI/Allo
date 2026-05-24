# Allo Inventory Reservation System

A Next.js 15 App Router application implementing an inventory reservation workflow with PostgreSQL, Prisma, Tailwind CSS, shadcn/ui-inspired components, and Zod validation.

## Features

- Product and warehouse inventory model
- Reservation lifecycle: PENDING, CONFIRMED, RELEASED
- Concurrency-safe reservation creation using PostgreSQL `SELECT FOR UPDATE`
- Expiry-based release of expired reservations
- Frontend product list and live reservation page
- API-friendly serverless route handlers

## Local setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Generate Prisma client and apply migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Seed the database:

```bash
npm run prisma:seed
```

5. Start development server:

```bash
npm run dev
```

## API routes

- `GET /api/products` — products with available stock per warehouse
- `GET /api/warehouses` — warehouse list
- `POST /api/reservations` — reserve inventory
- `GET /api/reservations/:id` — reservation details
- `POST /api/reservations/:id/confirm` — confirm reservation
- `POST /api/reservations/:id/release` — release reservation
- `POST /api/jobs/release-expired` — release expired pending reservations

## Expiry mechanism

Expired `PENDING` reservations are released by the `POST /api/jobs/release-expired` cron endpoint. In production, run this endpoint on a scheduled Vercel cron job or a background worker every minute.

## Idempotency

The `POST /api/reservations` and `POST /api/reservations/:id/confirm` endpoints support idempotent retries when the client includes an `Idempotency-Key` header. Responses are cached in Redis so retrying with the same key returns the original result without repeating the side effect.

## Trade-offs and notes

- The core reservation flow is made race-condition safe using `SELECT FOR UPDATE` in PostgreSQL transactions.
- A simple cron/cleanup endpoint is used instead of a dedicated queue worker for expiry.
- The frontend is intentionally lightweight and uses client-side fetch state for immediate updates.
- Redis is used for idempotency state; if Redis is unavailable, requests still work normally but retries are not deduplicated.
