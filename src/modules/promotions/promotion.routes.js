import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../../middlewares/auth.middleware.js";

const prisma = new PrismaClient();
const router = express.Router();

// Créer une promotion pour un produit
router.post("/:productId/promotion", authenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    const { discount, startDate, endDate } = req.body;

    // Vérifier que le produit existe
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ message: "Produit non trouvé" });

    // Vérifier que l'utilisateur est propriétaire de la boutique
    const shop = await prisma.shop.findUnique({ where: { id: product.shopId } });
    if (!shop || shop.ownerId !== req.userId) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    // Créer la promotion
    const promotion = await prisma.promotion.create({
      data: {
        productId,
        discount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    res.json({ message: "Promotion appliquée avec succès", promotion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;