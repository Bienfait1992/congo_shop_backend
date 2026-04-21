// import { Server } from "socket.io";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();
// let io;
// const messageSockets = new Map();
// const deliverySockets = new Map(); // <-- ajout

// export const initSocket = (server) => {
//   io = new Server(server, { cors: { origin: "*" } });

//   io.on("connection", (socket) => {
//     console.log("User connecté:", socket.id);

//     // LIVREUR
//     socket.on("register_delivery", (deliveryManId) => {
//       deliverySockets.set(deliveryManId, socket.id);
//     });

//     // Register user in a room
//     socket.on("register_message", (userId) => {
//       socket.join(userId);
//       messageSockets.set(userId, socket.id);
//       io.emit("user_online", userId);
//     });

//     // Typing
//     socket.on("typing", ({ senderId, receiverId }) => {
//       io.to(receiverId).emit("typing", senderId);
//     });
//     socket.on("stop_typing", ({ senderId, receiverId }) => {
//       io.to(receiverId).emit("stop_typing", senderId);
//     });

//     // Disconnect
//     socket.on("disconnect", () => {
//       console.log("User déconnecté:", socket.id);
//       for (let [id, sId] of messageSockets.entries())
//         if (sId === socket.id) messageSockets.delete(id);
//       for (let [id, sId] of deliverySockets.entries())
//         if (sId === socket.id) deliverySockets.delete(id);
//     });
//   });

//   return io;
// };

// export const getIO = () => io;
// export { messageSockets, deliverySockets }; // <-- export ajouté


import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

let io;

// 🔥 SOCKET MAPS
const messageSockets = new Map();
const deliverySockets = new Map();
const notificationSockets = new Map(); // ✅ AJOUT

export const initSocket = (server) => {
  io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log("User connecté:", socket.id);

    // =============================
    // 📩 CHAT
    // =============================
    socket.on("register_message", (userId) => {
      socket.join(userId);
      messageSockets.set(userId, socket.id);
      io.emit("user_online", userId);
    });

    // =============================
    // 🚚 LIVRAISON
    // =============================
    socket.on("register_delivery", (deliveryManId) => {
      deliverySockets.set(deliveryManId, socket.id);
    });

    // =============================
    // 🔔 NOTIFICATIONS
    // =============================
    socket.on("register_notification", (userId) => {
      notificationSockets.set(userId, socket.id);
    });

    // =============================
    // ✍️ TYPING
    // =============================
    socket.on("typing", ({ senderId, receiverId }) => {
      io.to(receiverId).emit("typing", senderId);
    });

    socket.on("stop_typing", ({ senderId, receiverId }) => {
      io.to(receiverId).emit("stop_typing", senderId);
    });

    // =============================
    // ❌ DISCONNECT CLEAN
    // =============================
    socket.on("disconnect", () => {
      console.log("User déconnecté:", socket.id);

      for (let [id, sId] of messageSockets.entries()) {
        if (sId === socket.id) messageSockets.delete(id);
      }

      for (let [id, sId] of deliverySockets.entries()) {
        if (sId === socket.id) deliverySockets.delete(id);
      }

      for (let [id, sId] of notificationSockets.entries()) {
        if (sId === socket.id) notificationSockets.delete(id);
      }
    });
  });

  return io;
};

export const getIO = () => io;

//EXPORTS
export {
  messageSockets,
  deliverySockets,
  notificationSockets
};