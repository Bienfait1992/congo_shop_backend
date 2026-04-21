import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Simulation paiement (remplace plus tard par Stripe / API Mobile Money)
export async function processPayment({ amount, method, orderId }) {

  // ⚠️ Simulation
  let status = "SUCCESS";

  if (method === "CASH") {
    status = "PENDING"; // paiement à la livraison
  }

  // Vérifier si paiement existe déjà
  const existing = await prisma.payment.findUnique({
    where: { orderId }
  });

  if (existing) {
    throw new Error("Paiement déjà effectué pour cette commande");
  }

  const payment = await prisma.payment.create({
    data: {
      amount,
      method,
      status,
      orderId,
      transactionId: `TX-${Date.now()}`
    }
  });

  return payment;
}