import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../../middlewares/auth.middleware.js";

const prisma = new PrismaClient();
const router = express.Router();

/**
 * APPLIQUER UN COUPON
 * POST /coupons/apply
 */
router.post("/apply", authenticate, async (req, res) => {
  console.log("🎟️ ===== APPLY COUPON =====");

  try {
    const { code, total } = req.body;

    console.log("📦 BODY:", req.body);
    console.log("👤 USER:", req.userId);

    // =========================
    // 1️⃣ VALIDATION INPUT
    // =========================
    if (!code || total == null) {
      return res.status(400).json({
        error: "code et total sont obligatoires",
      });
    }

    if (typeof total !== "number" || total < 0) {
      return res.status(400).json({
        error: "total invalide",
      });
    }

    // =========================
    // 2️⃣ FIND COUPON
    // =========================
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim() },
    });

    if (!coupon) {
      return res.status(400).json({ error: "Coupon invalide" });
    }

    console.log("🎯 COUPON FOUND:", coupon);

    // =========================
    // 3️⃣ CHECK EXPIRATION
    // =========================
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ error: "Coupon expiré" });
    }

    // =========================
    // 4️⃣ CHECK USAGE LIMIT
    // =========================
    if (
      coupon.maxUses &&
      coupon.usedCount >= coupon.maxUses
    ) {
      return res.status(400).json({ error: "Coupon épuisé" });
    }

    // =========================
    // 5️⃣ CALCUL DISCOUNT
    // =========================
    let discount = 0;

    if (coupon.isPercent) {
      discount = (total * coupon.discount) / 100;
    } else {
      discount = coupon.discount;
    }

    // sécurité: éviter négatif
    discount = Math.min(discount, total);

    const finalTotal = total - discount;

    console.log("💰 DISCOUNT:", discount);
    console.log("🧾 FINAL TOTAL:", finalTotal);

    // =========================
    // 6️⃣ RESPONSE
    // =========================
    return res.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
      },
      discount,
      finalTotal,
    });

  } catch (err) {
    console.error("❌ COUPON ERROR:", err);
    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

export default router;