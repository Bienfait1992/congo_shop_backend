// import express from "express";
// import { PrismaClient } from "@prisma/client";
// import { authenticate } from "../../middlewares/auth.middleware.js";
// import { getDistance } from "../../utils/helpers.js";
// import { getIO, deliverySockets } from "../../sockets/socket.js";

// const prisma = new PrismaClient();
// const router = express.Router();

// // ➤ Checkout (création de commande + assignation du livreur)
// router.post("/checkout", authenticate, async (req, res) => {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: req.userId },
//     });

//     if (!user.address || !user.latitude || !user.longitude) {
//       return res.status(400).json({ error: "Veuillez définir votre adresse de livraison" });
//     }

//     const allowedPayments = ["CASH", "MOBILE_MONEY", "CARD"];
//     const { deliveryAddress, paymentMethod, deliveryLatitude, deliveryLongitude } = req.body;

//     if (!allowedPayments.includes(paymentMethod)) {
//       return res.status(400).json({ error: "Méthode de paiement invalide" });
//     }

//     const deliveryLat = deliveryLatitude || user.latitude;
//     const deliveryLng = deliveryLongitude || user.longitude;
//     const deliveryAddr = deliveryAddress || user.address;

//     const result = await prisma.$transaction(async (tx) => {

//       // 🛒 PANIER AVEC VARIANTES
//       const cart = await tx.cart.findUnique({
//         where: { userId: req.userId },
//         include: {
//           items: {
//             include: {
//               product: true,
//               variant: true, // 🔥 IMPORTANT
//             },
//           },
//         },
//       });

//       if (!cart || cart.items.length === 0) throw new Error("Panier vide");

//       // ❌ multi shop
//       const shopIds = [...new Set(cart.items.map(i => i.product.shopId))];
//       if (shopIds.length > 1) throw new Error("Panier multi-boutiques non supporté");

//       const shopId = shopIds[0];

//       const shop = await tx.shop.findUnique({ where: { id: shopId } });
//       if (!shop || !shop.latitude || !shop.longitude) throw new Error("Shop invalide");

//       // 💰 CALCUL + STOCK
//       let totalPrice = 0;

//       for (const item of cart.items) {

//         const price = item.variant?.price || item.product.price;
//         const stock = item.variant ? item.variant.stock : item.product.stock;

//         if (stock < item.quantity) {
//           throw new Error(`Stock insuffisant pour ${item.product.name}`);
//         }

//         totalPrice += price * item.quantity;
//       }

//       // 🚚 LIVREURS
//       let deliveryMen = await tx.deliveryMan.findMany({
//         where: {
//           isAvailable: true,
//           latitude: { not: null },
//           longitude: { not: null },
//           type: "COMPANY"
//         },
//         include: { company: true },
//       });

//       if (!deliveryMen.length) {
//         deliveryMen = await tx.deliveryMan.findMany({
//           where: {
//             isAvailable: true,
//             latitude: { not: null },
//             longitude: { not: null },
//             type: "INDIVIDUAL"
//           },
//           include: { company: true },
//         });
//       }

//       if (!deliveryMen.length) throw new Error("Aucun livreur disponible");

//       //PLUS PROCHE
//       let closest = null;
//       let minDistance = Infinity;

//       for (const dm of deliveryMen) {
//         const distanceToShop = getDistance(shop.latitude, shop.longitude, dm.latitude, dm.longitude);
//         const distanceToClient = getDistance(deliveryLat, deliveryLng, dm.latitude, dm.longitude);
//         const totalDistance = distanceToShop * 0.4 + distanceToClient * 0.6;

//         if (totalDistance < minDistance) {
//           minDistance = totalDistance;
//           closest = dm;
//         }
//       }

//       if (!closest) throw new Error("Aucun livreur trouvable");

//       // 🔒 LOCK LIVREUR
//       const updatedCount = await tx.deliveryMan.updateMany({
//         where: {
//           id: closest.id,
//           isAvailable: true,
//           latitude: { not: null },
//           longitude: { not: null }
//         },
//         data: { isAvailable: false },
//       });

//       if (updatedCount.count === 0) throw new Error("Livreur déjà pris");

//       // 🧾 CRÉATION COMMANDE
//       const order = await tx.order.create({
//         data: {
//           clientId: req.userId,
//           shopId,
//           totalPrice,
//           deliveryAddress: deliveryAddr,
//           paymentMethod,
//           deliveryLatitude: deliveryLat,
//           deliveryLongitude: deliveryLng,
//           status: "PENDING",

//           delivery: {
//             create: {
//               status: "PENDING",
//               deliveryMan: { connect: { id: closest.id } }
//             }
//           },

//           items: {
//             create: cart.items.map(item => ({
//               productId: item.productId,
//               variantId: item.variantId || null, // 🔥 IMPORTANT
//               quantity: item.quantity,
//               price: item.variant?.price || item.product.price
//             }))
//           }
//         },
//         include: {
//           items: true,
//           delivery: { include: { deliveryMan: true } }
//         },
//       });

//       // 📉 DÉCRÉMENT STOCK
//       await Promise.all(
//         cart.items.map(item => {
//           if (item.variantId) {
//             return tx.productVariant.update({
//               where: { id: item.variantId },
//               data: { stock: { decrement: item.quantity } }
//             });
//           } else {
//             return tx.product.update({
//               where: { id: item.productId },
//               data: { stock: { decrement: item.quantity } }
//             });
//           }
//         })
//       );

//       // 🧹 VIDER PANIER
//       await tx.cartItem.deleteMany({
//         where: { cartId: cart.id }
//       });

//       return { order };
//     });

//     // 🔔 SOCKET
//     const io = getIO();
//     const assignedDM = result.order.delivery.deliveryMan;
//     const socketId = deliverySockets.get(assignedDM.id);

//     if (socketId) {
//       io.to(socketId).emit("new_order", {
//         orderId: result.order.id,
//         deliveryAddress: result.order.deliveryAddress,
//         totalPrice: result.order.totalPrice,
//       });
//     }

//     res.json({ message: "Commande créée", ...result });

//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// // ➤ COMMANDES CLIENT
// router.get("/", authenticate, async (req, res) => {
//   try {
//     const orders = await prisma.order.findMany({
//       where: { clientId: req.userId },
//       include: {
//         items: {
//           include: {
//             product: true,
//             variant: true // 🔥 IMPORTANT
//           }
//         },
//         delivery: { include: { deliveryMan: true } }
//       }
//     });

//     res.json(orders);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ➤ UPDATE
// router.patch("/:id", authenticate, async (req, res) => {
//   try {
//     const order = await prisma.order.update({
//       where: { id: req.params.id },
//       data: req.body
//     });
//     res.json(order);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ➤ DELETE
// router.delete("/:id", authenticate, async (req, res) => {
//   try {
//     await prisma.order.delete({ where: { id: req.params.id } });
//     res.json({ message: "Commande supprimée" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// export default router;


import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { getDistance } from "../../utils/helpers.js";
import { getIO, deliverySockets } from "../../sockets/socket.js";
import { notificationService } from "../notifications/services/notificationService.js";

const prisma = new PrismaClient();
const router = express.Router();

// ➤ CHECKOUT
router.post("/checkout", authenticate, async (req, res) => {
  const TAG = "🚀 CHECKOUT";

  console.log("\n==============================");
  console.log(TAG + " START");
  console.log("==============================");

  console.log("👤 USER ID:", req.userId);
  console.log("📦 BODY:", req.body);

  try {
    const {
      deliveryAddress,
      paymentMethod,
      deliveryLatitude,
      deliveryLongitude,
    } = req.body;

    console.log("💳 PAYMENT METHOD:", paymentMethod);
    console.log("📍 INPUT DELIVERY ADDRESS:", deliveryAddress);
    console.log("📍 INPUT LAT:", deliveryLatitude);
    console.log("📍 INPUT LNG:", deliveryLongitude);

    // =========================
    // PAYMENT CHECK
    // =========================
    console.log("🔎 CHECK PAYMENT METHOD...");

    const allowedPayments = ["CASH", "MOBILE_MONEY", "CARD"];

    if (!allowedPayments.includes(paymentMethod)) {
      console.log("❌ INVALID PAYMENT METHOD:", paymentMethod);
      return res.status(400).json({
        error: "Méthode de paiement invalide",
      });
    }

    console.log("✅ PAYMENT OK");

    // =========================
    // ADDRESS
    // =========================
    console.log("📍 FETCH USER ADDRESS...");

    const address = await prisma.address.findFirst({
      where: {
        userId: req.userId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("🏠 ADDRESS DB:", address);

    const deliveryLat = deliveryLatitude || address?.latitude;
    const deliveryLng = deliveryLongitude || address?.longitude;
    const deliveryAddr = deliveryAddress || address?.address;

    console.log("📌 FINAL LAT:", deliveryLat);
    console.log("📌 FINAL LNG:", deliveryLng);
    console.log("📌 FINAL ADDR:", deliveryAddr);

    if (!deliveryAddr || !deliveryLat || !deliveryLng) {
      console.log("❌ MISSING DELIVERY DATA");
      return res.status(400).json({
        error: "Adresse de livraison manquante",
      });
    }

    console.log("✅ ADDRESS OK");

    // =========================
    // CART
    // =========================
    console.log("🛒 FETCH CART...");

    const cart = await prisma.cart.findUnique({
      where: { userId: req.userId },
      include: {
        items: {
          include: { product: true, variant: true },
        },
      },
    });

    console.log("🛒 CART:", cart);

    if (!cart || cart.items.length === 0) {
      console.log("EMPTY CART");
      return res.status(400).json({ error: "Panier vide" });
    }

    console.log("✅ CART OK - ITEMS:", cart.items.length);

    // =========================
    // SHOP
    // =========================
    console.log("🏪 CHECK SHOP...");

    const shopIds = [...new Set(cart.items.map(i => i.product.shopId))];

    console.log("🏪 SHOP IDS:", shopIds);

    if (shopIds.length > 1) {
      console.log("MULTI SHOP CART NOT ALLOWED");
      return res.status(400).json({
        error: "Panier multi-boutiques non supporté",
      });
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopIds[0] },
    });

    console.log("🏪 SHOP:", shop);

    if (!shop) {
      console.log("❌ SHOP NOT FOUND");
      return res.status(404).json({ error: "Shop invalide" });
    }

    console.log("✅ SHOP OK");

    // =========================
    // DELIVERY MEN
    // =========================
    console.log("🚚 FETCH DELIVERY MEN...");

    const deliveryMen = await prisma.deliveryMan.findMany({
      where: {
        status: "APPROVED",
        isAvailable: true,
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    console.log("🚚 DELIVERY MEN FOUND:", deliveryMen.length);

    if (!deliveryMen.length) {
      console.log("❌ NO DELIVERY MEN AVAILABLE");
      return res.status(400).json({
        error: "Aucun livreur disponible",
      });
    }

    console.log("📏 FIND CLOSEST DELIVERY MAN...");

    let closest = null;
    let minDistance = Infinity;

    for (const dm of deliveryMen) {
      const distance = getDistance(
        deliveryLat,
        deliveryLng,
        dm.latitude,
        dm.longitude
      );

      console.log(`📍 DM ${dm.id} distance:`, distance);

      if (distance < minDistance) {
        minDistance = distance;
        closest = dm;
      }
    }

    console.log("CLOSEST:", closest?.id);
    console.log("MIN DISTANCE:", minDistance);

    // =========================
    // TRANSACTION
    // =========================
    console.log("💥 START TRANSACTION...");

    const result = await prisma.$transaction(async (tx) => {

      let totalPrice = 0;

      console.log("🧮 CALCUL TOTAL...");

      for (const item of cart.items) {
        const price = item.variant?.price || item.product.price;
        const stock = item.variant ? item.variant.stock : item.product.stock;

        console.log("🧾 ITEM:", {
          productId: item.productId,
          price,
          stock,
          quantity: item.quantity,
        });

        if (stock < item.quantity) {
          throw new Error(`Stock insuffisant pour ${item.product.name}`);
        }

        totalPrice += price * item.quantity;
      }

      console.log("💰 TOTAL PRICE:", totalPrice);

      console.log("🧾 CREATE ORDER...");

      const order = await tx.order.create({
        data: {
          clientId: req.userId,
          shopId: shop.id,
          totalPrice,
          paymentMethod,
          deliveryLatitude: deliveryLat,
          deliveryLongitude: deliveryLng,
          status: "PENDING",

          deliveryFee: Math.round(minDistance * 500),

          addressSnapshot: address
            ? {
                id: address.id,
                label: address.label,
                address: address.address,
                street: address.street,
                city: address.city,
                zip: address.zip,
                latitude: address.latitude,
                longitude: address.longitude,
                phone: address.phone ?? null,
              }
            : null,

          delivery: {
            create: {
              status: "PENDING",
              deliveryMan: {
                connect: { id: closest.id },
              },
            },
          },

          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              variantId: item.variantId || null,
              quantity: item.quantity,
              price: item.variant?.price || item.product.price,
            })),
          },
        },
        include: {
          items: true,
          delivery: { include: { deliveryMan: true } },
        },
      });

      console.log("✅ ORDER CREATED:", order.id);

      console.log("📩 NOTIF ORDER INPUT:", {
  userId: req.userId,
  orderId: order.id,
});


console.log("📦 ORDER NOTIF DATA:", {
  userId: req.userId,
  entityId: order.id,
  type: "ORDER",
});
await notificationService.create({
  tx,
  userId: req.userId,
  title: "Commande confirmée",
  message: `Votre commande #${order.id} a été validée`,
  type: "ORDER",
  link: `/orders/${order.id}`, //clé du système
  entityId: order.id
});


console.log("🚚 DELIVERY NOTIF DATA:", {
  userId: closest.userId,
  entityId: order.id,
  type: "DELIVERY",
});

await notificationService.create({
  tx,
  userId: closest.userId,
  title: "Nouvelle livraison",
  message: "Une commande est disponible",
  type: "DELIVERY",
  entityId: order.id,
});

console.log("🏪 SHOP NOTIF DATA:", {
  userId: shop.ownerId,
  entityId: order.id,
  type: "SHOP",
});

await notificationService.create({
  tx,
  userId: shop.ownerId,
  title: "Nouvelle commande",
  message: "Un client a commandé chez vous",
  type: "SHOP",
  entityId: order.id,
});
      console.log("📉 UPDATE STOCK...");

      await Promise.all(
        cart.items.map(item =>
          item.variantId
            ? tx.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { decrement: item.quantity } },
              })
            : tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
              })
        )
      );

      console.log("🧹 CLEAR CART...");

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      console.log("TRANSACTION DONE");

      return { order };
    });

    console.log("🎉 CHECKOUT SUCCESS");

    res.json({
      message: "Commande créée avec succès",
      order: result.order,
    });

  } catch (err) {
    console.error("CHECKOUT ERROR:");
    console.error("MESSAGE:", err.message);
    console.error("STACK:", err);

    res.status(400).json({
      error: err.message,
    });
  }
});


router.get("/:id", authenticate, async (req, res) => {
  const order = await prisma.order.findFirst({
    where: {
      id: req.params.id,
      clientId: req.userId,
    },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
      delivery: {
        include: {
          deliveryMan: true,
        },
      },

      // 🔥 AJOUT ICI
      shop: {
        select: {
          id: true,
           ownerId: true,
          name: true, // optionnel (utile UI)
        },
      },
    },
  });

  if (!order) {
    return res.status(404).json({ error: "Commande introuvable" });
  }

  res.json(order);
});


router.get("/", authenticate, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: {
      clientId: req.userId,
    },
    include: {
      items: true,
      delivery: true,
      shop: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(orders);
});

router.patch("/:id/cancel", authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
    });

    if (order.status !== "PENDING") {
      return res.status(400).json({ error: "Impossible d'annuler" });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: "CANCELLED" },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;