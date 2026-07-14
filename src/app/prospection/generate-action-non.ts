"use server";

import { GooglePlacesAPI } from "./google-places-service";
import { prisma } from "@/lib/prisma";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// FONCTION MAGIQUE : Transforme "Café de la Place" en "Cafe de la Place" (Pur ASCII)
function toAscii(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateLeads(formData: FormData) {
  const city = formData.get("city") as string;
  const venueType = formData.get("venueType") as string;
  const style = formData.get("style") as string;
  const quantity = parseInt(formData.get("quantity") as string) || 15;

  if (!city || !venueType || !style) {
    return { success: false, error: "Ville, type de lieu et style sont requis." };
  }

  try {
    const googleService = new GooglePlacesAPI(process.env.GOOGLE_MAPS_API_KEY!);
    let rawPlaces = await googleService.findLiveMusicVenues(city, venueType, quantity * 3);

    if (rawPlaces.length === 0) {
      return { success: false, error: "Aucun lieu trouve sur Google Maps pour cette zone." };
    }

    // --- FILTRE ANTI-DOUBLON STRICT (NOM + VILLE) ---
    const existingProspects = await prisma.prospect.findMany({
      where: { city: { equals: city, mode: "insensitive" } },
      select: { name: true, city: true }
    });

    if (existingProspects.length > 0) {
      const existingRefs = new Set(
        existingProspects.map(p => toAscii(p.name) + toAscii(p.city))
      );

      rawPlaces = rawPlaces.filter(place => {
        const placeRef = toAscii(place.name) + toAscii(city);
        return !existingRefs.has(placeRef);
      });
    }
    // --------------------------------------------------------

    const csv = await enrichAndFormatWithAI(rawPlaces, city, venueType, style, quantity);
    return { success: true, csv };
    
  } catch (error: any) {
    console.error("Erreur generateLeads:", error);
    return { success: false, error: error.message || "Erreur lors de la generation." };
  }
}

async function enrichAndFormatWithAI(places: any[], city: string, venueType: string, style: string, quantity: number): Promise<string> {
  
  const contextData = places.map((p, index) => {
    const reviewsSnippet = p.reviews 
      ? p.reviews.slice(0, 3).map((r: any) => toAscii(r.text).substring(0, 150)).join(' | ') 
      : "Aucun avis";

    return `
Lieu ${index + 1}:
- Nom: ${toAscii(p.name)}
- Adresse: ${toAscii(p.formatted_address)}
- Tel: ${toAscii(p.formatted_phone_number || "Inconnu")}
- Web: ${toAscii(p.website || "Inconnu")}
- Avis: ${reviewsSnippet}
-------------------------------------`;
  }).join('\n');

  const prompt = toAscii(`REGLE DE RECHERCHE PRIORITAIRE :

Ton objectif est d'obtenir ${quantity} prospects commerciaux réels.

Tu ne dois PAS supprimer une structure uniquement parce qu'aucune programmation musicale récente n'est trouvée.

La validation dépend du type de structure.

==================================================
NIVEAU 1 : ORGANISATEURS DE SPECTACLES
==================================================

Conserver automatiquement :

- Mairies
- Comités des fêtes
- Associations culturelles
- Associations événementielles
- Offices de tourisme
- MJC
- Centres culturels
- Campings
- Festivals
- Bases de loisirs
- Stations touristiques

Ces structures sont considérées comme acheteurs potentiels même sans preuve de concert récente.

==================================================
NIVEAU 2 : LIEUX COMMERCIAUX
==================================================

Bars :
Conserver si :
- connus localement
- adaptés à la musique live
- ou présence d'animations

Pubs :
Conserver si :
- ambiance musicale
- concerts réguliers
- animations

Guinguettes :
Conserver par défaut.

Restaurants :
Conserver uniquement si :
- concert
- soirée musicale
- animation live

Hôtels :
Conserver uniquement si :
- événementiel
- animation
- capacité d'accueil

==================================================
STRATEGIE SI MANQUE DE RESULTATS
==================================================

Ne jamais arrêter parce que la première recherche est courte.

Procéder ainsi :

Ville cible ${city}

Puis rayon :
20 km
50 km
100 km
150 km

A chaque étape :
- ajouter uniquement des prospects réels
- conserver les structures organisatrices même sans historique visible
- supprimer uniquement les lieux hors cible

L'objectif de quantité ${quantity} doit être atteint avant d'abandonner.

==================================================
INTERDICTION
==================================================

Il est interdit :
- d'inventer un lieu
- d'inventer un numéro
- d'inventer un email
- d'inventer une programmation

Mais il est autorisé :
- d'ajouter une mairie réelle
- d'ajouter un comité des fêtes réel
- d'ajouter une association réelle
- d'ajouter un lieu touristique réel

même sans preuve musicale récente.


 ${contextData}`);
  

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error("ERREUR OPENAI DETAILLEE :", JSON.stringify(errorBody, null, 2));
    throw new Error(errorBody?.error?.message || "Erreur lors de l'appel a l'API OpenAI");
  }

  const data = await response.json();
  
  let csvContent = data.choices[0].message.content.trim();
  
  if (csvContent.startsWith("```csv")) {
    csvContent = csvContent.replace(/^```csv\n/, "").replace(/\n```$/, "");
  } else if (csvContent.startsWith("```")) {
    csvContent = csvContent.replace(/^```\n/, "").replace(/\n```$/, "");
  }

  return csvContent;
}