import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../../middlewares/auth.middleware.js";

const prisma = new PrismaClient();
const router = express.Router();

console.log("✅ deliveryAdressRoutes chargé");

// ==========================
// GET - récupérer toutes les adresses
// ==========================
router.get("/", authenticate, async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.userId },
    orderBy: { isDefault: "desc" },
  });

  res.json(addresses);
});


router.get("/default", authenticate, async (req, res) => {
  try {
    const address = await prisma.address.findFirst({
      where: { userId: req.userId },
      orderBy: { isDefault: "desc" }, // 👈 IMPORTANT
    });

    res.json(address);
  } catch (err) {
    console.error("❌ GET DEFAULT ADDRESS ERROR:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
// ==========================
// POST - créer une nouvelle adresse
// ==========================
router.post("/", authenticate, async (req, res) => {
  const { label, address, latitude, longitude, street, city, zip, isDefault } = req.body;

  try {
    // 🔥 1. Si cette adresse devient par défaut → reset toutes les autres
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.userId },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        user: { connect: { id: req.userId } },
        label: label || "Maison",
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        street: street || "",
        city: city || "",
        zip: zip || "",
        isDefault: !!isDefault,
      },
    });

    res.json(newAddress);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================
// PATCH - mettre à jour une adresse existante
// ==========================
router.patch("/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { label, address, latitude, longitude, street, city, zip, isDefault } = req.body;

  try {
    const existing = await prisma.address.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Adresse introuvable" });
    }

    // 🔥 Si cette adresse devient default → on reset les autres
    if (isDefault === true) {
      await prisma.address.updateMany({
        where: { userId: req.userId },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        label,
        address,
        latitude,
        longitude,
        street,
        city,
        zip,
        isDefault: !!isDefault,
      },
    });

    res.json(updatedAddress);
  } catch (err) {
    console.error("❌ Erreur PATCH:", err);
    res.status(400).json({ error: err.message });
  }
});

// ==========================
// DELETE - supprimer une adresse (optionnel)
// ==========================
router.delete("/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await prisma.address.delete({ where: {id} });
    res.json({ message: "Adresse supprimée", deleted });
  } catch (err) {
    console.error("❌ Erreur DELETE:", err);
    res.status(400).json({ error: err.message });
  }
});

export default router;