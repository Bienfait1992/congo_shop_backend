// import { z } from "zod";

// export const createPaymentSchema = z.object({
//   amount: z.number().positive(),
//   method: z.enum(["CASH", "AIRTEL_MONEY", "ORANGE_MONEY", "MPESA", "CARD"]),
//   orderId: z.string().uuid(),
// });

// export const paymentIdParamsSchema = z.object({
//   id: z.string().uuid(),
// });

import { z } from "zod";

export const createPaymentSchema = z.object({
  method: z.enum(["CASH", "AIRTEL_MONEY", "ORANGE_MONEY", "MPESA", "CARD"]),
  orderId: z.string().uuid(),
});