// import dotenv from "dotenv";

// dotenv.config();

// export const env = {
//   PORT: process.env.PORT || 3000,

//   DATABASE_URL: process.env.DATABASE_URL,

//   JWT_SECRET: process.env.JWT_SECRET || "secret",

//   JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

//   UPLOAD_PATH: process.env.UPLOAD_PATH || "uploads"
// };

import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL non définie !");
}
if (!process.env.JWT_SECRET) {
  console.warn("⚠️ JWT_SECRET non définie, utilisez une valeur sécurisée !");
}

export const env = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || "secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  UPLOAD_PATH: process.env.UPLOAD_PATH || "uploads",
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || null
};