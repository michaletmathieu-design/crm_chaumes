import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Plus, Link2, X } from "lucide-react";
import { importProspects } from "./import-action";

// Action pour ajouter un lieu (Prospect) simple
async function addProspect(formData: FormData) {
  "use server";
  const name = formData.get("name") as string;
  const contact = formData.get("contactName") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const city = formData.get("city") as string;
  const venue = formData.get("venueType") as string;
  const cap = formData.get("capacity");
  const minF = formData.get("minFee");
  const maxF = formData.get("maxFee");

  await prisma.prospect.create({
    data: {
      name: name,
      contactName: contact || null,
      phone: phone || null,
      email: email || null,
      city: city,
      venueType: venue,
      capacity: cap ? Number(cap) : null,
      minFee: minF ? Number(minF) : null,
      maxFee: maxF ? Number(maxF) : null,
      status: "ACTIVE",
    },
  });
  revalidatePath("/prospects");
}

async function deleteProspect(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await prisma.prospect.delete({ where: { id } });
  revalidatePath("/prospects");
}

// NOUVEAU : On récupère les paramètres de l'URL pour filtrer
export default async function ProspectsPage({ searchParams }: { searchParams: Promise<{ city?: string; venueType?: string; band?: string }> }) {
  const params = await searchParams;
  const filterCity = params.city || "";
  const filterType = params.venueType || "";
  const filterBand = params.band || "";

  // NOUVEAU : On va chercher les villes et types uniques pour peupler les filtres
  const [distinctCities, distinctTypes] = await Promise.all([
    prisma.prospect.findMany({ select: { city: true }, distinct: ["city"], orderBy: { city: "asc" } }),
    prisma.prospect.findMany({ select: { venueType: true }, distinct: ["venueType"], orderBy: { venueType: "asc" } })
  ]);

  // NOUVEAU : Construction de la clause WHERE dynamique pour Prisma
  const whereClause = {
    AND: [
      filterCity ? { city: { contains: filterCity, mode: "insensitive" as const } } : {},
      filterType ? { venueType: filterType } : {},
      filterBand ? { 
        opportunities: { 
          some: { 
            band: { name: { contains: filterBand, mode: "insensitive" as const } } 
          } 
        } 
      } : {},
    ]
  };

  // On passe le whereClause à la requête principale
  const prospects = await prisma.prospect.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      opportunities: {
        include: {
          band: { select: { name: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Carnet d'adresses</h2>
          <p className="text-muted-foreground">{prospects.length} lieux et contacts référencés</p>
        </div>
        <Link
          href="/opportunities/new"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle opportunité
        </Link>
      </div>

      {/* Import CSV */}
      <form action={importProspects} className="mb-6 flex items-center gap-4 bg-card border rounded-lg p-3">
        <label className="text-sm font-medium">Importer un CSV :</label>
        <input type="file" name="file" accept=".csv" required className="text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer" />
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90">
          Importer
        </button>
      </form>

      {/* Formulaire d'ajout rapide */}
      <form action={addProspect} className="bg-card border rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="text-xs text-muted-foreground">Nom du lieu</label>
          <input type="text" name="name" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" placeholder="Ex: Festival des nuits" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Contact (Nom)</label>
          <input type="text" name="contactName" className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" placeholder="Ex: Jean Dupont" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Téléphone</label>
          <input type="tel" name="phone" className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" placeholder="06 00 00 00 00" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Email</label>
          <input type="email" name="email" className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" placeholder="contact@salle.fr" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Ville</label>
          <input type="text" name="city" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" placeholder="Ex: Dijon" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Type de lieu</label>
          <select name="venueType" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm">
            <option value="BAR">Bars musicaux</option>
            <option value="FESTIVAL">Festivals</option>
            <option value="MULTI_PURPOSE_HALL">Salles / MJC</option>
            <option value="CITY_HALL">Mairies / Offices de tourisme</option>
            <option value="GUINGUETTE">Guinguettes</option>
            <option value="AUTRE">Autre structure</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Jauge</label>
          <input type="number" name="capacity" className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" placeholder="200" />
        </div>
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 h-[42px]">
          + Ajouter le lieu
        </button>
      </form>

      {/* NOUVEAU : BARRE DE FILTRES */}
      <form className="mb-4 bg-card border rounded-lg p-3 flex flex-col md:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="text-xs text-muted-foreground">Ville</label>
          <select name="city" defaultValue={filterCity} className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm">
            <option value="">Toutes les villes</option>
            {distinctCities.map((c) => (
              <option key={c.city} value={c.city}>{c.city}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 w-full">
          <label className="text-xs text-muted-foreground">Type de lieu</label>
          <select name="venueType" defaultValue={filterType} className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm">
            <option value="">Tous les types</option>
            {distinctTypes.map((t) => (
              <option key={t.venueType} value={t.venueType}>{t.venueType}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 w-full">
          <label className="text-xs text-muted-foreground">Groupe lié</label>
          <input type="text" name="band" defaultValue={filterBand} placeholder="Ex: Les Warriors" className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-2 h-[42px]">
          <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
            Filtrer
          </button>
          {(filterCity || filterType || filterBand) && (
            <Link href="/prospects" className="flex items-center gap-1 bg-muted px-3 py-2 rounded-md text-sm font-medium hover:bg-muted/80">
              <X className="h-4 w-4" /> Réinitialiser
            </Link>
          )}
        </div>
      </form>

      {/* La liste des prospects et leurs opportunités */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left p-3 font-medium">Nom / Lieu</th>
              <th className="text-left p-3 font-medium">Contact</th>
              <th className="text-left p-3 font-medium">Ville</th>
              <th className="text-left p-3 font-medium">Groupes liés (Opportunités)</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {prospects.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Aucun prospect ne correspond à vos filtres.
                </td>
              </tr>
            ) : (
              prospects.map((prospect) => (
                <tr key={prospect.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium">
                    <Link href={`/prospects/${prospect.id}`} className="hover:underline hover:text-primary transition-colors">
                      {prospect.name}
                    </Link>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{prospect.phone || prospect.email || "-"}</td>
                  <td className="p-3 text-muted-foreground">{prospect.city}</td>
                  <td className="p-3">
                    {prospect.opportunities.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {prospect.opportunities.map((opp) => (
                          <span
                            key={opp.id}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium"
                          >
                            <Link2 className="h-3 w-3" />
                            {opp.band.name} ({opp.stage})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <Link 
                        href={`/opportunities/new?prospectId=${prospect.id}`} 
                        className="text-xs text-primary hover:underline"
                      >
                        + Lier un groupe
                      </Link>
                    )}
                  </td>
                  <td className="p-3">
                    <form action={deleteProspect}>
                      <input type="hidden" name="id" value={prospect.id} />
                      <button type="submit" className="text-red-500 hover:text-red-700 font-medium text-xs">
                        Supprimer
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}