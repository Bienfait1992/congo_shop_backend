// import jwt from "jsonwebtoken";
// import { env } from "../config/env.js";

// export const authenticate = (req, res, next) => {
//   const authHeader = req.headers["authorization"];
//   if (!authHeader) return res.status(401).json({ message: "Token manquant" });

//   const token = authHeader.split(" ")[1];
//   if (!token) return res.status(401).json({ message: "Token manquant" });

//   try {
//     const decoded = jwt.verify(token, env.JWT_SECRET);
//     req.userId = decoded.userId; // ID de l'utilisateur connecté
//     next();
//   } catch (err) {
//     res.status(403).json({ message: "Token invalide" });
//   }
// };




import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const authenticate = async (req, res, next) => {
  console.log("=== Middleware authenticate ===");

  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    console.log("❌ Token manquant dans l'entête");
    return res.status(401).json({ message: "Token manquant" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log("❌ Token manquant après split");
    return res.status(401).json({ message: "Token manquant" });
  }

  console.log("🔑 Token reçu :", token);

  try {
    // Décoder le token
    const decoded = jwt.verify(token, env.JWT_SECRET);
    console.log("✅ Token décodé :", decoded);

    // Récupérer l'utilisateur complet depuis la base pour connaître son rôle
    const user = await prisma.user.findUnique({
      where: { id: decoded.id || decoded.userId },
      select: { id: true, role: true }, // tu peux ajouter email, nom, etc.
    });

    if (!user) {
      console.log("❌ Utilisateur introuvable pour l'id :", decoded.id || decoded.userId);
      return res.status(401).json({ message: "Utilisateur introuvable" });
    }

    console.log("👤 Utilisateur trouvé :", user);

    // Injecter les infos utilisateur dans req
    req.userId = user.id;
    req.userRole = user.role;
    console.log("📌 req.userId :", req.userId, "| req.userRole :", req.userRole);

    // Mettre à jour lastSeen
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() },
    });
    console.log("⏱ lastSeen mis à jour pour l'utilisateur :", user.id);

    next(); // passe au prochain middleware / endpoint
  } catch (err) {
    console.error("❌ Erreur middleware authenticate :", err);
    res.status(403).json({ message: "Token invalide" });
  }
};