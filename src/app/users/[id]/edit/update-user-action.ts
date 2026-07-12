"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateUser(prevState: { error?: string }, formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Non autorisé" };
  }

  const userId = formData.get("userId") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;
  const bandIds = formData.getAll("bandIds").filter(Boolean) as string[];

  if (!userId || !firstName || !lastName || !email || !role) {
    return { error: "Tous les champs obligatoires doivent être remplis." };
  }

  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id: userId } },
  });
  if (existing) {
    return { error: "Un autre compte utilise déjà cet email." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { firstName, lastName, email, role },
  });

  await prisma.userBand.deleteMany({ where: { userId } });

  if (bandIds.length > 0 && (role === "COMMERCIAL" || role === "MUSICIAN")) {
    await prisma.userBand.createMany({
      data: bandIds.map((bandId) => ({ userId, bandId })),
      skipDuplicates: true,
    });
  }

  revalidatePath("/users");
  redirect("/users");
}