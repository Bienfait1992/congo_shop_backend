import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../../middlewares/auth.middleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import slugify from "slugify";
import { v4 } from "uuid";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();
const router = express.Router();

// ======================
// UPLOAD CONFIG
// ======================
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

router.post("/", authenticate, upload.single("logo"), async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      phone,
      latitude,
      longitude,
      termsAccepted,
      termsAcceptedVersion,
    } = req.body;

    if (!name || !address || !latitude || !longitude) {
      return res.status(400).json({
        error: "Nom, adresse, latitude et longitude sont obligatoires",
      });
    }

    if (!termsAccepted || termsAccepted !== "true") {
      return res.status(400).json({
        error: "Vous devez accepter les conditions",
      });
    }

    const existingPending = await prisma.shop.count({
      where: { ownerId: req.userId, status: "PENDING" },
    });

    if (existingPending > 0) {
      return res.status(400).json({
        error: "Vous avez déjà une boutique en attente",
      });
    }

    const shop = await prisma.shop.create({
      data: {
        name,
        description: description || null,
        address,
        phone: phone || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        logo: req.file ? `/${uploadDir}/${req.file.filename}` : null,
        ownerId: req.userId,
        status: "PENDING",
        termsAcceptedAt: new Date(),
        termsAcceptedVersion: termsAcceptedVersion || "v1.0",
      },
    });

    res.json({ message: "Boutique créée", shop });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* =========================================================
   GET / UPDATE SHOP (inchangés)
========================================================= */

// ... garde ton code actuel sans changement ici

/* =========================================================
   CREATE PRODUCT
========================================================= */

/* ======================
   CREATE PRODUCT (PRO VARIANTS)
====================== */
/* ======================
   CREATE PRODUCT (VARIANTS FIXED)
====================== */
router.post(
  "/:shopId/products",
  authenticate,
  upload.array("images"),
  async (req, res) => {
    try {
      const shop = await prisma.shop.findUnique({
        where: { id: req.params.shopId },
      });

      if (!shop) return res.status(404).json({ message: "Boutique introuvable" });
      if (shop.ownerId !== req.userId) {
        return res.status(403).json({ message: "Non autorisé" });
      }

      const images = req.files
        ? req.files.map((f) => `/uploads/${f.filename}`)
        : [];

      let variants = [];
      try {
        variants = req.body.variants
          ? typeof req.body.variants === "string"
            ? JSON.parse(req.body.variants)
            : req.body.variants
          : [];
      } catch {
        return res.status(400).json({ error: "Variants invalides" });
      }

      const product = await prisma.product.create({
        data: {
          name: req.body.name,
          price: parseFloat(req.body.price),
          stock: parseInt(req.body.stock || "0"),
          description: req.body.description,
          currency: req.body.currency || "USD",
          images,
          categoryId: req.body.categoryId || null,
          shopId: shop.id,
          slug: slugify(req.body.name, { lower: true, strict: true }),
          
          variants: {
          create: variants.map((v) => ({
            sku: v.sku || uuidv4(),
            price: v.price ? parseFloat(v.price) : null,
            stock: parseInt(v.stock || 0),
            weight: v.weight ? parseFloat(v.weight) : null,
            isDefault: v.isDefault || false,
            images: v.images || [],
            attributes: v.attributes || {}, //IMPORTANT
          })),
        },
        },
        include: {
          variants: true,
        },
      });

      res.status(201).json(product);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

/* ======================
   UPDATE PRODUCT (VARIANTS FIXED)
====================== */
router.put(
  "/:shopId/products/:productId",
  authenticate,
  upload.array("images"),
  async (req, res) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.productId },
      });

      if (!product)
        return res.status(404).json({ message: "Produit introuvable" });

      const shop = await prisma.shop.findUnique({
        where: { id: product.shopId },
      });

      if (!shop || shop.ownerId !== req.userId) {
        return res.status(403).json({ message: "Non autorisé" });
      }

      const images =
        req.files?.length > 0
          ? req.files.map((f) => `/uploads/${f.filename}`)
          : product.images;

      let variants = [];
      try {
        variants = req.body.variants
          ? typeof req.body.variants === "string"
            ? JSON.parse(req.body.variants)
            : req.body.variants
          : [];
      } catch {
        return res.status(400).json({ error: "Variants invalides" });
      }

      const updated = await prisma.product.update({
        where: { id: product.id },
        data: {
          name: req.body.name || product.name,
          price: req.body.price ? parseFloat(req.body.price) : product.price,
          stock: req.body.stock ? parseInt(req.body.stock) : product.stock,
          description: req.body.description || product.description,
          currency: req.body.currency || product.currency,
          images,
          categoryId: req.body.categoryId || product.categoryId,
        },
      });

      await prisma.productVariant.deleteMany({
        where: { productId: product.id },
      });

      if (variants.length > 0) {
        await prisma.productVariant.createMany({
          data: variants.map((v) => ({
          sku: v.sku || uuidv4(),
          price: v.price ? parseFloat(v.price) : null,
          stock: parseInt(v.stock || 0),
          weight: v.weight ? parseFloat(v.weight) : null,
          isDefault: v.isDefault || false,
          images: v.images || [],
          productId: product.id,
          attributes: v.attributes || {}, //IMPORTANT
        }))
        });
      }

      const fullProduct = await prisma.product.findUnique({
        where: { id: product.id },
        include: {
          variants: true,
        },
      });

      res.json(fullProduct);
    } catch (err) {
      console.error("UPDATE PRODUCT ERROR:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

/* ======================
   DELETE PRODUCT
====================== */
router.delete(
  "/:shopId/products/:productId",
  authenticate,
  async (req, res) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.productId },
      });

      if (!product)
        return res.status(404).json({ message: "Produit introuvable" });

      const shop = await prisma.shop.findUnique({
        where: { id: product.shopId },
      });

      if (!shop || shop.ownerId !== req.userId) {
        return res.status(403).json({ message: "Non autorisé" });
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { deletedAt: new Date() },
      });

      await prisma.productVariant.deleteMany({
        where: { productId: product.id },
      });

      res.json({ message: "Produit supprimé" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);


router.get("/", authenticate, async (req, res) => {
  try {
    // sécurité admin
    if (req.userRole !== "ADMIN") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const shops = await prisma.shop.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(shops);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});



router.get("/my-shops", authenticate, async (req, res) => {
  try {
    const shops = await prisma.shop.findMany({
      where: {
        ownerId: req.userId,
      },
      include: {
        products: true,
      },
    });

    res.json(shops);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/:id/products", async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: req.params.id },
      include: {
        products: {
          where: { deletedAt: null },
          include: {
            variants: true,
          },
        },
      },
    });

    if (!shop) {
      return res.status(404).json({ error: "Boutique introuvable" });
    }

    res.json({
      shop: {
        id: shop.id,
        name: shop.name,
      },
      products: shop.products,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


router.get("/search", async (req, res) => {
  const { q } = req.query;

  try {
    const shops = await prisma.shop.findMany({
      where: {
        name: {
          contains: q,
          mode: "insensitive",
        },
        status: "APPROVED",
      },
    });

    res.json(shops);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.patch("/:id/approve", authenticate, async (req, res) => {
  try {
    if (req.userRole !== "ADMIN") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const { action } = req.body;

    const shop = await prisma.shop.findUnique({
      where: { id: req.params.id },
    });

    if (!shop) {
      return res.status(404).json({ error: "Boutique introuvable" });
    }

    let status;

    switch (action) {
      case "APPROVE":
        status = "APPROVED";
        break;
      case "REJECT":
        status = "REJECTED";
        break;
      case "SUSPEND":
        status = "SUSPENDED";
        break;
      case "BAN":
        status = "BANNED";
        break;
      case "ACTIVATE":
        status = "APPROVED";
        break;
      default:
        return res.status(400).json({ error: "Action invalide" });
    }

    // 🔥 update shop
    const updatedShop = await prisma.shop.update({
      where: { id: shop.id },
      data: { status },
    });

    // 🔥 LOGIQUE MÉTIER IMPORTANTE
    if (action === "APPROVE") {
      await prisma.user.update({
        where: { id: shop.ownerId },
        data: { role: "SELLER" },
      });
    }

    // optionnel (mais recommandé)
    if (action === "BAN") {
      await prisma.user.update({
        where: { id: shop.ownerId },
        data: { role: "CLIENT" },
      });
    }

    res.json({ message: "Statut mis à jour", shop: updatedShop });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
export default router;