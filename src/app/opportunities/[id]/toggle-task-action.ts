"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleTask(formData: FormData) {
  const taskId = formData.get("taskId") as string;
  const isCompleted = formData.get("isCompleted") === "true";

  if (!taskId) return;

  await prisma.task.update({
    where: { id: taskId },
    data: { isCompleted: !isCompleted },
  });

  // On ne connaît pas l'opportunityId ici, mais revalidatePath va rafraîchir la page courante
  revalidatePath(`/opportunities/`);
}