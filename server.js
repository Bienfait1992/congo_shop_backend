import express from "express"; // ou const express = require("express") si commonjs
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { env } from "./src/config/env.js"
import bcrypt from "bcrypt"; 
import orderroutes from "./src/modules/orders/order.routes.js"
import shoproutes from "./src/modules/shops/shop.routes.js"
import productroutes from "./src/modules/products/product.routes.js"
import categoryroutes from "./src/modules/categories/category.routes.js"
import deliveryManroutes from "./src/modules/deliverymen/deliveryman.routes.js"
import deliveryroutes from "./src/modules/delivery/delivery.routes.js"
import { initSocket } from "./src/sockets/socket.js";
import paymentRoutes from "./src/modules/payments/payment.routes.js";
import authRouter from "./src/modules/auth/auth.routes.js"
import cartRoutes from "./src/modules/cart/cart.routes.js"
import reviewRoutes from "./src/modules/reviews/review.routes.js"
import searchRoutes from "./src/modules/products/search.routes.js"
import promotionRoutes from "./src/modules/promotions/promotion.routes.js"
import messageRoutes from "./src/modules/messages/message.routes.js"
import deliveryCompanyRoutes from "./src/modules/deliverymen/deliveryCompany.routes.js"
import deliveryAdressRoutes from "./src/modules/users/deliveryAdress.routes.js"
import wishlistRoutes from "./src/modules/wishlist/wishlist.routes.js"
import notificationRoutes from "./src/modules/notifications/notifications.routes.js"



dotenv.config();

// const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const app = express();
const server = http.createServer(app)

//initialisation socket
initSocket(server);


const prisma = new PrismaClient();
// const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Utilisation du router auth
app.use("/api/auth", authRouter); 
//Les api pour la commande
app.use("/api/orders", orderroutes);

//Les routes pour shop
app.use("/api/shops", shoproutes);

//Les routes pour produits
app.use("/api/products", productroutes);
app.use("/api/categories", categoryroutes);
app.use("/api/deliveryman", deliveryManroutes);
app.use("/api/deliveries", deliveryroutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/products", promotionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/deliverycompany", deliveryCompanyRoutes);
app.use("/api/deliveryadress", deliveryAdressRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/notifications", notificationRoutes);







app.post("/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: "Utilisateur introuvable" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      { userId: user.id },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Connexion réussie",
      token
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/logout", async (req, res) => {
  try {

    res.json({
      message: "Déconnexion réussie"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lancer le serveur
server.listen(env.PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${env.PORT}`);
});