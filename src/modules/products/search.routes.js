// import express from "express";
// import { PrismaClient } from "@prisma/client";

// const router = express.Router();
// const prisma = new PrismaClient();

// router.get("/", async (req, res) => {
//   try {
//     const { q, category, minPrice, maxPrice, sort, page = 1, limit = 10 } = req.query;
//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     // 🔎 FILTRAGE
//     const filters = { AND: [] };

//     if (q) {
//       filters.AND.push({
//         OR: [
//           { name: { contains: q, mode: "insensitive" } },
//           { description: { contains: q, mode: "insensitive" } }
//         ]
//       });
//     }

//     if (category) filters.AND.push({ categoryId: Number(category) });

//     if (minPrice || maxPrice) {
//       filters.AND.push({
//         price: {
//           gte: minPrice ? parseFloat(minPrice) : undefined,
//           lte: maxPrice ? parseFloat(maxPrice) : undefined
//         }
//       });
//     }

//     const orderBy = (() => {
//       switch (sort) {
//         case "price_asc": return { price: "asc" };
//         case "price_desc": return { price: "desc" };
//         case "newest": return { createdAt: "desc" };
//         case "name_asc": return { name: "asc" };
//         default: return { createdAt: "desc" };
//       }
//     })();

//     // 🔃 DATA + COUNT
//     const [products, total] = await Promise.all([
//       prisma.product.findMany({
//         where: filters.AND.length > 0 ? filters : {},
//         orderBy,
//         skip,
//         take: parseInt(limit),
//         include: { category: true } // ou images si tu veux
//       }),
//       prisma.product.count({
//         where: filters.AND.length > 0 ? filters : {}
//       })
//     ]);

//     res.json({
//       data: products,
//       pagination: {
//         total,
//         page: parseInt(page),
//         limit: parseInt(limit),
//         totalPages: Math.ceil(total / limit)
//       }
//     });

//   } catch (err) {
//     console.error("SEARCH API ERROR:", err);
//     res.status(500).json({ error: "Erreur serveur" });
//   }
// });

// export default router;


import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const {
      q = "",
      category,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    console.log("=== SEARCH API CALLED ===");
    console.log("q:", q, "| type:", typeof q);
    console.log("category:", category, "| type:", typeof category);

    const pageInt = Math.max(parseInt(page) || 1, 1);
    const limitInt = Math.max(parseInt(limit) || 10, 1);
    const skip = (pageInt - 1) * limitInt;
    console.log("Pagination skip:", skip, "limit:", limitInt);

    // 🔹 Construire le WHERE (sans tenter de Number() sur UUID)
    let where = {};
    const AND = [];

    // 📌 Filtre catégorie (UUID)
    if (category && typeof category === "string" && category.trim() !== "") {
      console.log("➤ Applying category filter:", category);
      AND.push({ categoryId: category }); 
      // **categoryId doit être le champ string dans Prisma**
    }

    // 📌 Filtre mot‑clé
    if (q.trim()) {
      console.log("➤ Applying keyword search for:", q);
      AND.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    // 📌 Filtre prix
    if (!isNaN(parseFloat(minPrice))) {
      const min = parseFloat(minPrice);
      console.log("➤ Applying minPrice:", min);
      AND.push({ price: { gte: min } });
    }
    if (!isNaN(parseFloat(maxPrice))) {
      const max = parseFloat(maxPrice);
      console.log("➤ Applying maxPrice:", max);
      AND.push({ price: { lte: max } });
    }

    if (AND.length > 0) {
      where = { AND };
    }
    console.log("👉 Final WHERE:", JSON.stringify(where, null, 2));

    // 🔹 Tri
    const orderBy = (() => {
      switch (sort) {
        case "price_asc":
          return { price: "asc" };
        case "price_desc":
          return { price: "desc" };
        case "newest":
          return { createdAt: "desc" };
        default:
          return { createdAt: "desc" };
      }
    })();
    console.log("OrderBy:", orderBy);

    // 📌 Exécution Prisma
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limitInt,
        include: { category: true },
      }),
      prisma.product.count({ where }),
    ]);

    console.log("Products found:", products.length, "| Total:", total);

    res.json({
      data: products,
      pagination: {
        total,
        page: pageInt,
        limit: limitInt,
        totalPages: Math.ceil(total / limitInt),
      },
    });
  } catch (err) {
    console.error("SEARCH API ERROR:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;