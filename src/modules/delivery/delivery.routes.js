// import express from "express";
// import { PrismaClient } from "@prisma/client";
// import { authenticate } from "../../middlewares/auth.middleware.js";

// const prisma = new PrismaClient();
// const router = express.Router();


// // CREATE DELIVERY
// router.post("/", authenticate, async (req, res) => {
//   try {

//     const { orderId, status } = req.body;

//     const delivery = await prisma.delivery.create({
//       data: {
//         orderId,
//         status
//       }
//     });

//     res.json(delivery);

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// // GET ALL DELIVERIES
// router.get("/", authenticate, async (req, res) => {
//   try {

//     const deliveries = await prisma.delivery.findMany({
//       include: {
//         order: true
//       }
//     });

//     res.json(deliveries);

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// // UPDATE DELIVERY STATUS
// router.patch("/:id/status", authenticate, async (req, res) => {
//   try {

//     const { id } = req.params;
//     const { status } = req.body;

//     const delivery = await prisma.delivery.update({
//       where: { id },
//       data: {
//         status
//       }
//     });

//     res.json(delivery);

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });



// // COMPLETE DELIVERY
// router.patch("/:id/complete", authenticate, async (req, res) => {
//   try {
//     const { id } = req.params;

//     // 1️⃣ mettre à jour la livraison
//     const delivery = await prisma.delivery.update({
//       where: { id },
//       data: {
//         deliveredTime: new Date(),
//         status: "DELIVERED"
//       }
//     });

//     // 2️⃣ rendre le livreur à nouveau disponible
//     if (delivery.order && delivery.order.deliveryId) {
//       await prisma.deliveryMan.update({
//         where: { id: delivery.order.deliveryId },
//         data: { isAvailable: true }
//       });
//     }

//     res.json({
//       message: "Livraison terminée, livreur disponible",
//       delivery
//     });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// export default router;

import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../../middlewares/auth.middleware.js";

const prisma = new PrismaClient();
const router = express.Router();

// ➤ Récupérer toutes les livraisons
router.get("/", authenticate, async (req, res) => {
  try {
    const deliveries = await prisma.delivery.findMany({
      include: { order: true, deliveryMan: true }
    });
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➤ Mettre à jour le statut d’une livraison
router.patch("/:id/status", authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    const delivery = await prisma.delivery.update({
      where: { id: req.params.id },
      data: { status }
    });

    res.json(delivery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➤ Marquer une livraison comme terminée
router.patch("/:id/complete", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await prisma.delivery.update({
      where: { id },
      data: {
        deliveredTime: new Date(),
        status: "DELIVERED"
      },
      include: { deliveryMan: true }
    });

    // libérer le livreur
    if (delivery.deliveryMan) {
      await prisma.deliveryMan.update({
        where: { id: delivery.deliveryMan.id },
        data: { isAvailable: true }
      });
    }

    res.json({ message: "Livraison terminée", delivery });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;