import express from "express";
import * as controller from "./review.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { createReviewSchema, updateReviewSchema } from "./reviews.schema.js";

const router = express.Router();

router.post("/", authenticate, (req, res) => {
  try {
    req.body = createReviewSchema.parse(req.body);
    return controller.create(req, res);
  } catch (e) {
    return res.status(400).json({ error: e.errors });
  }
});

router.get("/", controller.getAll);
router.get("/average", controller.getAverage);

router.patch("/:id", authenticate, (req, res) => {
  try {
    req.body = updateReviewSchema.parse(req.body);
    return controller.update(req, res);
  } catch (e) {
    return res.status(400).json({ error: e.errors });
  }
});

router.delete("/:id", authenticate, controller.remove);

export default router;