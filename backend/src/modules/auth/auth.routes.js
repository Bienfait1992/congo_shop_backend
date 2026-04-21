import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

//Roles valides pour inscription
const validRoles = ["CLIENT", "DELIVERY"]; // ADMIN et SELLER réservés


router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({ error: "Tous les champs sont obligatoires" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }

    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ error: "Numéro de téléphone déjà utilisé" });
    }

    const phoneRegex = /^(?:\+243|0)\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Numéro de téléphone invalide" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRole = validRoles.includes(role) ? role : "CLIENT";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: userRole,
      },
    });

    // ✅ AJOUT ICI (TRÈS IMPORTANT)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Retour COMPLET (comme login)
    res.json({
      message: "Utilisateur créé avec succès",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token // 🔥 ESSENTIEL
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/**
 * Login
 * body: { email, password }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Email ou mot de passe incorrect" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ error: "Email ou mot de passe incorrect" });

    // ✅ CORRECTION ICI
    const token = jwt.sign(
      { id: user.id, role: user.role }, // 🔥 CHANGÉ
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Connexion réussie",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users → récupérer tous les utilisateurs
router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, role: true }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;