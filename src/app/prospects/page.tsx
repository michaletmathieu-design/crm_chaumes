import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { auth } from "@/auth";
import { importProspects } from "./import-action";

const stages = [
  { id: "ALL", name: "Tous" },
  { id: "NEW", name: "Nouveaux" },
  { id: "TO_CONTACT", name: "A contacter" },
  { id: "FIRST_EXCHANGE", name: "Echanges" },
  { id: "QUOTE_SENT", name: "Devis" },
  { id: "CONFIRMED", name: "Confirmes" },
];

const kanbanStages = [
  { id: "NEW", name: "Nouveau", color: "bg-gray-500" },
  { id: "TO_CONTACT", name: "A contacter", color: "bg-blue-500" },
  { id: "FIRST_EXCHANGE", name: "Premier echange", color: "bg-indigo-500" },
  { id: "QUOTE_SENT", name: "Devis envoye", color: "bg-yellow-500" },
  { id: "CONFIRMED", name: "Confirme", color: "bg-green-500" },
];

async function addProspect(formData: FormData) {
  "use server";
  const session = await auth();
  
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
      venueType: venue, // On sauvegarde la vraie valeur choisie
      capacity: cap ? Number(cap) : null,
      minFee: minF ? Number(minF) : null,
      maxFee: maxF ? Number(maxF) : null,
      assignedToId: session?.user?.id || null,
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

export default async function ProspectsPage({ searchParams }: { searchParams: Promise<{ stage?: string, view?: string }> }) {
  const { stage: activeStage, view } = await searchParams;
  
  const prospects = await prisma.prospect.findMany({
    include: { assignedTo: true }
  });

  const visibleStages = activeStage === "ALL" || !activeStage 
    ? kanbanStages 
    : kanbanStages.filter(s => s.id === activeStage);

  const filteredProspects = activeStage === "ALL" || !activeStage 
    ? prospects 
    : prospects.filter(p => p.stage === activeStage);

  return (
    <MainLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">CRM / Prospects</h2>
        <p className="text-muted-foreground">Pipeline commercial ({prospects.length} prospects)</p>
      </div>

      <form action={importProspects} className="mb-4 flex items-center gap-4 bg-card border rounded-lg p-3">
        <label className="text-sm font-medium">Importer un CSV :</label>
        <input type="file" name="file" accept=".csv" required className="text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer" />
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90">
          Importer
        </button>
      </form>

      <div className="mb-4 bg-muted/30 border border-dashed rounded-md p-3 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">Format attendu du fichier CSV :</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span><strong>Nom</strong> (obligatoire)</span>
          <span><strong>Ville</strong> (obligatoire)</span>
          <span>Type</span>
          <span>Contact</span>
          <span>Telephone</span>
          <span>Email</span>
          <span>Jauge</span>
          <span>Cachet Min</span>
          <span>Cachet Max</span>
        </div>
        <p className="mt-2 italic">Separez les valeurs par des virgules. Seuls les champs Nom et Ville sont obligatoires.</p>
        <p className="mt-1 font-mono bg-background px-2 py-1 rounded">Ex: Festival Jazz,Clisson,FESTIVAL,Pierre,06 00 00 00 00,,5000,2000,4000</p>
      </div>

      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="flex gap-2 bg-muted/50 p-1.5 rounded-lg">
          {stages.map((stage) => (
            <Link
              key={stage.id}
              href={`/prospects?stage=${stage.id}&view=${view || "list"}`}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                (activeStage === stage.id || (!activeStage && stage.id === "ALL"))
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {stage.name}
            </Link>
          ))}
        </div>

        <div className="flex bg-muted/50 p-1.5 rounded-lg">
          <Link href={`/prospects?stage=${activeStage || "ALL"}&view=list`} className={`px-3 py-1.5 rounded-md text-sm font-medium ${view !== "kanban" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
            Tableau
          </Link>
          <Link href={`/prospects?stage=${activeStage || "ALL"}&view=kanban`} className={`px-3 py-1.5 rounded-md text-sm font-medium ${view === "kanban" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
            Kanban
          </Link>
        </div>
      </div>

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
          <label className="text-xs text-muted-foreground">Telephone</label>
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
            <option value="BAR">Bars musicaux / Bars à concerts</option>
            <option value="PUB">Pubs</option>
            <option value="RESTAURANT">Restaurants avec concerts</option>
            <option value="GUINGUETTE">Guinguettes</option>
            <option value="GUINGUETTE_ETE">Guinguettes d'ete</option>
            <option value="CAMPSITE">Campings</option>
            <option value="HOTEL">Hotels</option>
            <option value="CASINO">Casinos de proximite</option>
            <option value="WEDDING_HALL">Domaines / Chateaux de reception</option>
            <option value="MULTI_PURPOSE_HALL">Salles / MJC / Centres culturels / Salles municipales</option>
            <option value="CITY_HALL">Services culturels des mairies</option>
            <option value="EVENT_AGENCY">Offices de tourisme</option>
            <option value="FESTIVAL">Festivals / Marches nocturnes / Fetes</option>
            <option value="PARTY_COMMITTEE">Comites des fetes / Associations sportives</option>
            <option value="CONCERT_HALL">Salles de concert classiques</option>
            <option value="COMPANY">Comites d'entreprise / Boites de nuit</option>
            <option value="AUTRE">Autre structure</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Jauge</label>
          <input type="number" name="capacity" className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" placeholder="200" />
        </div>
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 h-[42px]">
          + Ajouter
        </button>
      </form>

      {view !== "kanban" && (
        <div className="border rounded-lg bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Nom</th>
                <th className="text-left p-3 font-medium">Contact</th>
                <th className="text-left p-3 font-medium">Ville</th>
                <th className="text-left p-3 font-medium">Statut</th>
                <th className="text-left p-3 font-medium">Pris par</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProspects.map((prospect) => (
                <tr key={prospect.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium"><Link href={`/prospects/${prospect.id}`} className="hover:underline">{prospect.name}</Link></td>
                  <td className="p-3 text-muted-foreground text-xs">{prospect.phone || prospect.email || "-"}</td>
                  <td className="p-3 text-muted-foreground">{prospect.city}</td>
                  <td className="p-3">{prospect.stage}</td>
                  <td className="p-3 text-muted-foreground">
                    {prospect.assignedTo ? `${prospect.assignedTo.firstName} ${prospect.assignedTo.lastName}` : "-"}
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-500px)]">
          {visibleStages.map((stage) => {
            const stageProspects = prospects.filter((p) => p.stage === stage.id);
            return (
              <div key={stage.id} className="flex-shrink-0 w-72 bg-muted/50 rounded-lg p-3 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                    <h3 className="font-semibold text-sm">{stage.name}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">
                    {stageProspects.length}
                  </span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {stageProspects.map((prospect) => (
                    <div key={prospect.id} className="bg-card rounded-md p-3 border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <Link href={`/prospects/${prospect.id}`} className="font-medium text-sm hover:underline">{prospect.name}</Link>
                      <p className="text-xs text-muted-foreground mt-1">{prospect.city} - {prospect.phone || "-"}</p>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {prospect.assignedTo ? prospect.assignedTo.firstName : prospect.venueType}
                        </span>
                        <span className="text-xs text-muted-foreground">{prospect.capacity ? `${prospect.capacity} places` : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
}