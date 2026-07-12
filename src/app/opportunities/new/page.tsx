import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import CreateOpportunityForm from "./create-opportunity-form";

export default async function NewOpportunityPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Tous les prospects sont visibles
  const prospects = await prisma.prospect.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, city: true },
  });

  // Les groupes : tous pour l'admin, seulement les siens pour le commercial
  const bands = session.user.role === "ADMIN"
    ? await prisma.band.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, genre: true } })
    : await prisma.band.findMany({
        where: { members: { some: { userId: session.user.id } } },
        orderBy: { name: "asc" },
        select: { id: true, name: true, genre: true },
      });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/prospects"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Retour au CRM
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Nouvelle opportunité</h2>
        <p className="text-muted-foreground mt-1">
          Associer un groupe à un prospect pour commencer un suivi.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <CreateOpportunityForm prospects={prospects} bands={bands} />
      </div>
    </div>
  );
}