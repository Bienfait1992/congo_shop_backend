// import express from "express";
// import { PrismaClient } from "@prisma/client";
// import { authenticate } from "../../middlewares/auth.middleware.js";
// import { validate } from "./validate.js";
// import { createProductSchema, updateProductSchema, productIdParamsSchema } from "./product.schema.js";

// const prisma = new PrismaClient();
// const router = express.Router();

// // Créer un produit pour une boutique
// router.post(
//   "/",
//   authenticate,
//   validate(createProductSchema),
//   async (req, res) => {
//     try {
//       const {
//         name,
//         description,
//         price,
//         stock,
//         images,
//         shopId,
//         categoryId,
//         tags
//       } = req.body;

//       const shop = await prisma.shop.findUnique({ where: { id: shopId } });

//       if (!shop) {
//         return res.status(404).json({ message: "Boutique non trouvée" });
//       }

//       if (shop.ownerId !== req.userId) {
//         return res.status(403).json({ message: "Non autorisé" });
//       }

//       const product = await prisma.product.create({
//         data: {
//           name,
//           description,
//           price,
//           stock,
//           images,
//           tags: tags || [],
//           slug: slugify(name),
//           shopId,
//           categoryId
//         }
//       });

//       res.json(product);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   }
// );

// // Récupérer tous les produits
// router.get("/", async (req, res) => {
//   try {
//     const products = await prisma.product.findMany({
//        where: {
//     shop: { status: "APPROVED" } // filtre les produits des boutiques approuvées
//     },
//       include: {
//   shop: true,
//   category: true,
//   promotions: true,
//   ProductVariant: true,
//   _count: {
//     select: {
//       Wishlist: true,
//       ProductView: true,
//       orderItems: true
//     }
//   }
// }
//     });
//     res.json(products);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Récupérer un produit par ID
// router.get("/:id",validate(productIdParamsSchema, "params"),  async (req, res) => {
//   try {
//     const { id } = req.params;
//     const product = await prisma.product.findUnique({
//   where: { id },
//   include: {
//     shop: true,
//     category: true,
//     promotions: true,
//     ProductVariant: true,
//     ProductView: true,
//     Wishlist: true
//   }
// });

//     if (!product) return res.status(404).json({ message: "Produit non trouvé" });
//     if (product.shop.status !== "APPROVED") {
//       return res.status(403).json({ message: "Produit indisponible" });
//     }
//     res.json(product);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // GET /products/popular
// router.get("/popular", async (req, res) => {
//   const limit = parseInt(req.query.limit) || 6;
//   try {
//     const popularProducts = await prisma.product.findMany({
//       where: { shop: { status: "APPROVED" } },
//       orderBy: { salesCount: "desc" }, // ou autre critère
//       take: limit,
//       include: { shop: true, category: true, promotions: true }
//     });
//     res.json(popularProducts);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// /**
//  * GET /products/recommended?limit=6&categoryId=xxx
//  * Renvoie des produits recommandés
//  */
// router.get("/recommended", async (req, res) => {
//   const limit = parseInt(req.query.limit) || 6;
//   const categoryId = req.query.categoryId || null;

//   try {
//     let recommendedProducts;

//     if (categoryId) {
//       // produits de la même catégorie
//       recommendedProducts = await prisma.product.findMany({
//         where: { 
//           shop: { status: "APPROVED" },
//           categoryId 
//         },
//         orderBy: { createdAt: "desc" },
//         take: limit,
//         include: { shop: true, category: true, promotions: true },
//       });
//     } else {
//       // si pas de catégorie, produits récents ou aléatoires
//       recommendedProducts = await prisma.product.findMany({
//         where: { shop: { status: "APPROVED" } },
//         orderBy: { createdAt: "desc" },
//         take: limit,
//         include: { shop: true, category: true, promotions: true },
//       });
//     }

//     res.json(recommendedProducts);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// // Mettre à jour un produit
// router.patch("/:id", authenticate,validate(productIdParamsSchema, "params"), validate(updateProductSchema), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const data = req.body;

//     const product = await prisma.product.findUnique({ where: { id } });
//     if (!product) return res.status(404).json({ message: "Produit non trouvé" });

//     if (data.name) {
//   data.slug = slugify(data.name);
// }

//     // Vérifier que l'utilisateur est le propriétaire de la boutique
//     if (product.shopId) {
//       const shop = await prisma.shop.findUnique({ where: { id: product.shopId } });
//       if (shop.ownerId !== req.userId) return res.status(403).json({ message: "Non autorisé" });
//     }

//     const updatedProduct = await prisma.product.update({
//       where: { id },
//       data
//     });

//     res.json(updatedProduct);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Supprimer un produit
// router.delete("/:id", authenticate, validate(productIdParamsSchema, "params"), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const product = await prisma.product.findUnique({ where: { id } });
//     if (!product) return res.status(404).json({ message: "Produit non trouvé" });

//     // Vérifier que l'utilisateur est le propriétaire de la boutique
//     const shop = await prisma.shop.findUnique({ where: { id: product.shopId } });
//     if (shop.ownerId !== req.userId) return res.status(403).json({ message: "Non autorisé" });

//     // await prisma.product.delete({ where: { id } });
//     await prisma.product.update({
//   where: { id },
//   data: {
//     deletedAt: new Date()
//   }
// });
//     res.json({ message: "Produit supprimé" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// export default router;

import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "./validate.js";
import {
  createProductSchema,
  updateProductSchema,
  productIdParamsSchema,
} from "./product.schema.js";
import slugify from "slugify";

const prisma = new PrismaClient();
const router = express.Router();

/**
 * =========================
 * CREATE PRODUCT
 * =========================
 */
router.post(
  "/",
  authenticate,
  validate(createProductSchema),
  async (req, res) => {
    try {
      const {
        name,
        description,
        price,
        stock,
        images,
        shopId,
        categoryId,
        tags,
        variants,
      } = req.body;

      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
      });

      if (!shop) {
        return res.status(404).json({ message: "Boutique non trouvée" });
      }

      if (shop.ownerId !== req.userId) {
        return res.status(403).json({ message: "Non autorisé" });
      }

      const product = await prisma.product.create({
        data: {
          name,
          description,
          price,
          stock,
          images: images || [],
          tags: tags || [],
          slug: slugify(name, { lower: true, strict: true }),
          shopId,
          categoryId,
          variants: variants
          ? {
              create: JSON.parse(variants),
            }
          : undefined,
        },
      });

      return res.json(product);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * =========================
 * POPULAR PRODUCTS
 * =========================
 */
router.get("/popular", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const products = await prisma.product.findMany({
      where: {
        shop: { status: "APPROVED" },
      },
      orderBy: {
        salesCount: "desc",
      },
      take: limit,
      include: {
        shop: true,
        category: true,
        promotions: true,
      },
    });

    return res.json(products);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * =========================
 * RECOMMENDED PRODUCTS
 * =========================
 */
router.get("/recommended", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const categoryId = req.query.categoryId || undefined;

    const products = await prisma.product.findMany({
      where: {
        shop: { status: "APPROVED" },
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      include: {
        shop: true,
        category: true,
        promotions: true,
      },
    });

    return res.json(products);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * =========================
 * GET ALL PRODUCTS
 * =========================
 */
router.get("/", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        shop: { status: "APPROVED" },
        deletedAt: null,
      },
      include: {
        shop: true,
        category: true,
        promotions: true,
        variants: true,
        _count: {
          select: {
            Wishlist: true,
            ProductView: true,
            orderItems: true,
          },
        },
      },
    });

    return res.json(products);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * =========================
 * GET PRODUCT BY ID
 * =========================
 */
router.get(
  "/:id",
  validate(productIdParamsSchema, "params"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          shop: true,
          category: true,
          promotions: true,
          variants: true,
          ProductView: true,
          Wishlist: true,
        },
      });

      if (!product || product.deletedAt) {
        return res.status(404).json({ message: "Produit non trouvé" });
      }

      if (product.shop.status !== "APPROVED") {
        return res.status(403).json({ message: "Produit indisponible" });
      }

      return res.json(product);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * =========================
 * UPDATE PRODUCT
 * =========================
 */
router.patch(
  "/:id",
  authenticate,
  validate(productIdParamsSchema, "params"),
  validate(updateProductSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product || product.deletedAt) {
        return res.status(404).json({ message: "Produit non trouvé" });
      }

      const shop = await prisma.shop.findUnique({
        where: { id: product.shopId },
      });

      if (!shop || shop.ownerId !== req.userId) {
        return res.status(403).json({ message: "Non autorisé" });
      }

      // update slug si nom change
      if (data.name) {
        data.slug = slugify(data.name, { lower: true, strict: true });
      }

      const updatedProduct = await prisma.product.update({
        where: { id },
        data,
      });

      return res.json(updatedProduct);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * =========================
 * DELETE PRODUCT (SOFT DELETE)
 * =========================
 */
router.delete(
  "/:id",
  authenticate,
  validate(productIdParamsSchema, "params"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product || product.deletedAt) {
        return res.status(404).json({ message: "Produit non trouvé" });
      }

      const shop = await prisma.shop.findUnique({
        where: { id: product.shopId },
      });

      if (!shop || shop.ownerId !== req.userId) {
        return res.status(403).json({ message: "Non autorisé" });
      }

      await prisma.product.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      return res.json({ message: "Produit supprimé (soft delete)" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

export default router;