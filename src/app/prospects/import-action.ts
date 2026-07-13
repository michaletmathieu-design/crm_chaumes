"use server";

import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function importProspects(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) return;

  const text = await file.text();
  const results = Papa.parse(text, { header: true, skipEmptyLines: true });

  let count = 0;

   for (const row of (results.data as unknown as Record<string, string>[])) {
    const name = row["Nom"] || row["nom"] || row["NOM"] || row["Name"] || "";
    const city = row["Ville"] || row["ville"] || row["VILLE"] || row["City"] || "";
    const venueType = row["Type"] || row["type"] || row["TYPE"] || "BAR";
    const contactName = row["Contact"] || row["contact"] || "";
    const phone = row["Telephone"] || row["telephone"] || row["Tel"] || row["tel"] || "";
    const email = row["Email"] || row["email"] || row["MAIL"] || "";
    const capacity = row["Jauge"] || row["jauge"] || row["Capacite"] || "0";
    const minFee = row["Cachet Min"] || row["CachetMin"] || "0";
    const maxFee = row["Cachet Max"] || row["CachetMax"] || "0";

    if (!name) continue;

    await prisma.prospect.create({
      data: {
        name: name,
        city: city,
        venueType: venueType.toUpperCase(),
        contactName: contactName || null,
        phone: phone || null,
        email: email || null,
        capacity: parseInt(capacity) || null, 
        minFee: parseInt(minFee) || null,
        maxFee: parseInt(maxFee) || null,
      },
    });
    count++;
  }

  revalidatePath("/prospects");

}