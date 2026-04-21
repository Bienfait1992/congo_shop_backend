import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../../middlewares/auth.middleware.js";

const prisma = new PrismaClient();
const router = express.Router();

/**
 * ✅ 1. Ajouter un produit à la wishlist
 * POST /api/wishlist/:productId
 */
router.post("/:productId", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    // Vérifier si produit existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: "Produit introuvable" });
    }

    // Vérifier si déjà dans wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Déjà dans la wishlist" });
    }

    const wishlist = await prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
    });

    res.json(wishlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * ❌ 2. Retirer un produit de la wishlist
 * DELETE /api/wishlist/:productId
 */
router.delete("/:productId", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    await prisma.wishlist.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    res.json({ message: "Supprimé de la wishlist" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 📄 3. Récupérer la wishlist du user
 * GET /api/wishlist
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const wishlist = await prisma.wishlist.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        product: {
          include: {
            shop: true,
            promotions: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    res.json(wishlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 🔁 4. Toggle wishlist (ajoute si absent, supprime si existe)
 * POST /api/wishlist/toggle/:productId
 */
router.post("/toggle/:productId", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

      return res.json({ action: "removed" });
    }

    await prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
    });

    res.json({ action: "added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 🔍 5. Vérifier si produit est dans wishlist
 * GET /api/wishlist/check/:productId
 */
router.get("/check/:productId", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    res.json({ isInWishlist: !!existing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;