"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function deleteBand(bandId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Non autorisé");
  }

  // Suppression en cascade manuelle des dépendances
  await prisma.document.deleteMany({ where: { bandId } });
  await prisma.quote.deleteMany({ where: { bandId } });
  await prisma.event.deleteMany({ where: { bandId } });

  await prisma.band.delete({ where: { id: bandId } });

  revalidatePath("/bands");
  redirect("/bands");
}