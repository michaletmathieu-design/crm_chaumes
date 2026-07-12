import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

async function addEvent(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) return;

  const opportunityId = formData.get("opportunityId") as string;
  const date = formData.get("date") as string;
  const status = formData.get("status") as string;
  const fee = formData.get("fee") as string;

  if (!opportunityId || !date) return;

  await prisma.event.create({
    data: {
      opportunityId,
      optionDate1: new Date(date),
      status,
      grossFee: Number(fee) || 0,
    },
  });
  revalidatePath("/calendar");
}

export default async function CalendarPage() {
  const session = await auth();

  // Filtre de sécurité : le commercial ne voit que les événements de ses groupes
  const eventFilter = session?.user?.role === "COMMERCIAL"
    ? { opportunity: { band: { members: { some: { userId: session.user.id } } } } }
    : {};

  const events = await prisma.event.findMany({
    where: eventFilter,
    include: {
      opportunity: {
        include: {
          band: { select: { name: true } },
          prospect: { select: { name: true } },
        },
      },
    },
    orderBy: { optionDate1: "asc" },
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

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agenda</h2>
          <p className="text-muted-foreground">
            {today.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} 
            {session?.user?.role === "COMMERCIAL" && <span className="text-xs ml-2">(Mes groupes uniquement)</span>}
          </p>
        </div>
      </div>

      <form action={addEvent} className="bg-card border rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
        <div>
          <label className="text-xs text-muted-foreground">Date</label>
          <input type="date" name="date" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Statut</label>
            <select name="status" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm">
              <option value="OPTION_1">Option 1</option>
              <option value="OPTION_2">Option 2</option>
              <option value="CONFIRMED">Confirmé</option>
            </select>
          </div>
          <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 h-[42px]">
            +
          </button>
        </div>
      </form>

      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {daysOfWeek.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r p-2 min-h-[100px] bg-muted/20"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = day === today.getDate();
            
            const dayEvents = events.filter((e) => {
              const eventDate = e.confirmedDate || e.optionDate1;
              return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year;
            });

            return (
              <div key={day} className={`border-b border-r p-2 min-h-[100px] ${isToday ? "bg-accent/30" : ""}`}>
                <span className={`text-sm ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>{day}</span>
                <div className="mt-1 space-y-1">
                  {dayEvents.map((event) => (
                    <div 
                      key={event.id} 
                      className={`text-xs p-1.5 rounded border truncate cursor-pointer ${
                        event.status === "CONFIRMED" 
                          ? "bg-green-500/20 text-green-700 border-green-500/30" 
                          : "bg-yellow-500/20 text-yellow-700 border-yellow-500/30"
                      }`}
                    >
                      {event.opportunity.band.name} - {event.opportunity.prospect.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/30"></div> Option</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30"></div> Confirmé</div>
      </div>
    </MainLayout>
  );
}