"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function addTask(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const opportunityId = formData.get("opportunityId") as string;
  const title = formData.get("title") as string;
  const dueDate = formData.get("dueDate") as string;
  const type = formData.get("type") as string;
  const priority = formData.get("priority") as string;

  if (!opportunityId || !title || !dueDate) return;

  await prisma.task.create({
    data: {
      opportunityId,
      title,
      dueDate: new Date(dueDate),
      type,
      priority,
      assignedToId: session.user.id,
    },
  });

  revalidatePath(`/opportunities/${opportunityId}`);
}