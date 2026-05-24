# Allo Inventory Reservation System

A focused take-home implementation of the Allo inventory reservation exercise.

This repository implements:
- a data model for products, warehouses, inventory, and reservations
- a concurrency-safe reservation API with correct 409 handling
- a reservation checkout page with a live expiry countdown
- automatic expiry cleanup via a Vercel cron-style background endpoint
- optional idempotency support using Redis and `Idempotency-Key`

## Table of Contents
1. [What this repo implements](#what-this-repo-implements)
2. [How to run locally](#how-to-run-locally)
3. [Reservation expiry in production](#reservation-expiry-in-production)
4. [Idempotency](#idempotency)
5. [Trade-offs and scope](#trade-offs-and-scope)
6. [API summary](#api-summary)
7. [Frontend summary](#frontend-summary)
8. [Deployment notes](#deployment-notes)
9. [Project structure](#project-structure)

## What this repo implements

This project follows the exercise requirements:
- Products and warehouses with inventory per product/warehouse pair
- `totalUnits` and `reservedUnits` tracked separately
- Reservations with `PENDING`, `CONFIRMED`, and `RELEASED` states
- Reservations expire after 10 minutes
- API endpoints:
  - `GET /api/products`
  - `GET /api/warehouses`
  - `POST /api/reservations`
  - `POST /api/reservations/:id/confirm`
  - `POST /api/reservations/:id/release`
- Concurrency-safe reservation creation using PostgreSQL row locks so simultaneous requests for the last available unit result in one success and one 409 conflict
- Frontend product listing and reservation checkout pages
- Visible error handling for 409 and 410 responses

## How to run locally

1. Copy environment variables:
```bash
cp .env.example .env
```
2. Install dependencies:
```bash
npm install
```
3. Set your database and Redis URLs in `.env`:
```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
REDIS_URL="redis://user:pass@host:6379"
```
4. Generate Prisma client and apply migrations:
```bash
npm run prisma:generate
npm run prisma:migrate deploy
```
5. Seed the database:
```bash
npm run prisma:seed
```
6. Start the app:
```bash
npm run dev
```

The app runs at `http://localhost:3000`.

## Reservation expiry in production

Expired reservations are released automatically by the `/api/jobs/release-expired` endpoint.
The intended production behavior is:
- reservations are created with `expiresAt = now + 10 minutes`
- pending reservations become invalid after expiry
- expired reservations are marked `RELEASED`
- inventory reserved by them is returned to available stock

This implementation uses a scheduled cleanup job to enforce that behavior. The cleanup code is implemented in `lib/cleanup.ts`, and the Vercel cron endpoint at `app/api/jobs/release-expired/route.ts` calls it.

The cleanup endpoint:
- scans for `PENDING` reservations where `expiresAt < NOW()`
- decrements `reservedUnits` for the associated inventory
- updates each reservation status to `RELEASED`
- runs inside a transaction so stock remains correct

This helper is also reusable for a background worker if you want to move cleanup out of the HTTP cron path.

The product availability read path also performs lazy cleanup of expired pending reservations by only summing reservations where `expiresAt > NOW()` in `app/api/products/route.ts`.

### Vercel cron job

This repo includes `vercel.json` to describe the cleanup schedule. For demo and hobby usage, the cron is configured to run once per day and call `/api/jobs/release-expired`.

> Note: Vercel hobby accounts only support daily cron jobs. The `*/1 * * * *` schedule requires Vercel Pro or higher.

For this demo repo, the cron schedule is intentionally set to once daily so it is compatible with Vercel Hobby. In a higher-tier deployment, you may choose a more frequent schedule if you need near-real-time expiry cleanup.

Other acceptable approaches include:
- a background worker polling expired reservations and releasing them
- lazy cleanup on read, where reservation reads and stock calculations ignore expired pending reservations

This repo chooses the scheduled HTTP cleanup approach because it is simple, reliable, and fits Vercel’s serverless execution model.

If you prefer not to rely on Vercel cron, use an external scheduler such as GitHub Actions, cron-job.org, or another hosted scheduler service to call `/api/jobs/release-expired` more often.

Sample `vercel.json`:
```json
{
  "version": 2,
  "crons": [
    {
      "path": "/api/jobs/release-expired",
      "schedule": "0 0 * * *"
    }
  ]
}
```

## Idempotency

The reserve and confirm flows support optional idempotency using Redis.
Clients can send `Idempotency-Key` on POST requests. The server stores the response and returns the same result for duplicate retries.

This prevents duplicate reservation or confirmation side effects when a client retries due to network timeout.

## Trade-offs and scope

### Included
- Concurrency-safe reservation creation with one-success/one-409 behavior for simultaneous last-unit requests
- 409 handling for insufficient stock
- 410 handling for expired reservations
- expiry cleanup endpoint for cron execution
- frontend error feedback without silent failures
- basic Redis idempotency support

### Not included
- user authentication / authorization
- payment gateway integration
- advanced multi-warehouse order splitting
- a dedicated worker service instead of HTTP cron

## API summary

### `GET /api/products`
Returns products with warehouse inventory and available stock.

### `GET /api/warehouses`
Returns the list of warehouses.

### `POST /api/reservations`
Creates a reservation if there is enough available stock.
- `201 Created` on success
- `409 Conflict` if not enough stock
- `400 Bad Request` for invalid input

### `POST /api/reservations/:id/confirm`
Confirms a pending reservation.
- `200 OK` on success
- `410 Gone` if the reservation has expired
- `400 Bad Request` if the reservation cannot be confirmed

### `POST /api/reservations/:id/release`
Releases a pending reservation early.
- `200 OK` on success
- `400 Bad Request` if the reservation cannot be released

## Frontend summary

### Products page
- shows products and available stock by warehouse
- allows reserving stock with quantity input
- displays 409 errors when stock runs out

### Reservation page
- shows reservation details and status
- shows a live countdown to expiry
- allows confirm or cancel actions
- updates UI without manual refresh
- displays 410 expiry errors clearly

## Deployment notes

Deploy this app to Vercel with hosted Postgres and Redis.
Recommended services:
- Postgres: Supabase, Neon, Railway
- Redis: Upstash or managed Redis
- App: Vercel

Required environment variables:
- `DATABASE_URL`
- `REDIS_URL`
- `NODE_ENV=production`

## Project structure

- `app/` — pages and API routes
- `components/` — UI and client components
- `lib/` — Prisma client, Redis, validators, idempotency logic
- `prisma/` — schema, migrations, seed script

