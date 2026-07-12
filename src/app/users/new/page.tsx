import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import CreateUserForm from "./create-user-form";

export default async function NewUserPage() {
  const session = await auth();

  // Seul l'ADMIN peut accéder à cette page
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const bands = await prisma.band.findMany({
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
        <h2 className="text-3xl font-bold tracking-tight">Nouvel utilisateur</h2>
        <p className="text-muted-foreground mt-1">
          Créez un compte commercial, musicien ou admin.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <CreateUserForm bands={bands} />
      </div>
    </div>
  );
}