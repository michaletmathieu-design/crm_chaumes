"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function assignOpportunity(opportunityId: string, prospectId: string, userId: string | null) {
  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: { assignedToId: userId }, // Si null, ça désassigne le commercial
  });
  
  // On rafraîchit la page du prospect et la liste globale
  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/prospects");
}