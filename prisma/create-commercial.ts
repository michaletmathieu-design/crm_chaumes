import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = "breul.julie@hotmail.com"
  const password = "password123"
  
  const hashedPassword = await bcrypt.hash(password, 10)
  
  await prisma.user.deleteMany({ where: { email } })
  
  const commercial = await prisma.user.create({
    data: {
      email: email,
      passwordHash: hashedPassword,
      firstName: "Julie",
      lastName: "Breul",
      role: "COMMERCIAL"
    }
  })

  // On assigne les 5 premiers prospects a ce commercial
  const firstProspects = await prisma.prospect.findMany({ take: 5 })
  
  for (const prospect of firstProspects) {
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { assignedToId: commercial.id }
    })
  }

  console.log("Compte Commercial cree et 5 prospects assignes !")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })