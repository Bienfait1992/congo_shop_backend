import { PrismaClient } from "@prisma/client";
import { notificationService } from "../notifications/services/notificationService.js";

const prisma = new PrismaClient();

export async function processPayment({ method, orderId }, userId) {

  return await prisma.$transaction(async (tx) => {

    // 🔎 Vérifier commande
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Commande introuvable");
    }

    if (order.clientId !== userId) {
      throw new Error("Accès refusé");
    }

    //Paiement déjà existant
    const existing = await tx.payment.findUnique({
      where: { orderId }
    });

    if (existing) {
      throw new Error("Paiement déjà effectué");
    }

    //montant réel
    const amount = order.totalPrice;

    //status
    let status = "SUCCESS";

    if (method === "CASH") {
      status = "PENDING";
    }

    //créer paiement
    const payment = await tx.payment.create({
      data: {
        amount,
        method,
        status,
        orderId,
        userId,
        transactionId: `TX-${Date.now()}`
      }
    });

    // =========================
    //SI paiement réussi
    // =========================
    if (status === "SUCCESS") {

      //MAJ COMMANDE
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CONFIRMED"
        }
      });

      //NOTIFICATION
      await notificationService.create({
        tx, //IMPORTANT
        userId,
        title: "Paiement confirmé",
        message: "Votre commande a été payée avec succès",
        type: "PAYMENT",
        entityId: orderId,
      });
    }

    return payment;
  });
}