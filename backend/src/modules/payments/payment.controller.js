import { processPayment } from "./payment.service.js";

export async function createPayment(req, res) {
  try {
    const payment = await processPayment(req.body);

    res.status(201).json({
      message: "Paiement effectué",
      data: payment
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}