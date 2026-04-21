import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { notificationService } from "./services/notificationService.js";

const prisma = new PrismaClient();
const router = express.Router();

/**
 * Créer une notification
 * POST /notifications
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { title, message, type, userId } = req.body;

    if (!title || !message || !userId) {
      return res.status(400).json({
        error: "title, message et userId sont obligatoires",
      });
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type || "INFO",
        userId,
      },
    });

    return res.json(notification);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 *Récupérer les notifications de l'utilisateur connecté
 * GET /notifications
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(notifications);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * 👁 Marquer une notification comme lue
 * PATCH /notifications/:id/read
 */
router.patch("/:id/read", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const notif = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
      },
    });

    return res.json(notif);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * 👁‍🗨 Marquer toutes les notifications comme lues
 * PATCH /notifications/read-all
 */
router.patch("/read-all", authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.userId,
        isRead: false,
        deletedAt: null,
      },
      data: {
        isRead: true,
      },
    });

    return res.json({
      message: "Toutes les notifications sont marquées comme lues",
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * 🗑 Supprimer une notification (soft delete)
 * DELETE /notifications/:id
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const notif = await prisma.notification.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return res.json(notif);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;