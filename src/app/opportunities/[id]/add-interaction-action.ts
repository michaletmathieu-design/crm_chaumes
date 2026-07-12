"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function addInteraction(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const opportunityId = formData.get("opportunityId") as string;
  const type = formData.get("type") as string;
  const content = formData.get("content") as string;

  if (!opportunityId || !type || !content) return;

  await prisma.interaction.create({
    data: {
      opportunityId,
      type,
      content,
    },
  });

  revalidatePath(`/opportunities/${opportunityId}`);
}