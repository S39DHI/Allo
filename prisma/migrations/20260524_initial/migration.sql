-- Create tables and enums for the inventory reservation system

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'RELEASED');

CREATE TABLE "Product" (
  "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "createdAt" timestamp(3) with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "Warehouse" (
  "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "createdAt" timestamp(3) with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "Inventory" (
  "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "productId" uuid NOT NULL,
  "warehouseId" uuid NOT NULL,
  "totalUnits" integer NOT NULL DEFAULT 0,
  "reservedUnits" integer NOT NULL DEFAULT 0,
  CONSTRAINT "Inventory_productId_warehouseId_unique" UNIQUE ("productId", "warehouseId"),
  CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Inventory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Reservation" (
  "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "productId" uuid NOT NULL,
  "warehouseId" uuid NOT NULL,
  "quantity" integer NOT NULL,
  "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" timestamp(3) with time zone NOT NULL,
  "createdAt" timestamp(3) with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp(3) with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "Reservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Reservation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
