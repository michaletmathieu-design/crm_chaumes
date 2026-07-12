import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Download, FileText, Music, MapPin } from "lucide-react";
import Link from "next/link";

export default async function DocumentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Filtre : le commercial ne voit que les documents de ses groupes
  // (On ne filtre pas les documents liés aux prospects pour ne pas cacher un plan de salle)
  const docFilter = session.user.role === "COMMERCIAL"
    ? { 
        OR: [
          { band: { members: { some: { userId: session.user.id } } } },
          { bandId: null } // Il voit les documents de prospect non liés à un groupe
        ]
      }
    : {};

  const documents = await prisma.document.findMany({
    where: docFilter,
    include: {
      band: { select: { name: true, id: true } },
      prospect: { select: { name: true, id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const getCategoryColor = (category: string) => {
    if (category === "RIDER") return "bg-purple-100 text-purple-700";
    if (category === "CONTRACT") return "bg-red-100 text-red-700";
    if (category === "TECH") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
        <p className="text-muted-foreground">
          {documents.length} document{documents.length > 1 ? "s" : ""} enregistré{documents.length > 1 ? "s" : ""}
          {session.user.role === "COMMERCIAL" && <span className="text-xs ml-2">(Mes groupes uniquement)</span>}
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucun document pour le moment.</p>
          <p className="text-xs text-muted-foreground mt-2">Ajoutez des documents depuis la fiche d'un groupe ou d'un prospect.</p>
        </div>
      ) : (
        <div className="border rounded-lg bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Fichier</th>
                <th className="text-left p-3 font-medium">Catégorie</th>
                <th className="text-left p-3 font-medium">Lié à</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-right p-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium">{doc.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(doc.category)}`}>
                      {doc.category}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {doc.band ? (
                      <Link href={`/bands/${doc.band.id}`} className="flex items-center gap-1 hover:text-foreground">
                        <Music className="h-3 w-3" /> {doc.band.name}
                      </Link>
                    ) : doc.prospect ? (
                      <Link href={`/prospects/${doc.prospect.id}`} className="flex items-center gap-1 hover:text-foreground">
                        <MapPin className="h-3 w-3" /> {doc.prospect.name}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {doc.createdAt.toLocaleDateString("fr-FR")}
                  </td>
                  <td className="p-3 text-right">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Download className="h-4 w-4" />
                      Voir
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </MainLayout>
  );
}