import { z } from "zod";
// import { z } from "zod/mini";

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  images: z.array(z.string()).optional(),
  shopId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  images: z.array(z.string()).optional(),
  categoryId: z.string().uuid().optional(),
});

export const productIdParamsSchema = z.object({
  id: z.string().uuid(),
});