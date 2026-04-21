const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {

  console.log("Début du seed CongoShop...");

  const password = await bcrypt.hash("password123", 10);

  /*
  =====================
  ADMIN
  =====================
  */

  const admin = await prisma.user.upsert({
    where: { email: "admin@congoshop.com" },
    update: {},
    create: {
      name: "Admin CongoShop",
      email: "admin@congoshop.com",
      password: password,
      role: "ADMIN"
    }
  });

  console.log("Admin créé");


  console.log("Seed terminé avec succès !");
}

main()
  .catch((e) => {
    console.error("Erreur seed :", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });