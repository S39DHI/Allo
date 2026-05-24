import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf8').split(/\r?\n/).filter(Boolean).reduce((acc, line) => {
  const [k,v] = line.split('=',2);
  if (k === 'DATABASE_URL') {
    acc[k] = v.replace(/^"|"$/g, '');
  }
  return acc;
}, {});
const url = 'http://127.0.0.1:3000';
const productId = 'caf2d4c2-bb4e-4333-974a-82030e92ae3f';
const warehouseId = '8b320049-08ab-42bb-9d2b-35f959481858';

const createResp = await fetch(`${url}/api/reservations`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ productId, warehouseId, quantity: 1 }),
});
const createBody = await createResp.text();
console.log('create status', createResp.status);
console.log(createBody);
if (createResp.status !== 201) process.exit(1);
const reservation = JSON.parse(createBody);
const prisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
await prisma.reservation.update({ where: { id: reservation.id }, data: { expiresAt: new Date(Date.now() - 60000) } });
console.log('expired', reservation.id);
const confirmResp = await fetch(`${url}/api/reservations/${reservation.id}/confirm`, { method: 'POST' });
console.log('confirm status', confirmResp.status);
console.log(await confirmResp.text());
await prisma.$disconnect();
