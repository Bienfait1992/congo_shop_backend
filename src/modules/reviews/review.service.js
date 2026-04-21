import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ Créer un review
export async function createReview(userId, data) {
  const { targetId, targetType } = data;

  // Vérifier si déjà review
  const existing = await prisma.review.findFirst({
    where: { userId, targetId, targetType },
  });

  if (existing) {
    throw new Error("Vous avez déjà laissé un avis");
  }

  // Vérification cible (important)
  if (targetType === "PRODUCT") {
    const product = await prisma.product.findUnique({
      where: { id: targetId },
    });
    if (!product) throw new Error("Produit introuvable");
  }

  return prisma.review.create({
    data: {
      ...data,
      userId,
    },
  });
}

// ✅ Récupérer reviews avec pagination
export async function getReviews(targetId, targetType, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { targetId, targetType },
      include: {
        user: { select: { id: true, name: true, photo: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.count({
      where: { targetId, targetType },
    }),
  ]);

  return {
    data: reviews,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ✅ Moyenne des notes
export async function getAverageRating(targetId, targetType) {
  const result = await prisma.review.aggregate({
    where: { targetId, targetType },
    _avg: { rating: true },
    _count: true,
  });

  return {
    average: result._avg.rating || 0,
    count: result._count,
  };
}

// ✅ Update review
export async function updateReview(id, userId, data) {
  const review = await prisma.review.findUnique({ where: { id } });

  if (!review) throw new Error("Review introuvable");
  if (review.userId !== userId) throw new Error("Non autorisé");

  return prisma.review.update({
    where: { id },
    data,
  });
}

// ✅ Delete review
export async function deleteReview(id, userId) {
  const review = await prisma.review.findUnique({ where: { id } });

  if (!review) throw new Error("Review introuvable");
  if (review.userId !== userId) throw new Error("Non autorisé");

  return prisma.review.delete({ where: { id } });
}