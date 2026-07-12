import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import { Users, CheckCircle, Music, MessageSquare } from "lucide-react";

export default async function Home() {
  // On calcule les vraies statistiques depuis la base de donnees
  const totalProspects = await prisma.prospect.count();
  const confirmedProspects = await prisma.opportunity.count({ where: { stage: "CONFIRMED" } });
  const toContact = await prisma.opportunity.count({ where: { stage: "TO_CONTACT" } });
  const totalBands = await prisma.band.count();
  const totalInteractions = await prisma.interaction.count();

  const stats = [
    { name: "Total Prospects", value: totalProspects, icon: Users, color: "text-blue-500" },
    { name: "A contacter", value: toContact, icon: MessageSquare, color: "text-orange-500" },
    { name: "Confirmes", value: confirmedProspects, icon: CheckCircle, color: "text-green-500" },
    { name: "Groupes", value: totalBands, icon: Music, color: "text-purple-500" },
  ];

  // On recupere les 5 derniers prospects ajoutes pour le tableau de bord
  const recentProspects = await prisma.prospect.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Bienvenue, voici un resume de votre activite ({totalInteractions} echanges realises).
          </p>
        </div>
        
        {/* Cartes statistiques */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.name} className="rounded-lg border bg-card p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
            </div>
          ))}
        </div>

        {/* Derniers prospects ajoutes */}
        <div className="border rounded-lg bg-card p-6">
          <h3 className="font-semibold mb-4">Derniers prospects ajoutes</h3>
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left pb-2 font-medium text-muted-foreground">Nom</th>
                <th className="text-left pb-2 font-medium text-muted-foreground">Ville</th>
                <th className="text-left pb-2 font-medium text-muted-foreground">Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentProspects.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{p.name}</td>
                  <td className="py-3 text-muted-foreground">{p.city}</td>
                  <td className="py-3"><span className="bg-muted px-2 py-0.5 rounded text-xs">{p.stage}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}