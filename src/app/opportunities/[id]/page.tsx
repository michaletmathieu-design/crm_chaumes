import MainLayout from "@/components/layout/main-layout";
import { ArrowLeft, Phone, Mail, MessageSquare, FileText } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import UpdateStageForm from "./update-stage-form";
import AddInteractionForm from "./add-interaction-form";
import AddTaskForm from "./add-task-form";
import { toggleTask } from "./toggle-task-action";

const stageConfig: Record<string, { label: string; className: string }> = {
  NEW: { label: "Nouveau", className: "bg-gray-100 text-gray-700" },
  TO_CONTACT: { label: "À contacter", className: "bg-blue-100 text-blue-700" },
  FIRST_EXCHANGE: { label: "Premier échange", className: "bg-indigo-100 text-indigo-700" },
  QUOTE_SENT: { label: "Devis envoyé", className: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Confirmé", className: "bg-green-100 text-green-700" },
  LOST: { label: "Perdu", className: "bg-red-100 text-red-700" },
};

const typeIcons: Record<string, React.ReactNode> = {
  PHONE: <Phone className="h-3.5 w-3.5 text-blue-500" />,
  EMAIL: <Mail className="h-3.5 w-3.5 text-green-500" />,
  NOTE: <MessageSquare className="h-3.5 w-3.5 text-orange-500" />,
  MEETING: <FileText className="h-3.5 w-3.5 text-purple-500" />,
};

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      prospect: true,
      band: true,
      assignedTo: { select: { firstName: true, lastName: true } },
      interactions: { orderBy: { date: "desc" } },
      tasks: { orderBy: { dueDate: "asc" } },
      _count: { select: { events: true, quotes: true } },
    },
  });

  if (!opportunity) notFound();

  // Sécurité : Le commercial ne peut voir que les opportunités de ses groupes
  if (session?.user?.role === "COMMERCIAL") {
    const hasAccess = await prisma.userBand.findFirst({
      where: { userId: session.user.id, bandId: opportunity.bandId },
    });
    if (!hasAccess) redirect("/opportunities");
  }

  const currentStage = stageConfig[opportunity.stage] || stageConfig.NEW;

  return (
    <MainLayout>
      <div className="mb-6">
        <Link href="/opportunities" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Retour au pipeline
        </Link>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {opportunity.band.name} <span className="font-normal text-muted-foreground">x</span> {opportunity.prospect.name}
            </h2>
            <p className="text-muted-foreground mt-1">
              {opportunity.prospect.city} — {opportunity.band.genre}
            </p>
          </div>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${currentStage.className}`}>
            {currentStage.label}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Colonne de gauche : Infos + Actions */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-3 text-sm">Détails de l'opportunité</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lieu</span>
                <Link href={`/prospects/${opportunity.prospectId}`} className="font-medium hover:underline">{opportunity.prospect.name}</Link>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact</span>
                <span>{opportunity.prospect.contactName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tél</span>
                <span>{opportunity.prospect.phone || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assigné à</span>
                <span>{opportunity.assignedTo ? `${opportunity.assignedTo.firstName} ${opportunity.assignedTo.lastName}` : "Non assigné"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-3 text-sm">Activité</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Événements</span><span className="font-medium">{opportunity._count.events}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Devis</span><span className="font-medium">{opportunity._count.quotes}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tâches</span><span className="font-medium">{opportunity.tasks.length}</span></div>
            </div>
          </div>

          <UpdateStageForm opportunityId={opportunity.id} currentStage={opportunity.stage} />
        </div>

        {/* Colonne de droite : Historique et Tâches */}
        <div className="md:col-span-2 space-y-4">
          <AddInteractionForm opportunityId={opportunity.id} />

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold text-sm mb-4">Historique des échanges ({opportunity.interactions.length})</h3>
            {opportunity.interactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun échange enregistré.</p>
            ) : (
              <div className="space-y-4">
                {opportunity.interactions.map((interaction) => (
                  <div key={interaction.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                    <div className="mt-0.5">{typeIcons[interaction.type] || <MessageSquare className="h-3.5 w-3.5" />}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{interaction.type}</span>
                        <span className="text-xs text-muted-foreground">
                          {interaction.date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{interaction.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <AddTaskForm opportunityId={opportunity.id} />

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold text-sm mb-4">Relances & Tâches</h3>
            {opportunity.tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune tâche en cours.</p>
            ) : (
              <div className="space-y-2">
                {opportunity.tasks.map((task) => (
                  <form key={task.id} action={toggleTask} className="flex items-center gap-3 p-2 rounded-md border hover:bg-muted/30 transition-colors">
                    <input type="hidden" name="taskId" value={task.id} />
                    <input type="hidden" name="isCompleted" value={task.isCompleted.toString()} />
                    
                    <button
                      type="submit"
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        task.isCompleted ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/50"
                      }`}
                    >
                      {task.isCompleted && (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.isCompleted ? "line-through text-muted-foreground" : "font-medium"}`}>
                        {task.title}
                      </p>
                    </div>

                    <span className={`text-xs px-2 py-0.5 rounded ${
                      task.priority === "HIGH" ? "bg-red-100 text-red-700" : 
                      task.priority === "LOW" ? "bg-gray-100 text-gray-700" : 
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {task.priority === "HIGH" ? "Haute" : task.priority === "LOW" ? "Basse" : "Moyenne"}
                    </span>

                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {task.dueDate.toLocaleDateString("fr-FR")}
                    </span>
                  </form>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}