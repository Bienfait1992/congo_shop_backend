import * as service from "./review.service.js";

export async function create(req, res) {
  try {
    const review = await service.createReview(req.userId, req.body);
    res.status(201).json(review);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

export async function getAll(req, res) {
  try {
    const { targetId, targetType, page, limit } = req.query;

    const data = await service.getReviews(
      targetId,
      targetType,
      Number(page) || 1,
      Number(limit) || 10
    );

    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

export async function getAverage(req, res) {
  try {
    const { targetId, targetType } = req.query;

    const data = await service.getAverageRating(targetId, targetType);

    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

export async function update(req, res) {
  try {
    const review = await service.updateReview(
      req.params.id,
      req.userId,
      req.body
    );
    res.json(review);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

export async function remove(req, res) {
  try {
    await service.deleteReview(req.params.id, req.userId);
    res.json({ message: "Supprimé" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}