"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateStage(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const opportunityId = formData.get("opportunityId") as string;
  const stage = formData.get("stage") as string;

  if (!opportunityId || !stage) return;

  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: { stage },
  });

  revalidatePath(`/opportunities/${opportunityId}`);
}