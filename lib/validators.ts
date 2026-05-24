import { z } from 'zod';

export const reservationCreateSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

export const reservationIdSchema = z.object({
  id: z.string().uuid(),
});
