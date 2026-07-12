import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import EditUserForm from "./edit-user-form";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      bands: { include: { band: { select: { name: true } } } },
    },
  });

  if (!user) notFound();

  const allBands = await prisma.band.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, genre: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/users"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux utilisateurs
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">
          Modifier {user.firstName} {user.lastName}
        </h2>
        <p className="text-muted-foreground mt-1">{user.email} — {user.role}</p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <EditUserForm
          user={user}
          bands={allBands}
        />
      </div>
    </div>
  );
}