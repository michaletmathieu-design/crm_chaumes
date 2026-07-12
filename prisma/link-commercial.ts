import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const commercial = await prisma.user.findUnique({ where: { email: "breul.julie@hotmail.com" } });
  const band = await prisma.band.findUnique({ where: { id: 'band1' } });

  if (commercial && band) {
    await prisma.userBand.upsert({
      where: { userId_bandId: { userId: commercial.id, bandId: band.id } },
      update: {},
      create: { userId: commercial.id, bandId: band.id }
    });
    console.log("Commercial lie au groupe Reggie !");
  } else {
    console.log("Erreur: Commercial ou groupe non trouve.");
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })