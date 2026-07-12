import MainLayout from "@/components/layout/main-layout";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import UploadDocuments from "./upload-documents";

export default async function BandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const band = await prisma.band.findUnique({ 
    where: { id },
    include: { documents: { orderBy: { createdAt: 'desc' } } }
  });

  if (!band) notFound();

  return (
    <MainLayout>
      <div className="mb-6">
        <Link href="/bands" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Retour aux groupes
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">{band.name}</h2>
        <p className="text-muted-foreground mt-1">{band.genre}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-3 text-sm">Informations</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Ajoute le</span><span>Recemment</span></div>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-3 text-sm">Cachets</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Minimum</span><span>{band.minFee} EUR</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Conseille</span><span className="font-bold text-green-500">{band.suggestedFee} EUR</span></div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-2 text-sm">Description</h3>
            <p className="text-sm text-muted-foreground">Aucune description pour le moment.</p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-2 text-sm">Configuration Technique / Rider</h3>
            <p className="text-sm text-muted-foreground">Aucune configuration technique.</p>
          </div>

          {/* La zone de documents est ici maintenant */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold text-sm mb-4">Documents du groupe</h3>
            <UploadDocuments prospectId={band.id} initialDocs={band.documents} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}