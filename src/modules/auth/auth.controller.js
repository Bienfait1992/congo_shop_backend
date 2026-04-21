import { registerSchema, loginSchema } from "./auth.validation.js";

export const register = async (req, res) => {
  try {

    const data = registerSchema.parse(req.body);

    // si validation OK
    // on peut créer l'utilisateur

  } catch (error) {

    return res.status(400).json({
      message: error.errors
    });

  }
};