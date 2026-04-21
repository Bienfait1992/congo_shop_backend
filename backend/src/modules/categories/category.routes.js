// import express from "express";
// import { PrismaClient } from "@prisma/client";
// import { authenticate } from "../../middlewares/auth.middleware.js";
// import multer from "multer";
// import path from "path";


// const prisma = new PrismaClient();
// const router = express.Router();

// // Configuration Multer
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/categories/"); // dossier où seront stockées les images
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });


// // CREATE CATEGORY avec upload d'icône
// router.post("/", authenticate, upload.single("icon"), async (req, res) => {
//   console.log("req.body:", req.body);
//   console.log("req.file:", req.file); // doit contenir filename, path, mimetype, etc.

//   const { name } = req.body;
//   const file = req.file;

//   if (!name || !file) {
//     return res.status(400).json({ error: "Le nom et l'icône sont obligatoires" });
//   }

//   try {
//     const category = await prisma.category.create({
//       data: {
//         name,
//         icon: `/uploads/categories/${file.filename}`,
//       },
//     });
//     res.json({ message: "Catégorie créée", category });
//   } catch (err) {
//     console.error("Erreur création catégorie :", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // GET ALL CATEGORIES
// router.get("/", async (req, res) => {
//   try {
//     const categories = await prisma.category.findMany({
//       select: {
//         id: true,
//         name: true,
//         icon: true
//       },
//       orderBy: { name: "asc" }
//     });
//     res.json(categories);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// // GET CATEGORY BY ID
// router.get("/:id", async (req, res) => {
//   try {

//     const { id } = req.params;

//     const category = await prisma.category.findUnique({
//       where: { id },
//       include: {
//         products: true
//       }
//     });

//     if (!category) {
//       return res.status(404).json({ message: "Catégorie introuvable" });
//     }

//     res.json(category);

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// // UPDATE CATEGORY
// router.patch("/:id", authenticate, async (req, res) => {
//   try {

//     const { id } = req.params;
//     const { name, icon } = req.body;

//     const category = await prisma.category.update({
//       where: { id },
//       data: {
//         name,
//         icon
//       }
//     });

//     res.json({
//       message: "Catégorie mise à jour",
//       category
//     });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// // DELETE CATEGORY
// router.delete("/:id", authenticate, async (req, res) => {
//   try {

//     const { id } = req.params;

//     await prisma.category.delete({
//       where: { id }
//     });

//     res.json({
//       message: "Catégorie supprimée"
//     });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// export default router;

import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../../middlewares/auth.middleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();
const router = express.Router();

// Création automatique du dossier uploads/categories si inexistant
const uploadDir = path.join("uploads", "categories");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// CREATE CATEGORY avec upload d'icône
router.post("/", authenticate, upload.single("icon"), async (req, res) => {
  try {
    const { name } = req.body;
    const file = req.file;

    if (!name || !file) {
      return res.status(400).json({ error: "Le nom et l'icône sont obligatoires" });
    }

    const category = await prisma.category.create({
      data: {
        name,
        icon: `uploads/categories/${file.filename}`, // chemin relatif vers l'image
      },
    });

    res.json({
      message: "Catégorie créée",
      category,
    });
  } catch (err) {
    console.error("Erreur création catégorie :", err);
    res.status(500).json({ error: err.message });
  }
});

// GET ALL CATEGORIES
router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, icon: true },
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET CATEGORY BY ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!category) {
      return res.status(404).json({ message: "Catégorie introuvable" });
    }

    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE CATEGORY (sans upload ici, tu peux ajouter upload.single("icon") si besoin)
router.patch("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: { name, icon },
    });

    res.json({
      message: "Catégorie mise à jour",
      category,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE CATEGORY
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.category.delete({ where: { id } });

    res.json({ message: "Catégorie supprimée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;