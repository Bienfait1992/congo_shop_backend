// import express from "express";
// import { PrismaClient } from "@prisma/client";
// import { authenticate } from "../../middlewares/auth.middleware.js";
// import { getIO, messageSockets } from "../../sockets/socket.js";

// const prisma = new PrismaClient();
// const router = express.Router();

// /**
//  * 1️⃣ Envoyer un message (avec Socket.io)
//  * body: { receiverId, message, conversationId (optionnel) }
//  */
// router.post("/", authenticate, async (req, res) => {
//   const { receiverId, message, conversationId } = req.body;

//   console.log("🟢 ===== NEW MESSAGE REQUEST =====");
//   console.log("👤 senderId (req.userId):", req.userId);
//   console.log("📥 receiverId:", receiverId);
//   console.log("💬 message:", message);
//   console.log("🧵 conversationId:", conversationId);

//   // 🔴 Validation
//   if (!receiverId || !message) {
//     console.log("❌ Données manquantes !");
//     return res.status(400).json({
//       error: "receiverId et message sont obligatoires",
//     });
//   }

//   try {
//     console.log("📦 Création du message en DB...");

//     const newMessage = await prisma.message.create({
//       data: {
//         senderId: req.userId,
//         receiverId,
//         message,
//         conversationId: conversationId || null,
//       },
//       include: {
//         sender: { select: { id: true, name: true } },
//         receiver: { select: { id: true, name: true } },
//       },
//     });

//     console.log("✅ Message créé avec succès !");
//     console.log("🆔 messageId:", newMessage.id);
//     console.log("➡️ senderId:", newMessage.senderId);
//     console.log("➡️ receiverId:", newMessage.receiverId);

//     // 🔥 SOCKET.IO (ROOM SYSTEM)
//     const io = getIO();

//     console.log("📡 Tentative d'émission socket...");
//     console.log("🎯 ROOM cible (receiverId):", receiverId);

//     // 👉 envoie à TOUS les sockets du user
//     io.to(receiverId).emit("new_message", newMessage);

//     console.log("✅ Message émis via socket !");
//     console.log("📩 Event: new_message");
//     console.log("📦 Payload:", newMessage);

//     // (optionnel) envoyer aussi au sender pour sync multi-device
//     console.log("📡 Sync sender (optionnel)");
//     io.to(req.userId).emit("new_message", newMessage);

//     console.log("🟢 ===== END MESSAGE REQUEST =====");

//     res.json({
//       message: "Message envoyé",
//       data: newMessage,
//     });
//   } catch (err) {
//     console.error("🔥 ERREUR ENVOI MESSAGE:");
//     console.error(err);

//     res.status(500).json({
//       error: err.message,
//     });
//   }
// });
// /**
//  * 2️⃣ Marquer un message comme lu
//  */
// router.patch("/:id/read", authenticate, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updated = await prisma.message.update({
//       where: { id },
//       data: { isRead: true }
//     });
//     res.json({ message: "Message marqué comme lu", data: updated });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /**
//  * 3️⃣ Récupérer tous les messages d’un utilisateur
//  */
// router.get("/", authenticate, async (req, res) => {
//   try {
//     const messages = await prisma.message.findMany({
//       where: { OR: [{ senderId: req.userId }, { receiverId: req.userId }] },
//       include: {
//         sender: { select: { id: true, name: true } },
//         receiver: { select: { id: true, name: true } }
//       },
//       orderBy: { createdAt: "asc" }
//     });
//     res.json(messages);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /**
//  * 4️⃣ Récupérer une conversation spécifique entre deux utilisateurs
//  * query: ?userId=<autreUtilisateurId>
//  */
// router.get("/conversation", authenticate, async (req, res) => {
//   const otherUserId = req.query.userId;
//   if (!otherUserId) return res.status(400).json({ error: "userId est obligatoire" });

//   try {
//     const conversationMessages = await prisma.message.findMany({
//       where: {
//         OR: [
//           { senderId: req.userId, receiverId: otherUserId },
//           { senderId: otherUserId, receiverId: req.userId }
//         ]
//       },
//       include: {
//         sender: { select: { id: true, name: true } },
//         receiver: { select: { id: true, name: true } }
//       },
//       orderBy: { createdAt: "asc" }
//     });

//     res.json(conversationMessages);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// export default router;

import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { getIO } from "../../sockets/socket.js";
import { notificationService } from "../notifications/services/notificationService.js";

const prisma = new PrismaClient();
const router = express.Router();

/**
 * Envoyer un message
 */
router.post("/", authenticate, async (req, res) => {
  console.log("🚀 ===== NEW MESSAGE REQUEST =====");

  const { receiverId, message, conversationId } = req.body;

  console.log("📦 BODY REÇU :", req.body);
  console.log("👤 senderId (req.userId) :", req.userId);
  console.log("📨 receiverId :", receiverId);
  console.log("💬 message :", message);
  console.log("🧵 conversationId :", conversationId);

  if (!receiverId || !message) {
    console.log("❌ VALIDATION FAILED : receiverId ou message manquant");
    return res.status(400).json({ error: "receiverId et message sont obligatoires" });
  }

  try {
    let conversation;

    // 1️⃣ Si conversationId existe → on l'utilise
    if (conversationId) {
      console.log("🔍 Recherche conversation par ID :", conversationId);

      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      console.log("📌 Conversation trouvée par ID :", conversation);
    }

    // 2️⃣ Sinon on cherche une conversation existante
    if (!conversation) {
      console.log("🔎 Recherche conversation existante entre users...");

      conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            { id: conversationId },
            {
              messages: {
                some: {
                  OR: [
                    { senderId: req.userId, receiverId },
                    { senderId: receiverId, receiverId: req.userId },
                  ],
                },
              },
            },
          ],
        },
      });

      console.log("📌 Conversation trouvée par recherche :", conversation);
    }

    //Si aucune conversation → on la crée
    if (!conversation) {
      console.log("🆕 Aucune conversation trouvée → création...");

      conversation = await prisma.conversation.create({
        data: {
          // vide pour le moment (ou ajouter user1/user2 si tu as)
        },
      });

      console.log("✅ Conversation créée :", conversation);
    }

    console.log("🧵 Conversation finale utilisée :", conversation);

    // ⚠️ création message
    console.log("💾 Création du message...");

    const newMessage = await prisma.message.create({
      data: {
        senderId: req.userId,
        receiverId,
        message,
        conversationId: conversation.id,
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });
const sender = await prisma.user.findUnique({
  where: { id: req.userId },
  select: { name: true }
});
    //AJOUT ICI
await notificationService.create({
  userId: receiverId,
title: `${sender.name} vous a envoyé un message`,
  message: newMessage.message,
  type: "CHAT",
  entityId: newMessage.id,
});

    console.log("✅ MESSAGE CRÉÉ :", newMessage);

    const io = getIO();

    console.log("📡 Socket emit vers receiver :", receiverId);
    io.to(receiverId).emit("new_message", newMessage);

    console.log("📡 Socket emit vers sender :", req.userId);
    io.to(req.userId).emit("new_message", newMessage);

    console.log("MESSAGE FLOW COMPLETED");

    res.json({ message: "Message envoyé", data: newMessage });

  } catch (err) {
    console.log("🔥🔥 MESSAGE ERROR START 🔥🔥");
    console.error("❌ ERREUR COMPLETE :", err);
    console.log("🔥🔥 MESSAGE ERROR END 🔥🔥");

    res.status(500).json({ error: err.message });
  }
});

/**
 * Marquer message comme lu
 */
router.patch("/mark-read", authenticate, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: "ids manquants" });

  try {
    const updated = await prisma.message.updateMany({
      where: { id: { in: ids } },
      data: { isRead: true },
    });
    res.json({ message: "Messages marqués comme lus", data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Récupérer conversation avec un autre utilisateur
 */
router.get("/conversation", authenticate, async (req, res) => {
  const otherUserId = req.query.userId;
  if (!otherUserId) return res.status(400).json({ error: "userId est obligatoire" });

  try {
    const conversationMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: req.userId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({ messages: conversationMessages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;