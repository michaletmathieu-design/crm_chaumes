import MainLayout from "@/components/layout/main-layout";
import { ArrowLeft, Phone, Mail, MessageSquare, CheckCircle2, UserCheck } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import UploadDocuments from "./upload-documents";

const stages = ["NEW", "TO_CONTACT", "FIRST_EXCHANGE", "QUOTE_SENT", "CONFIRMED", "LOST"];

async function updateStage(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await prisma.prospect.update({
    where: { id },
    data: { stage: formData.get("stage") as string },
  });
  revalidatePath(`/prospects/${id}`);
}

async function addInteraction(formData: FormData) {
  "use server";
  const id = formData.get("prospectId") as string;
  await prisma.interaction.create({
    data: {
      prospectId: id,
      type: formData.get("type") as string,
      content: formData.get("content") as string,
    },
  });
  revalidatePath(`/prospects/${id}`);
}

async function addTask(formData: FormData) {
  "use server";
  const id = formData.get("prospectId") as string;
  await prisma.task.create({
    data: {
      prospectId: id,
      title: formData.get("title") as string,
      type: formData.get("type") as string,
      priority: formData.get("priority") as string,
      dueDate: new Date(formData.get("dueDate") as string),
    },
  });
  revalidatePath(`/prospects/${id}`);
}

async function toggleTask(formData: FormData) {
  "use server";
  const taskId = formData.get("taskId") as string;
  const isCompleted = formData.get("isCompleted") === "true";
  await prisma.task.update({
    where: { id: taskId },
    data: { isCompleted: !isCompleted },
  });
  revalidatePath(`/prospects`);
}

async function claimProspect(formData: FormData) {
  "use server";
  const session = await auth();
  const id = formData.get("prospectId") as string;
  const userId = (session?.user as any)?.id;

  if (!userId || !id) {
    throw new Error("Action impossible");
  }

  await prisma.prospect.update({
    where: { id },
    data: { assignedToId: userId },
  });
  revalidatePath(`/prospects/${id}`);
}

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  
  const prospect = await prisma.prospect.findUnique({ 
    where: { id },
    include: { 
      interactions: { orderBy: { date: 'desc' } },
      tasks: { orderBy: { dueDate: 'asc' } },
      assignedTo: true,
      documents: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!prospect) notFound();

  const currentUserId = session?.user?.id;
  const isAssignedToMe = prospect.assignedToId === currentUserId;
  const isAssignedToSomeoneElse = prospect.assignedToId && !isAssignedToMe;

  const getIcon = (type: string) => {
    if (type === "PHONE") return <Phone className="h-4 w-4 text-blue-500" />;
    if (type === "EMAIL") return <Mail className="h-4 w-4 text-green-500" />;
    return <MessageSquare className="h-4 w-4 text-orange-500" />;
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "URGENT") return "border-l-red-500";
    if (priority === "HIGH") return "border-l-orange-500";
    return "border-l-gray-400";
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <Link href="/prospects" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Retour au CRM
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">{prospect.name}</h2>
        <p className="text-muted-foreground mt-1">{prospect.city} - {prospect.venueType}</p>
      </div>

      <div className="mb-6">
        {isAssignedToMe && (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 font-medium text-sm">
              <UserCheck className="h-4 w-4" /> Vous suivez ce prospect
            </div>
          </div>
        )}
        
        {isAssignedToSomeoneElse && (
          <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2 font-medium text-sm">
              <UserCheck className="h-4 w-4" /> Suivi par : {prospect.assignedTo?.firstName} {prospect.assignedTo?.lastName}
            </div>
            <form action={claimProspect}>
              <input type="hidden" name="prospectId" value={prospect.id} />
              <button type="submit" className="bg-yellow-100 hover:bg-yellow-200 border border-yellow-300 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium transition-colors">
                Prendre en charge
              </button>
            </form>
          </div>
        )}

        {!prospect.assignedToId && (
          <div className="flex items-center justify-between bg-muted border rounded-lg p-4">
            <span className="text-sm text-muted-foreground">Prospect non assigne</span>
            <form action={claimProspect}>
              <input type="hidden" name="prospectId" value={prospect.id} />
              <button type="submit" className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium hover:bg-primary/90">
                Prendre en charge
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-4">
          <form action={updateStage} className="rounded-lg border bg-card p-4 space-y-3">
            <input type="hidden" name="id" value={prospect.id} />
            <h3 className="font-semibold text-sm">Statut</h3>
            <select name="stage" defaultValue={prospect.stage} className="w-full bg-background border rounded-md px-3 py-2 text-sm">
              {stages.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
            <button type="submit" className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
              Changer le statut
            </button>
          </form>
          
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold text-sm mb-2">Score IA</h3>
            <p className="text-3xl font-bold">{prospect.commercialScore}<span className="text-base font-normal text-muted-foreground">/100</span></p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Contact & Lieu</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span>{prospect.contactName || "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Telephone</span><span className="text-blue-500 font-medium">{prospect.phone || "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-blue-500 font-medium truncate ml-2">{prospect.email || "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Adresse</span><span>{prospect.address || "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Jauge</span><span>{prospect.capacity ? `${prospect.capacity} places` : "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fourchette</span><span className="font-medium text-green-600">{prospect.minFee && prospect.maxFee ? `${prospect.minFee} - ${prospect.maxFee} EUR` : "-"}</span></div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold text-sm mb-4">Taches / Relances</h3>
            <div className="space-y-2 mb-4">
              {prospect.tasks.length === 0 && <p className="text-sm text-muted-foreground">Aucune tache.</p>}
              {prospect.tasks.map((task) => (
                <form key={task.id} action={toggleTask} className={`flex items-center gap-3 p-2 border-l-4 rounded-r-md bg-muted/30 ${getPriorityColor(task.priority)} ${task.isCompleted ? "opacity-50" : ""}`}>
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="isCompleted" value={task.isCompleted.toString()} />
                  <button type="submit" className="mt-0.5">
                    <CheckCircle2 className={`h-5 w-5 ${task.isCompleted ? "text-green-500" : "text-muted-foreground"}`} />
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm ${task.isCompleted ? "line-through" : ""}`}>{task.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(task.dueDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className="text-xs bg-background px-2 py-0.5 rounded border">{task.priority}</span>
                </form>
              ))}
            </div>
            <form action={addTask} className="border-t pt-4 space-y-3">
              <input type="hidden" name="prospectId" value={prospect.id} />
              <div className="grid grid-cols-3 gap-2">
                <input type="text" name="title" required placeholder="Ex: Relance" className="col-span-3 bg-background border rounded-md px-3 py-2 text-sm" />
                <select name="type" className="bg-background border rounded-md px-3 py-2 text-sm">
                  <option value="FOLLOW_UP">Relance</option>
                  <option value="CALL">Appel</option>
                  <option value="EMAIL">Email</option>
                </select>
                <select name="priority" className="bg-background border rounded-md px-3 py-2 text-sm">
                  <option value="LOW">Basse</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="HIGH">Haute</option>
                  <option value="URGENT">Urgente</option>
                </select>
                <input type="date" name="dueDate" required className="bg-background border rounded-md px-3 py-2 text-sm" />
              </div>
              <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
                + Ajouter une tache
              </button>
            </form>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold text-sm mb-4">Historique des echanges</h3>
            {prospect.interactions.length === 0 && <p className="text-sm text-muted-foreground">Aucun echange.</p>}
            <div className="space-y-4 mb-6">
              {prospect.interactions.map((interaction) => (
                <div key={interaction.id} className="flex gap-3">
                  <div className="mt-1">{getIcon(interaction.type)}</div>
                  <div className="flex-1 border-b pb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase">{interaction.type}</span>
                      <span className="text-xs text-muted-foreground">{new Date(interaction.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-sm">{interaction.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <form action={addInteraction} className="border-t pt-4 space-y-3">
              <input type="hidden" name="prospectId" value={prospect.id} />
              <div className="flex gap-2">
                <select name="type" className="bg-background border rounded-md px-3 py-2 text-sm">
                  <option value="NOTE">Note</option>
                  <option value="PHONE">Appel</option>
                  <option value="EMAIL">Email</option>
                </select>
                <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
                  Ajouter
                </button>
              </div>
              <textarea name="content" required rows={3} placeholder="Resume..." className="w-full bg-background border rounded-md px-3 py-2 text-sm resize-none" />
            </form>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold text-sm mb-4">Documents associes</h3>
            <UploadDocuments prospectId={prospect.id} initialDocs={prospect.documents} />
          </div>

        </div>
      </div>
    </MainLayout>
  );
}