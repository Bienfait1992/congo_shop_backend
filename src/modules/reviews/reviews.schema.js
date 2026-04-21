import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  targetId: z.string().uuid(),
  targetType: z.enum(["PRODUCT", "SHOP", "DELIVERY"]),
});

export const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
});

export const reviewIdSchema = z.object({
  id: z.string().uuid(),
}); 