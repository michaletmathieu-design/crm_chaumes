import MainLayout from "@/components/layout/main-layout";
import { ArrowLeft, MapPin, Phone, Mail, User } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import EditProspectPanel from "./edit-prospect-panel";
import AssignCommercial from "./assign-commercial";

type StageInfo = { label: string; className: string };

const stageConfig: { [key: string]: StageInfo } = {
  NEW: { label: "Nouveau", className: "bg-gray-100 text-gray-700" },
  TO_CONTACT: { label: "À contacter", className: "bg-blue-100 text-blue-700" },
  FIRST_EXCHANGE: { label: "Premier échange", className: "bg-indigo-100 text-indigo-700" },
  QUOTE_SENT: { label: "Devis envoyé", className: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Confirmé", className: "bg-green-100 text-green-700" },
  LOST: { label: "Perdu", className: "bg-red-100 text-red-700" },
};

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const opportunityFilter = session?.user?.role === "COMMERCIAL"
    ? { band: { members: { some: { userId: session.user.id } } } }
    : {};

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    include: {
      opportunities: {
        where: opportunityFilter,
        include: {
          band: { select: { id: true, name: true, genre: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { interactions: true, tasks: true, events: true, quotes: true } },
        },
        orderBy: { id: "desc" },
      },
    },
  });

  if (!prospect) notFound();

  const allUsers = await prisma.user.findMany({
    select: { id: true, firstName: true, lastName: true },
    orderBy: { firstName: "asc" }
  });

  return (
    <MainLayout>
      <div className="mb-6">
        <Link href="/prospects" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Retour au carnet d'adresses
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">{prospect.name}</h2>
        <p className="text-muted-foreground mt-1">{prospect.venueType} - {prospect.city}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <EditProspectPanel prospect={prospect} />

        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Opportunités liées ({prospect.opportunities.length})</h3>
            <Link
              href={`/opportunities/new?prospectId=${prospect.id}`}
              className="text-sm text-primary hover:underline"
            >
              + Lier un groupe
            </Link>
          </div>

          {prospect.opportunities.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              Aucun groupe n'est lié à ce prospect pour le moment.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {prospect.opportunities.map((opp) => {
                const stage = stageConfig[opp.stage] || stageConfig.NEW;
                return (
                  <div key={opp.id} className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link href={`/bands/${opp.band.id}`} className="font-semibold hover:underline">
                          {opp.band.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{opp.band.genre}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stage.className}`}>
                        {stage.label}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-2 border-t pt-3">
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Géré par :</span>
                        <AssignCommercial 
                          opportunityId={opp.id} 
                          prospectId={prospect.id}
                          users={allUsers} 
                          currentAssigned={opp.assignedTo} 
                        />
                      </div>

                      <div className="flex justify-between">
                        <span>Échanges</span>
                        <span className="font-medium text-foreground">{opp._count.interactions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tâches</span>
                        <span className="font-medium text-foreground">{opp._count.tasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Événements</span>
                        <span className="font-medium text-foreground">{opp._count.events}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Devis</span>
                        <span className="font-medium text-foreground">{opp._count.quotes}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}