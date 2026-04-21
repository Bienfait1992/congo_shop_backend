// routes/coupon.js
router.post("/apply", authenticate, async (req, res) => {
  try {
    const { code, total } = req.body;

    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      return res.status(400).json({ error: "Coupon invalide" });
    }

    if (coupon.expiresAt < new Date()) {
      return res.status(400).json({ error: "Coupon expiré" });
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: "Coupon déjà utilisé" });
    }

    let discount = coupon.isPercent
      ? total * (coupon.discount / 100)
      : coupon.discount;

    const finalTotal = Math.max(0, total - discount);

    res.json({ discount, finalTotal, couponId: coupon.id });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});