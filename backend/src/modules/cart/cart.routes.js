import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { z } from "zod";

const prisma = new PrismaClient();
const router = express.Router();

// -----------------------------
// VALIDATION
// -----------------------------
const addItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(1),
});

// -----------------------------
// GET CART
// -----------------------------
router.get("/", authenticate, async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.userId },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        },
      },
    });

    res.json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// -----------------------------
// ADD TO CART
// -----------------------------
// router.post("/items", authenticate, async (req, res) => {
//   try {
//     const parsed = addItemSchema.parse(req.body);
//     const { productId, quantity, variantId } = parsed;

//     const result = await prisma.$transaction(async (tx) => {

//       // ---------------- PRODUCT
//       const product = await tx.product.findUnique({
//         where: { id: productId }
//       });

//       if (!product) {
//         throw new Error("Produit introuvable");
//       }

//       // ---------------- VARIANT LOGIC
//       let variant = null;
//       let price = product.price;
//       let stock = product.stock;

//       if (variantId) {
//         variant = await tx.productVariant.findUnique({
//           where: { id: variantId }
//         });

//         if (!variant) {
//           throw new Error("Variante introuvable");
//         }

//         price = variant.price ?? product.price;
//         stock = variant.stock ?? product.stock;
//       }

//       // ---------------- STOCK CHECK
//       if (stock < quantity) {
//         throw new Error("Stock insuffisant");
//       }

//       // ---------------- CART
//       let cart = await tx.cart.findUnique({
//         where: { userId: req.userId }
//       });

//       if (!cart) {
//         cart = await tx.cart.create({
//           data: { userId: req.userId }
//         });
//       }

//       // ---------------- EXISTING ITEM
//       const existingItem = await tx.cartItem.findFirst({
//         where: {
//           cartId: cart.id,
//           productId,
//           variantId: variantId || null
//         }
//       });

//       // ---------------- UPDATE ITEM
//       if (existingItem) {
//         const newQty = existingItem.quantity + quantity;

//         if (stock < newQty) {
//           throw new Error("Stock insuffisant");
//         }

//         return tx.cartItem.update({
//           where: { id: existingItem.id },
//           data: {
//             quantity: newQty,
//             price
//           },
//           include: {
//             product: true,
//             variant: true
//           }
//         });
//       }

//       // ---------------- CREATE ITEM
//       return tx.cartItem.create({
//         data: {
//           cartId: cart.id,
//           productId,
//           variantId: variantId || null,
//           quantity,
//           price
//         },
//         include: {
//           product: true,
//           variant: true
//         }
//       });
//     });

//     res.json({
//       message: "Produit ajouté au panier",
//       item: result
//     });

//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });


router.post("/items", authenticate, async (req, res) => {
  try {
    const parsed = addItemSchema.parse(req.body);
    const { productId, quantity, variantId } = parsed;

    const result = await prisma.$transaction(async (tx) => {

      // =========================
      // NORMALISATION VARIANT
      // =========================
      const normalizedVariantId = variantId || null;

      // =========================
      // PRODUCT
      // =========================
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error("Produit introuvable");
      }

      // =========================
      // VARIANT LOGIC
      // =========================
      let variant = null;
      let price = product.price;
      let stock = product.stock;

      if (normalizedVariantId) {
        variant = await tx.productVariant.findUnique({
          where: { id: normalizedVariantId },
        });

        if (!variant) {
          throw new Error("Variante introuvable");
        }

        price = variant.price ?? product.price;
        stock = variant.stock ?? product.stock;
      }

      // =========================
      // STOCK CHECK
      // =========================
      if (stock < quantity) {
        throw new Error("Stock insuffisant");
      }

      // =========================
      // CART (CREATE IF NOT EXISTS)
      // =========================
      let cart = await tx.cart.findUnique({
        where: { userId: req.userId },
      });

      if (!cart) {
        cart = await tx.cart.create({
          data: { userId: req.userId },
        });
      }

      // =========================
      // UNIQUE KEY LOGIC (IMPORTANT)
      // =========================
      const existingItem = await tx.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          variantId: normalizedVariantId,
        },
      });

      // =========================
      // UPDATE IF EXISTS
      // =========================
      if (existingItem) {
        const newQty = existingItem.quantity + quantity;

        if (stock < newQty) {
          throw new Error("Stock insuffisant");
        }

        return await tx.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQty,
            price,
          },
          include: {
            product: true,
            variant: true,
          },
        });
      }

      // =========================
      // CREATE NEW ITEM
      // =========================
      return await tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: normalizedVariantId,
          quantity,
          price,
        },
        include: {
          product: true,
          variant: true,
        },
      });
    });

    return res.json({
      message: "Produit ajouté au panier",
      item: result,
    });

  } catch (err) {
    return res.status(400).json({
      error: err.message,
    });
  }
});

// -----------------------------
// UPDATE QUANTITY
// -----------------------------
router.patch("/items/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = updateItemSchema.parse(req.body);

    const item = await prisma.cartItem.findUnique({
      where: { id },
      include: { product: true, variant: true }
    });

    if (!item) {
      return res.status(404).json({ error: "Item non trouvé" });
    }

    const cart = await prisma.cart.findUnique({
      where: { id: item.cartId }
    });

    if (!cart || cart.userId !== req.userId) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    // STOCK (variant prioritaire)
    const stock = item.variant?.stock ?? item.product.stock;

    if (quantity > stock) {
      return res.status(400).json({ error: "Stock insuffisant" });
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: {
        product: true,
        variant: true
      }
    });

    res.json(updated);

  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }

    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// DELETE ITEM
// -----------------------------
router.delete("/items/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.cartItem.findUnique({
      where: { id }
    });

    if (!item) {
      return res.status(404).json({ error: "Item non trouvé" });
    }

    const cart = await prisma.cart.findUnique({
      where: { id: item.cartId }
    });

    if (!cart || cart.userId !== req.userId) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    await prisma.cartItem.delete({
      where: { id }
    });

    res.json({ message: "Item supprimé" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// -----------------------------
// CLEAR CART
// -----------------------------
router.delete("/", authenticate, async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.userId }
    });

    if (!cart) {
      return res.status(404).json({ error: "Panier vide" });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    res.json({ message: "Panier vidé" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;