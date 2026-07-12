import MainLayout from "@/components/layout/main-layout";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Fonction qui ajoute le groupe en base de donnees
async function addGroup(formData: FormData) {
  "use server";
  await prisma.band.create({
    data: {
      name: formData.get("name") as string,
      genre: formData.get("genre") as string,
      minFee: Number(formData.get("minFee")),
      suggestedFee: Number(formData.get("suggestedFee")),
    },
  });
  revalidatePath("/bands");
}

export default async function BandsPage() {
  const groups = await prisma.band.findMany();

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Groupes</h2>
          <p className="text-muted-foreground">Gerez les groupes</p>
        </div>
      </div>
      
      {/* Le formulaire d'ajout */}
      <form action={addGroup} className="bg-card border rounded-lg p-4 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
          <label className="text-xs text-muted-foreground">Nom du groupe</label>
          <input type="text" name="name" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" placeholder="Ex: Les Soucoupes Volantes" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Style musical</label>
          <input type="text" name="genre" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" placeholder="Ex: Rock" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Cachet min (EUR)</label>
          <input type="number" name="minFee" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" placeholder="1000" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Cachet conseille (EUR)</label>
          <input type="number" name="suggestedFee" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" placeholder="1500" />
        </div>
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 h-[42px]">
          + Ajouter
        </button>
      </form>

      {/* La liste des groupes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group.id} className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow">
            <div className="h-24 bg-muted rounded-md mb-4 flex items-center justify-center text-muted-foreground text-xs">
              Photo du groupe
            </div>
            <Link href={`/bands/${group.id}`} className="text-lg font-semibold hover:underline">{group.name}</Link>
            <p className="text-sm text-muted-foreground mt-1">{group.genre}</p>
            <div className="flex justify-between items-center mt-4 pt-4 border-t text-sm">
              <span className="text-muted-foreground">Voir details</span>
              <span className="font-medium">{group.suggestedFee} EUR</span>
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}