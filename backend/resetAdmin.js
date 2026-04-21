import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@congoshop.com"; 

  const updatedAdmin = await prisma.user.update({
    where: { email: adminEmail },
    data: { role: "ADMIN" }
  });

  console.log("Rôle de l'admin réinitialisé :", updatedAdmin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });