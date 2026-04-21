import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../../middlewares/auth.middleware.js";

const prisma = new PrismaClient();
const router = express.Router();



router.post("/", authenticate, async (req, res) => {
  try {
    const { name, phone } = req.body;

    const company = await prisma.deliveryCompany.create({
      data: {
        name,
        phone,
        ownerId: req.userId
      }
    });

    res.json(company);
  } catch (err) {
    res.status(500).json({ error: "Erreur création compagnie" });
  }
});

router.get("/", async (req, res) => {
  try {
    const companies = await prisma.deliveryCompany.findMany();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération compagnies" });
  }
});

export default router;