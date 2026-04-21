// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// async function cleanupRejectedShops() {
//   const twoDaysAgo = new Date(Date.now() - 2*24*60*60*1000);

//   const deleted = await prisma.shop.deleteMany({
//     where: {
//       status: "REJECTED",
//       rejectedAt: { lte: twoDaysAgo }
//     }
//   });

//   console.log(`Boutiques supprimées : ${deleted.count}`);
// }

// cleanupRejectedShops()
//   .catch(console.error)
//   .finally(() => prisma.$disconnect());

// cleanupRejectedShops.js
// cleanupRejectedShops.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Archive une boutique rejetée avant suppression
async function archiveRejectedShop(shop) {
  try {
    await prisma.archivedShop.create({
      data: {
        shopId: shop.id,
        name: shop.name,
        description: shop.description,
        logo: shop.logo,
        address: shop.address,
        phone: shop.phone,
        status: shop.status,
        rejectedAt: shop.rejectedAt,
        ownerId: shop.ownerId,
        createdAt: shop.createdAt,
      },
    });
    console.log(`Boutique archivée : ${shop.name}`);
  } catch (err) {
    console.error(`Erreur archivage boutique ${shop.name} :`, err);
  }
}

// Fonction principale de nettoyage
async function cleanupRejectedShops() {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  try {
    // Récupérer les boutiques rejetées depuis plus de 2 jours
    const shopsToDelete = await prisma.shop.findMany({
      where: {
        status: "REJECTED",
        rejectedAt: { lte: twoDaysAgo },
      },
    });

    console.log(`Boutiques à archiver et supprimer : ${shopsToDelete.length}`);

    // Archiver chaque boutique avant suppression
    for (const shop of shopsToDelete) {
      await archiveRejectedShop(shop);
    }

    // Supprimer les boutiques rejetées
    const deleted = await prisma.shop.deleteMany({
      where: {
        status: "REJECTED",
        rejectedAt: { lte: twoDaysAgo },
      },
    });

    console.log(`Boutiques supprimées : ${deleted.count}`);
  } catch (err) {
    console.error("Erreur lors de la suppression des boutiques rejetées :", err);
    // Optionnel : envoyer un email ou notification à l'admin
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution du script
cleanupRejectedShops();