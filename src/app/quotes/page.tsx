import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function addQuote(formData: FormData) {
  "use server";
  // Generation automatique du numero de devis
  const count = await prisma.quote.count();
  const number = `DEV-2024-${String(count + 1).padStart(3, '0')}`;
  
  await prisma.quote.create({
    data: {
      number,
      amount: Number(formData.get("amount")),
      prospectId: formData.get("prospectId") as string,
      bandId: formData.get("bandId") as string,
    },
  });
  revalidatePath("/quotes");
}

export default async function QuotesPage() {
  const quotes = await prisma.quote.findMany({
    include: { band: true, prospect: true },
    orderBy: { createdAt: 'desc' }
  });

  const bands = await prisma.band.findMany();
  const prospects = await prisma.prospect.findMany();

  const getStatusColor = (status: string) => {
    if (status === "ACCEPTED") return "bg-green-500/20 text-green-700";
    if (status === "REFUSED") return "bg-red-500/20 text-red-700";
    if (status === "SENT") return "bg-blue-500/20 text-blue-700";
    return "bg-gray-500/20 text-gray-700";
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Devis</h2>
        <p className="text-muted-foreground">Suivi des propositions commerciales</p>
      </div>

      <form action={addQuote} className="bg-card border rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="text-xs text-muted-foreground">Groupe</label>
          <select name="bandId" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm">
            {bands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Prospect (Lieu)</label>
          <select name="prospectId" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm">
            {prospects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Montant (EUR)</label>
          <input type="number" name="amount" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" placeholder="1500" />
        </div>
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 h-[42px]">
          + Creer un devis
        </button>
      </form>

      <div className="border rounded-lg bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left p-3 font-medium">Numero</th>
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
                <td className="p-3">{quote.band.name}</td>
                <td className="p-3 text-muted-foreground">{quote.prospect.name}</td>
                <td className="p-3 font-medium">{quote.amount} EUR</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(quote.status)}`}>
                    {quote.status}
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