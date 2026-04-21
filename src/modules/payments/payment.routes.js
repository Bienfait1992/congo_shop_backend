import express from "express";
import { createPayment } from "./payment.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { createPaymentSchema } from "./payment.schema.js";

const router = express.Router();

router.post("/", authenticate, async (req, res) => {
  try {
    const validated = createPaymentSchema.parse(req.body);
    req.body = validated;

    return createPayment(req, res);

  } catch (err) {
    return res.status(400).json({ error: err.errors });
  }
});

export default router;