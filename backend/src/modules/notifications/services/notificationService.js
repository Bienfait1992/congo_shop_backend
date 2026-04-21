import { PrismaClient } from "@prisma/client";
import { getIO } from "../../../sockets/socket.js";

const prisma = new PrismaClient();

export const notificationService = {
  async create({
    tx,
    userId,
    title,
    message,
    type,
    entityId = null,
    link = null,
  }) {
    const TAG = "📩 NOTIFICATION SERVICE";

    try {
      const db = tx || prisma;

      // =========================
      // 🔥 INPUT LOG (CRITIQUE)
      // =========================
      console.log("\n==============================");
      console.log(TAG + " START");
      console.log("==============================");

      console.log("📥 INPUT DATA:", {
        userId,
        title,
        message,
        type,
        entityId,
        link,
      });

      // =========================
      // USER CHECK
      // =========================
      console.log("🔎 CHECK USER EXISTS:", userId);

      const userExists = await db.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!userExists) {
        console.error("❌ USER NOT FOUND → abort notification:", userId);
        return null;
      }

      console.log("✅ USER EXISTS");

      // =========================
      // CREATE NOTIFICATION
      // =========================
      console.log("💾 CREATING NOTIFICATION...");

      const notification = await db.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          entityId,
          link,
        },
      });

      console.log("✅ NOTIFICATION CREATED:", {
        id: notification.id,
        userId,
        type,
        entityId,
      });

      // =========================
      // SOCKET EMIT
      // =========================
      console.log("⚡ SOCKET FETCH...");

      const io = getIO();

      if (!io) {
        console.warn("⚠️ SOCKET NOT AVAILABLE");
        return notification;
      }

      const payload = {
        id: notification.id,
        title,
        message,
        type,
        entityId,
        link,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      };

      console.log("📡 SOCKET EMIT TO:", userId);
      console.log("📦 SOCKET PAYLOAD:", payload);

      io.to(userId).emit("notification:new", payload);

      console.log("🚀 SOCKET SENT SUCCESSFULLY");
      console.log("📥 FULL CREATE INPUT:", arguments[0]);

      return notification;
    } catch (error) {
      console.error("\n NOTIFICATION ERROR");
      console.error("MESSAGE:", error.message);
      console.error("STACK:", error);

      throw error;
    }
  },
};