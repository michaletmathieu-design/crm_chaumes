import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = "mathieu.michalet@hotmail.fr"
  const password = "ZchSxQHFP6vsA7qniH7o"
  
  // On crypte le mot de passe
  const hashedPassword = await bcrypt.hash(password, 10)
  
  // On supprime l'ancien s'il existe
  await prisma.user.deleteMany({ where: { email } })
  
  // On cree le nouveau
  await prisma.user.create({
    data: {
      email: email,
      passwordHash: hashedPassword,
      firstName: "Mathieu",
      lastName: "Michalet",
      role: "ADMIN"
    }
  })

  console.log("Compte Admin cree avec succes !")
  console.log("Email: " + email)
  console.log("Mot de passe: " + password)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })