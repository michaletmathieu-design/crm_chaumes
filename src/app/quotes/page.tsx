import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

async function addQuote(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) return;

  // Génération automatique du numéro de devis
  const count = await prisma.quote.count();
  const number = `DEV-2024-${String(count + 1).padStart(3, '0')}`;
  
  await prisma.quote.create({
    data: {
      number,
      amount: Number(formData.get("amount")),
      opportunityId: formData.get("opportunityId") as string,
      status: "DRAFT", // Par défaut en brouillon
    },
  });
  revalidatePath("/quotes");
}

export default async function QuotesPage() {
  const session = await auth();

  // Filtre de sécurité : le commercial ne voit que les devis de ses groupes
  const quoteFilter = session?.user?.role === "COMMERCIAL"
    ? { opportunity: { band: { members: { some: { userId: session.user.id } } } } }
    : {};

  const quotes = await prisma.quote.findMany({
    where: quoteFilter,
    include: {
      opportunity: {
        include: {
          band: { select: { name: true } },
          prospect: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' }
  });

  // Filtre pour le formulaire : on ne propose que les opportunités autorisées
  const opportunityFilter = session?.user?.role === "COMMERCIAL"
    ? { band: { members: { some: { userId: session.user.id } } } }
    : {};

  const opportunities = await prisma.opportunity.findMany({
    where: opportunityFilter,
    include: {
      band: { select: { name: true } },
      prospect: { select: { name: true, city: true } },
    },
    orderBy: { id: "desc" },
  });

  const getStatusColor = (status: string) => {
    if (status === "ACCEPTED") return "bg-green-500/20 text-green-700";
    if (status === "REFUSED") return "bg-red-500/20 text-red-700";
    if (status === "SENT") return "bg-blue-500/20 text-blue-700";
    return "bg-gray-500/20 text-gray-700"; // DRAFT
  };

  const getStatusLabel = (status: string) => {
    if (status === "DRAFT") return "Brouillon";
    if (status === "SENT") return "Envoyé";
    if (status === "ACCEPTED") return "Accepté";
    if (status === "REFUSED") return "Refusé";
    return status;
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Devis</h2>
        <p className="text-muted-foreground">
          Suivi des propositions commerciales 
          {session?.user?.role === "COMMERCIAL" && <span className="text-xs ml-2">(Mes groupes uniquement)</span>}
        </p>
      </div>

      <form action={addQuote} className="bg-card border rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground">Opportunité (Groupe + Lieu)</label>
          <select name="opportunityId" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm">
            <option value="">-- Choisir une opportunité --</option>
            {opportunities.map((opp) => (
              <option key={opp.id} value={opp.id}>
                {opp.band.name} - {opp.prospect.name} ({opp.prospect.city})
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Montant (EUR)</label>
            <input type="number" name="amount" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" placeholder="1500" />
          </div>
          <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 h-[42px]">
            + Créer
          </button>
        </div>
      </form>

      <div className="border rounded-lg bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left p-3 font-medium">Numéro</th>
              <th className="text-left p-3 font-medium">Groupe</th>
              <th className="text-left p-3 font-medium">Lieu</th>
              <th className="text-left p-3 font-medium">Montant</th>
              <th className="text-left p-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Aucun devis pour le moment.</td></tr>
            )}
            {quotes.map((quote) => (
              <tr key={quote.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3 font-medium">{quote.number}</td>
                <td className="p-3">{quote.opportunity.band.name}</td>
                <td className="p-3 text-muted-foreground">{quote.opportunity.prospect.name}</td>
                <td className="p-3 font-medium">{quote.amount} EUR</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(quote.status)}`}>
                    {getStatusLabel(quote.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}