"use server";

import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Fonction pour nettoyer le nom et la ville
function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

export async function importProspects(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) return;

  let text = await file.text();
  const lines = text.split('\n');
  
  // --- NOUVEAU : AUTO-RÉPARATION DU DÉCALAGE IA ---
  // On vérifie si c'est un export de notre IA (présence de l'en-tête spécifique)
  const isAIFormat = lines[0]?.includes("Nom;Ville;Type;Contact;Telephone");

  if (isAIFormat) {
    const fixedLines = lines.map(line => {
      const parts = line.split(';');
      
      // On doit avoir exactement 13 colonnes (12 point-virgules)
      while (parts.length < 13) {
        // Si on a 12 colonnes et que la 4ème (Contact) est un numéro, l'IA a oublié le ;;
        if (parts.length === 12 && /^0\d/.test((parts[3] || "").replace(/\s/g, ""))) {
          parts.splice(3, 0, ""); // On insère un champ vide à la place du Contact
        } 
        // Si on a 12 colonnes et que la 6ème (Email) est un site web, l'IA a oublié le ;;
        else if (parts.length === 12 && /^https?:\/\//.test(parts[5] || "")) {
          parts.splice(5, 0, ""); // On insère un champ vide à la place de l'Email
        }
        // Sinon on complète juste la fin avec des champs vides pour ne pas planter
        else {
          parts.push("");
        }
      }
      return parts.join(';');
    });
    
    text = fixedLines.join('\n');
  }
  // -----------------------------------------------

  const results = Papa.parse(text, { header: true, skipEmptyLines: true });
  const rows = results.data as unknown as Record<string, string>[];

  // 1. On formate les données
  const fileData = rows.map(row => {
    const name = row["Nom"] || row["nom"] || row["NOM"] || row["Name"] || "";
    const city = row["Ville"] || row["ville"] || row["VILLE"] || row["City"] || "";
    
    if (!name || !city) return null;

    return {
      rawName: name,
      rawCity: city,
      ref: normalize(name) + normalize(city),
      data: {
        name: name,
        city: city,
        venueType: (row["Type"] || row["type"] || row["TYPE"] || "BAR").toUpperCase(),
        contactName: row["Contact"] || row["contact"] || null,
        phone: row["Telephone"] || row["telephone"] || row["Tel"] || row["tel"] || null,
        email: row["Email"] || row["email"] || row["MAIL"] || null,
        capacity: parseInt(row["Jauge"] || row["jauge"] || row["Capacite"] || "0") || null,
        minFee: parseInt(row["Cachet Min"] || row["CachetMin"] || "0") || null,
        maxFee: parseInt(row["Cachet Max"] || row["CachetMax"] || "0") || null,
        status: "ACTIVE" 
      }
    };
  }).filter(Boolean);

  const refsInFile = fileData.map(d => d!.ref);
  const citiesInFile = [...new Set(fileData.map(d => d!.rawCity.trim().toLowerCase()))];

  // 2. Transaction SQL
  await prisma.$transaction(async (tx) => {

    if (citiesInFile.length > 0) {
      const existingInCity = await tx.prospect.findMany({
        where: {
          city: { in: citiesInFile, mode: "insensitive" },
          status: "ACTIVE"
        },
        select: { id: true, name: true, city: true }
      });

      const toInactiveIds = existingInCity
        .filter(p => !refsInFile.includes(normalize(p.name) + normalize(p.city)))
        .map(p => p.id);

      if (toInactiveIds.length > 0) {
        await tx.prospect.updateMany({
          where: { id: { in: toInactiveIds } },
          data: { status: "INACTIVE" }
        });
      }
    }

    for (const item of fileData) {
      if (!item) continue;

      const existing = await tx.prospect.findFirst({
        where: {
          name: { equals: item.rawName, mode: "insensitive" },
          city: { equals: item.rawCity, mode: "insensitive" }
        }
      });

      if (existing) {
        await tx.prospect.update({
          where: { id: existing.id },
          data: item.data 
        });
      } else {
        await tx.prospect.create({
          data: item.data
        });
      }
    }
  });

  revalidatePath("/prospects");
}