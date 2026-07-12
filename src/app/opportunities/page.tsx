import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";

const kanbanStages = [
  { id: "NEW", name: "Nouveau", color: "bg-gray-500" },
  { id: "TO_CONTACT", name: "À contacter", color: "bg-blue-500" },
  { id: "FIRST_EXCHANGE", name: "Premier échange", color: "bg-indigo-500" },
  { id: "QUOTE_SENT", name: "Devis envoyé", color: "bg-yellow-500" },
  { id: "CONFIRMED", name: "Confirmé", color: "bg-green-500" },
  { id: "LOST", name: "Perdu", color: "bg-red-500" },
];

export default async function OpportunitiesPipelinePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Règles d'accès strictes :
  // - ADMIN voit toutes les opportunités
  // - COMMERCIAL ne voit que les opportunités de SES groupes
  let opportunities;
  if (session.user.role === "ADMIN") {
    opportunities = await prisma.opportunity.findMany({
      include: {
        prospect: { select: { name: true, city: true } },
        band: { select: { name: true, genre: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
      orderBy: { id: "desc" },
    });
  } else {
        opportunities = await prisma.opportunity.findMany({
      where: {
        band: {
          members: {
            some: { userId: session.user.id },
          },
        },
      },
      include: {
        prospect: { select: { name: true, city: true } },
        band: { select: { name: true, genre: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
      orderBy: { id: "desc" },
    });
  }

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/prospects" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Pipeline des Opportunités</h2>
            <p className="text-muted-foreground">
              {opportunities.length} opportunité{opportunities.length > 1 ? "s" : ""} en cours
            </p>
          </div>
        </div>
        <Link
          href="/opportunities/new"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle opportunité
        </Link>
      </div>

      {/* Board Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)]">
        {kanbanStages.map((stage) => {
          const stageOpportunities = opportunities.filter((opp) => opp.stage === stage.id);
          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-80 bg-muted/50 rounded-lg p-3 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <h3 className="font-semibold text-sm">{stage.name}</h3>
                </div>
                <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">
                  {stageOpportunities.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageOpportunities.map((opp) => (
                  <Link
                    key={opp.id}
                    href={`/opportunities/${opp.id}`}
                    className="block bg-card rounded-md p-3 border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <p className="font-medium text-sm hover:underline">
                      {opp.prospect.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{opp.prospect.city}</p>

                    <div className="flex justify-between items-center mt-3 pt-2 border-t">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                        {opp.band.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {opp.assignedTo ? `${opp.assignedTo.firstName}` : "Non assigné"}
                      </span>
                    </div>
                  </Link>
                ))}
                {stageOpportunities.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Aucune opportunité</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </MainLayout>
  );
}