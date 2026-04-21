import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
// import bcrypt from "bcrypt";

const token = jwt.sign(
  { userId: user.id },
  env.JWT_SECRET,
  { expiresIn: env.JWT_EXPIRES_IN }
);