import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (!query) return NextResponse.json([]);

  try {
    const [bands, prospects, quotes] = await Promise.all([
      prisma.band.findMany({ where: { name: { contains: query } }, take: 3 }),
      prisma.prospect.findMany({ where: { name: { contains: query } }, take: 5 }),
      prisma.quote.findMany({ 
        where: { number: { contains: query } }, 
        take: 3, 
        include: { band: true, prospect: true } 
      }),
    ]);

    const results = [
      ...bands.map(b => ({ id: b.id, type: "Groupe", name: b.name, href: `/bands/${b.id}` })),
      ...prospects.map(p => ({ id: p.id, type: "Prospect", name: `${p.name} (${p.city})`, href: `/prospects/${p.id}` })),
      ...quotes.map(q => ({ id: q.id, type: "Devis", name: `${q.number} - ${q.band.name}`, href: "/quotes" })),
    ];

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json([]);
  }
}