import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),

  email: z
    .string()
    .email("Email invalide"),

  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),

  phone: z.string().optional()
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Email invalide"),

  password: z
    .string()
    .min(6, "Mot de passe incorrect")
});