"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProspect(id: string, formData: FormData) {
  try {
    await prisma.prospect.update({
      where: { id },
      data: {
        name: formData.get("name") as string,
        city: formData.get("city") as string,
        contactName: (formData.get("contactName") as string) || null,
        phone: (formData.get("phone") as string) || null,
        email: (formData.get("email") as string) || null,
        venueType: (formData.get("venueType") as string) || "BAR",
        capacity: parseInt(formData.get("capacity") as string) || null,
        minFee: parseInt(formData.get("minFee") as string) || null,
        maxFee: parseInt(formData.get("maxFee") as string) || null,
        status: (formData.get("status") as string) || "ACTIVE",
      },
    });
    
    // Force le rechargement des données de la page
    revalidatePath(`/prospects/${id}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erreur lors de la modification" };
  }
}