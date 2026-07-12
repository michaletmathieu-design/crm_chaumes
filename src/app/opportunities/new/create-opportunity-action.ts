"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createOpportunity(prevState: { error?: string }, formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Non autorisé" };
  }

  const prospectId = formData.get("prospectId") as string;
  const bandId = formData.get("bandId") as string;

  if (!prospectId || !bandId) {
    return { error: "Veuillez choisir un prospect et un groupe." };
  }

  // Vérifie si l'opportunité existe déjà
  const existing = await prisma.opportunity.findUnique({
    where: { prospectId_bandId: { prospectId, bandId } },
  });

  if (existing) {
    return { error: "Cette opportunité existe déjà pour ce groupe et ce prospect." };
  }

  // Si c'est un commercial, on l'assigne automatiquement. Si c'est un admin, on laisse vide.
  const assignedToId = session.user.role === "COMMERCIAL" ? session.user.id : null;

  await prisma.opportunity.create({
    data: {
      prospectId,
      bandId,
      assignedToId,
      stage: "NEW",
    },
  });

  revalidatePath("/prospects");
  redirect("/prospects");
}