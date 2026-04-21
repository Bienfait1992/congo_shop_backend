// import express from "express";
// import { PrismaClient } from "@prisma/client";
// import { authenticate } from "../../middlewares/auth.middleware.js";

// const prisma = new PrismaClient();
// const router = express.Router();

// // ➤ Créer une demande de devenir livreur
// router.post("/", authenticate, async (req, res) => {
//   try {
//     const {
//       vehicleType,
//       vehicleImages,
//       latitude,
//       longitude,
//       type,        // INDIVIDUAL ou COMPANY
//       companyId
//     } = req.body;

//     // 🔒 Vérifier demande en attente
//     const existing = await prisma.deliveryMan.findFirst({
//       where: {
//         userId: req.userId,
//         status: "PENDING"
//       }
//     });

//     if (existing) {
//       return res.status(400).json({
//         error: "Vous avez déjà une demande en attente"
//       });
//     }

//     // 🔥 LOGIQUE PRINCIPALE
//     let finalCompanyId = null;

//     if (type === "COMPANY") {

//       if (!companyId) {
//         return res.status(400).json({
//           error: "companyId requis pour une compagnie"
//         });
//       }

//       // 🔒 Vérifier que la compagnie existe
//       const company = await prisma.deliveryCompany.findUnique({
//         where: { id: companyId }
//       });

//       if (!company) {
//         return res.status(404).json({
//           error: "Compagnie introuvable"
//         });
//       }

//       finalCompanyId = companyId;
//     }

//     // 🚀 Création
//     const deliveryMan = await prisma.deliveryMan.create({
//       data: {
//         vehicleType,
//         vehicleImages: vehicleImages || [],
//         latitude: latitude ? parseFloat(latitude) : null,
//         longitude: longitude ? parseFloat(longitude) : null,
//         userId: req.userId,
//         status: "PENDING",
//         isAvailable: false, // pas actif tant que pas approuvé
//         companyId: finalCompanyId
//       }
//     });

//     res.json({
//       message: "Demande envoyée, en attente d’approbation",
//       deliveryMan
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Erreur serveur" });
//   }
// });

// // ➤ Admin approuve ou rejette une demande
// router.patch("/:id/approve", authenticate, async (req, res) => {
//   if (req.userRole !== "ADMIN") {
//     return res.status(403).json({ error: "Accès refusé" });
//   }

//   const { id } = req.params;
//   const { approve } = req.body;

//   try {
//     const delivery = await prisma.deliveryMan.findUnique({
//       where: { id }
//     });

//     if (!delivery) {
//       return res.status(404).json({ error: "Introuvable" });
//     }

//     const updated = await prisma.deliveryMan.update({
//       where: { id },
//       data: {
//         status: approve ? "APPROVED" : "REJECTED",
//         isAvailable: approve ? true : false
//       }
//     });

//     if (approve) {
//       await prisma.user.update({
//         where: { id: delivery.userId },
//         data: {
//           role: delivery.companyId ? "DELIVERY" : "DELIVERY"
//         }
//       });
//     }

//     res.json({
//       message: approve ? "Approuvé" : "Rejeté",
//       delivery: updated
//     });

//   } catch (err) {
//     res.status(500).json({ error: "Erreur validation" });
//   }
// });

// // ➤ Récupérer tous les livreurs (admin ou global)
// router.get("/", async (req, res) => {
//   try {
//     const deliveryMen = await prisma.deliveryMan.findMany({ include: { user: true } });
//     res.json(deliveryMen);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ➤ Mettre à jour la position du livreur
// router.patch("/:id/location", authenticate, async (req, res) => {
//   try {
//     const { latitude, longitude } = req.body;

//     const deliveryMan = await prisma.deliveryMan.update({
//       where: { id: req.params.id },
//       data: {
//         latitude: parseFloat(latitude),
//         longitude: parseFloat(longitude)
//       }
//     });

//     // 🔥 AJOUT TRACKING
//     const activeDelivery = await prisma.delivery.findFirst({
//       where: {
//         deliveryManId: req.params.id,
//         status: "DELIVERING"
//       }
//     });

//     if (activeDelivery) {
//       await prisma.deliveryTracking.create({
//         data: {
//           latitude: parseFloat(latitude),
//           longitude: parseFloat(longitude),
//           deliveryId: activeDelivery.id
//         }
//       });
//     }

//     res.json(deliveryMan);

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ➤ Supprimer un livreur
// router.delete("/:id", authenticate, async (req, res) => {
//   try {
//     await prisma.deliveryMan.delete({ where: { id: req.params.id } });
//     res.json({ message: "Livreur supprimé" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// router.post("/accept", authenticate, async (req, res) => {
//   const { orderId } = req.body;

//   const delivery = await prisma.delivery.findFirst({
//     where: { orderId, status: "SEARCHING" }
//   });

//   if (!delivery) {
//     return res.status(400).json({ error: "Déjà pris" });
//   }

//   await prisma.delivery.update({
//     where: { id: delivery.id },
//     data: {
//       status: "ACCEPTED",
//       deliveryManId: req.userId
//     }
//   });

//   await prisma.deliveryMan.update({
//     where: { id: req.userId },
//     data: { isAvailable: false }
//   });

//   res.json({ message: "Commande acceptée" });
// });


// router.post("/reject", async (req, res) => {
//   await prisma.delivery.update({
//     where: { orderId: req.body.orderId },
//     data: { status: "REJECTED" }
//   });

//   // relancer dispatch vers autres livreurs
// });

// export default router;


import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../../middlewares/auth.middleware.js";

const prisma = new PrismaClient();
const router = express.Router();


// ======================================
// ➤ CREATE DELIVERY REQUEST
// ======================================
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      vehicleType,
      vehicleImages,
      latitude,
      longitude,
      type,
      companyId
    } = req.body;

    // ❌ éviter double demande
    const existing = await prisma.deliveryMan.findFirst({
      where: {
        userId: req.userId,
        status: "PENDING"
      }
    });

    if (existing) {
      return res.status(400).json({
        error: "Demande déjà en attente"
      });
    }

    let finalCompanyId = null;

    if (type === "COMPANY") {
      if (!companyId) {
        return res.status(400).json({
          error: "companyId requis"
        });
      }

      const company = await prisma.deliveryCompany.findUnique({
        where: { id: companyId }
      });

      if (!company) {
        return res.status(404).json({
          error: "Compagnie introuvable"
        });
      }

      finalCompanyId = companyId;
    }

    const deliveryMan = await prisma.deliveryMan.create({
      data: {
        vehicleType,
        vehicleImages: vehicleImages || [],
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        userId: req.userId,
        status: "PENDING",
        isAvailable: false,
        companyId: finalCompanyId
      }
    });

    res.json({
      message: "Demande envoyée",
      deliveryMan
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


// ======================================
// ➤ APPROVE / REJECT DELIVERY MAN
// ======================================
router.patch("/:id/approve", authenticate, async (req, res) => {
  if (req.userRole !== "ADMIN") {
    return res.status(403).json({ error: "Accès refusé" });
  }

  const { id } = req.params;
  const { approve } = req.body;

  try {
    const deliveryMan = await prisma.deliveryMan.findUnique({
      where: { id }
    });

    if (!deliveryMan) {
      return res.status(404).json({ error: "Introuvable" });
    }

    const updated = await prisma.deliveryMan.update({
      where: { id },
      data: {
        status: approve ? "APPROVED" : "REJECTED",
        isAvailable: approve
      }
    });

    // role update (optionnel)
    if (approve) {
      await prisma.user.update({
        where: { id: deliveryMan.userId },
        data: { role: "DELIVERY" }
      });
    }

    res.json({
      message: approve ? "Approuvé" : "Rejeté",
      delivery: updated
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur validation" });
  }
});


// ======================================
// ➤ GET ALL DELIVERY MEN
// ======================================
router.get("/", async (req, res) => {
  try {
    const deliveryMen = await prisma.deliveryMan.findMany({
      include: { user: true }
    });

    res.json(deliveryMen);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ======================================
// ➤ UPDATE LOCATION
// ======================================
router.patch("/:id/location", authenticate, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const deliveryMan = await prisma.deliveryMan.update({
      where: { id: req.params.id },
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      }
    });

    const activeDelivery = await prisma.delivery.findFirst({
      where: {
        deliveryManId: req.params.id,
        status: "DELIVERING"
      }
    });

    if (activeDelivery) {
      await prisma.deliveryTracking.create({
        data: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          deliveryId: activeDelivery.id
        }
      });
    }

    res.json(deliveryMan);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ======================================
// ➤ DELETE DELIVERY MAN
// ======================================
router.delete("/:id", authenticate, async (req, res) => {
  try {
    await prisma.deliveryMan.update({
      where: { id: req.params.id },
      data: {
        status: "DELETED",
        isAvailable: false
      }
    });

    res.json({ message: "Livreur désactivé" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ======================================
// ➤ ACCEPT ORDER (CORRIGÉ)
// ======================================
router.post("/accept", authenticate, async (req, res) => {
  try {
    const { orderId } = req.body;

    // récupérer livreur connecté
    const deliveryMan = await prisma.deliveryMan.findFirst({
      where: { userId: req.userId }
    });

    if (!deliveryMan) {
      return res.status(404).json({
        error: "Livreur introuvable"
      });
    }

    const delivery = await prisma.delivery.findFirst({
      where: {
        orderId,
        status: "SEARCHING"
      }
    });

    if (!delivery) {
      return res.status(400).json({
        error: "Commande déjà prise"
      });
    }

    await prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        status: "ACCEPTED",
        deliveryManId: deliveryMan.id
      }
    });

    await prisma.deliveryMan.update({
      where: { id: deliveryMan.id },
      data: {
        isAvailable: false
      }
    });

    res.json({
      message: "Commande acceptée"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur acceptation" });
  }
});


// ======================================
// ➤ REJECT ORDER
// ======================================
router.post("/reject", authenticate, async (req, res) => {
  try {
    const { orderId } = req.body;

    await prisma.delivery.update({
      where: { orderId },
      data: {
        status: "REJECTED"
      }
    });

    res.json({
      message: "Commande rejetée"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur rejet" });
  }
});

export default router;