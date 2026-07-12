"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createUser(prevState: { error?: string }, formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Non autorisé");
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const role = formData.get("role") as string;
    const bandIds = formData.getAll("bandIds").filter(Boolean) as string[];

  // Validations basiques
  if (!email || !password || !firstName || !lastName || !role) {
    return { error: "Tous les champs obligatoires doivent être remplis." };
  }

  if (password.length < 6) {
    return { error: "Le mot de passe doit faire au moins 6 caractères." };
  }

  // Vérifie que l'email n'existe pas déjà
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Un compte avec cet email existe déjà." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      role,
      members: role === "MUSICIAN" && bandIds.length > 0
        ? { create: bandIds.map(bandId => ({ bandId })) }
        : undefined,
    },
  });

  // Si c'est un commercial, on lie aussi aux groupes choisis
  if (role === "COMMERCIAL" && bandIds.length > 0) {
    await prisma.userBand.createMany({
      data: bandIds.map(bandId => ({ userId: user.id, bandId })),
      skipDuplicates: true,
    });
  }

  revalidatePath("/users");
  redirect("/users");
}