import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Supprime l'ancien admin s'il existe et cree le nouveau
  await prisma.user.deleteMany({ where: { email: "mathieu.michalet@hotmail.fr" } })
  
  await prisma.user.create({
    data: {
      email: "mathieu.michalet@hotmail.fr",
      passwordHash: "COLLE_ICI_LA_LONGUE_CHAINE_CRYPTOGRAPHIEE",
      firstName: "Mathieu",
      lastName: "Michalet",
      role: "ADMIN"
    }
  })

  console.log("Compte Admin cree !");
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })