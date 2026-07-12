"use server";

import { GooglePlacesAPI } from "./google-places-service";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// FONCTION MAGIQUE : Transforme "Café de la Place" en "Cafe de la Place" (Pur ASCII)
function toAscii(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")                   // Décompose les accents (é -> e + ´)
    .replace(/[\u0300-\u036f]/g, "")   // Supprime les marques d'accent
    .replace(/[^\x20-\x7E]/g, " ")     // Ne garde QUE l'ASCII standard (lettres, chiffres, ponctuation de base)
    .replace(/\s+/g, " ")              // Nettoie les espaces multiples
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
    
    // On demande plus de résultats à Google pour avoir de la marge après filtrage
    const rawPlaces = await googleService.findLiveMusicVenues(city, venueType, quantity * 3);

    if (rawPlaces.length === 0) {
      return { success: false, error: "Aucun lieu trouve sur Google Maps pour cette zone." };
    }

    const csv = await enrichAndFormatWithAI(rawPlaces, city, venueType, style, quantity);
    return { success: true, csv };
    
  } catch (error: any) {
    console.error("Erreur generateLeads:", error);
    return { success: false, error: error.message || "Erreur lors de la generation." };
  }
}

async function enrichAndFormatWithAI(places: any[], city: string, venueType: string, style: string, quantity: number): Promise<string> {
  
  // On prépare les données en NETTOYANT TOUT en ASCII et en LIMITANT la taille pour ne pas faire exploser OpenAI
  const contextData = places.map((p, index) => {
    // On prend max 3 avis, et on les coupe à 150 caractères pour economiser des tokens
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

    // Le prompt est aussi converti en ASCII pur
      const prompt = toAscii(`Tu es un charge de diffusion musicale senior specialise dans l'identification d'organisateurs de spectacles en France.

Tu recois une liste brute provenant de Google Places / Google Maps.

Cette liste contient principalement des lieux physiques.

Ton travail N'EST PAS de retourner ces lieux mais d'identifier l'ORGANISATEUR REEL susceptible de signer un contrat de spectacle.

==================================================
OBJECTIF
========

Transformer une liste brute Google Places en une liste de prospects commerciaux qualifies.

Tu dois retourner UNIQUEMENT des structures susceptibles d'acheter une prestation musicale.

Tu privilegies toujours l'organisateur plutot que le batiment.

Chaque prospect doit etre reel.

Aucune information ne doit etre inventee.

==================================================
REGLES DE TRANSFORMATION (OBLIGATOIRES)
=======================================

Google fournit souvent un batiment.

Tu dois identifier qui l'exploite reellement.

Exemples :

"Salle polyvalente de X"
→ Mairie de X
ou
Comite des fetes de X
ou
Association culturelle de X

"Salle des fetes de X"
→ Mairie de X

"Espace culturel"
→ Organisateur reel si identifiable.
Sinon Mairie.

"Centre culturel"
→ Association ou Mairie responsable.

"Maison des Associations"
→ Association organisatrice si identifiable.
Sinon Mairie.

Camping
→ conserver le nom du camping.

Hotel
→ conserver le nom.

Restaurant
→ conserver le nom.

Bar
→ conserver le nom.

Pub
→ conserver le nom.

Guinguette
→ conserver le nom.

Festival
→ conserver le nom du festival ou de l'association organisatrice.

Si plusieurs organisateurs sont identifies, conserver celui qui programme effectivement les spectacles.

==================================================
CRITERES DE VALIDATION
======================

VALIDES PAR DEFAUT

Conserver MEME sans avis Google :

* Mairies
* Comites des fetes
* Associations culturelles
* Offices de tourisme
* MJC
* Centres culturels
* Campings
* Hotels
* Festivals
* Associations evenementielles

Ces structures sont considerees comme des acheteurs potentiels.

Aucune preuve musicale n'est necessaire.

---
CRITERES DE VALIDATION ET PRIORITE GEOGRAPHIQUE :
C'est la regle la plus importante pour le classement.

1. PRIORITE ABSOLUE A LA VILLE CIBLE (${toAscii(city)}) :
- Tu DOIS remplir le CSV en priorite avec les lieux situes EXACTEMENT dans "${toAscii(city)}".
- Tu n'as le droit de prendre un lieu dans une autre ville (comme Lezigneux, Saint-Etienne, etc.) QUE SI tu as deja epuise tous les lieux possibles de "${toAscii(city)}".

    2. VALIDATION DES LIEUX :
    - INTELLIGENCE LOCALE : Si Google a oublie un bar ou une guinguette TRES CONNU de "${toAscii(city)}" (comme Le VNB), tu as le droit de l'ajouter de toi-meme a la liste.
    - BARS/PUBS/GUINGUETTES DANS LA VILLE CIBLE : Presomption de musique absolue. Tu DOIS les garder SAUF si un avis dit "lieu calme" ou "bar tabac".
    - RESTAURANTS : EXCLURE SYSTEMATIQUEMENT. Un restaurant ne compte pas, SAUF si un avis dit explicitement "groupe live" ou "scene".
    - BARS/PUBS HORS VILLE CIBLE : Ils doivent avoir une preuve de concert dans les avis pour etre gardes.
    - Mairies, Comites des fetes, Associations : VALIDES PAR DEFAUT partout.




Ils ne sont conserves QUE si les avis Google ou les informations disponibles montrent clairement qu'ils organisent :

* concerts
* musique live
* groupes
* animations musicales
* soirees musicales

Si aucune preuve n'est trouvee :

SUPPRIMER LE LIEU.

==================================================
LISTE NOIRE
===========

Supprimer immediatement :

* Eglises

* Chapelles

* Lieux de culte

* Zenith

* SMAC

* Scenes nationales

* Grandes salles professionnelles

* Arenas

* Bibliotheques

* Mediatheques

* Musees

* Ecoles

* Colleges

* Lycees

* Universites

* Gymnases

* Salles de sport

* Piscines

* Cinemas

* Lieux touristiques sans programmation

==================================================
QUALITE DES DONNEES
===================

Ne jamais inventer une information.

Telephone

→ uniquement si present.

Email

→ TOUJOURS VIDE.

Ne jamais inventer un email.

Contact

→ uniquement si une personne est explicitement mentionnee.

Sinon laisser vide.

Site Web

→ uniquement si disponible.

Derniere programmation connue

→ uniquement si une programmation musicale est clairement identifiable.

Sinon laisser vide.

==================================================
ESTIMATIONS
===========

La jauge doit etre coherente avec le type de structure.

Exemples :

Petit bar :
30-80

Pub :
50-120

Restaurant :
50-150

Camping :
80-300

Salle des fetes :
120-250

Salle municipale :
200-500

Festival :
500-3000

Le cachet doit etre REALISTE.

Exemples :

Petit bar :
150-300

Bar reconnu :
250-500

Restaurant :
200-400

Camping :
300-700

Comite des fetes :
300-800

Mairie :
400-1000

Association culturelle :
400-1200

Festival local :
800-2500

Ne jamais reutiliser les memes montants sur toutes les lignes.

==================================================
PRIORITE
========

Attribuer :

Haute

Moyenne

Faible

En fonction de :

* probabilite d'acheter un concert
* taille de la structure
* historique de programmation

==================================================
OBJECTIF DE QUANTITE (OBLIGATOIRE)
==================================

La sortie DOIT contenir EXACTEMENT ${quantity} lignes de donnees.

Cette regle est prioritaire sur toutes les autres.

Si la recherche initiale ne permet pas d'obtenir suffisamment de prospects, tu DOIS elargir automatiquement la recherche geographique.

Ordre d'elargissement :

1. Commune demandee

2. Communes limitrophes

3. Canton

4. Intercommunalite

5. Rayon plus large

6. Departement

7. Departements voisins si necessaire

Tu disposes d'un acces Google Places.

Tu peux effectuer autant de recherches supplementaires que necessaire afin d'obtenir EXACTEMENT ${quantity} prospects reels.

Ne retourne JAMAIS une liste incomplete.

Ne t'arrete pas tant que ${quantity} lignes valides n'ont pas ete trouvees.

Si plusieurs recherches sont necessaires, effectue-les automatiquement avant de produire le resultat final.

Il est interdit de :

* inventer un prospect
* inventer une information
* dupliquer un prospect pour atteindre le quota

Chaque ligne doit correspondre a un organisateur reel et unique.

==================================================
INTEGRITE DU CSV (OBLIGATOIRE)
==============================

Le CSV doit etre parfaitement exploitable par un logiciel.

Chaque ligne doit contenir EXACTEMENT 13 colonnes.

Ordre STRICT :

Nom
Ville
Type
Contact
Telephone
Email
Site Web
Jauge
Cachet Min
Cachet Max
Derniere programmation connue
Source
Priorite

Chaque colonne est separee par UN ET UN SEUL caractere ;

Ne jamais ajouter une colonne.

Ne jamais supprimer une colonne.

Si une valeur est inconnue :

laisser simplement le champ vide.

Conserver obligatoirement tous les separateurs.

Exemple :

Nom;Ville;Type;;0477000000;;https://site.fr;150;300;600;;Google Places;Haute

Chaque ligne doit contenir EXACTEMENT 12 caracteres ';'.

Ne jamais inserer un retour a la ligne dans une cellule.

Supprimer ou remplacer tout caractere susceptible de casser le CSV :

* retour ligne
* point-virgule
* tabulation

Ne jamais decaler les colonnes.

Toutes les lignes doivent respecter exactement la meme structure.

==================================================
FORMAT DE SORTIE
================

Retourner UNIQUEMENT un CSV.

Separateur :

;

ASCII uniquement.

Aucun accent.

Aucun texte avant.

Aucun texte apres.

Le premier caractere de la reponse doit etre l'en-tete CSV.

Le dernier caractere doit etre la fin de la derniere ligne.

Colonnes EXACTES :

Nom;Ville;Type;Contact;Telephone;Email;Site Web;Jauge;Cachet Min;Cachet Max;Derniere programmation connue;Source;Priorite

Ne jamais afficher :

* explication
* commentaire
* raisonnement
* analyse
* resume

==================================================
DONNEES D'ENTREE
================

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

  // NOUVEAU : On affiche la VRAIE erreur d'OpenAI dans le terminal si ça plante
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error("ERREUR OPENAI DETAILLEE :", JSON.stringify(errorBody, null, 2));
    throw new Error(errorBody?.error?.message || "Erreur lors de l'appel a l'API OpenAI");
  }

  const data = await response.json();
  
  // Nettoyage du retour pour etre sur d'avoir un CSV propre
  let csvContent = data.choices[0].message.content.trim();
  
  // On supprime les balises markdown si l'IA les a mises quand meme
  if (csvContent.startsWith("```csv")) {
    csvContent = csvContent.replace(/^```csv\n/, "").replace(/\n```$/, "");
  } else if (csvContent.startsWith("```")) {
    csvContent = csvContent.replace(/^```\n/, "").replace(/\n```$/, "");
  }

  return csvContent;
}