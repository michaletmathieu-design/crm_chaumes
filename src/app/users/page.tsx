import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ArrowLeft, Plus, Shield, Music, Briefcase } from "lucide-react";
import Link from "next/link";

const roleConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  ADMIN: {
    label: "Admin",
    icon: <Shield className="h-3.5 w-3.5" />,
    className: "bg-red-100 text-red-700",
  },
  COMMERCIAL: {
    label: "Commercial",
    icon: <Briefcase className="h-3.5 w-3.5" />,
    className: "bg-blue-100 text-blue-700",
  },
  MUSICIAN: {
    label: "Musicien",
    icon: <Music className="h-3.5 w-3.5" />,
    className: "bg-green-100 text-green-700",
  },
};

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      bands: {
        include: { band: { select: { name: true } } },
      },
      _count: {
        select: { opportunities: true, tasks: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Retour au dashboard
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Utilisateurs</h2>
          <p className="text-muted-foreground mt-1">
            {users.length} compte{users.length > 1 ? "s" : ""} enregistré{users.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/users/new"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvel utilisateur
        </Link>
      </div>

      {users.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">Aucun utilisateur en base.</p>
          <Link
            href="/users/new"
            className="inline-flex items-center gap-2 mt-4 text-sm text-primary hover:underline"
          >
            <Plus className="h-4 w-4" /> Créer le premier utilisateur
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Utilisateur</th>
                  <th className="text-left px-4 py-3 font-medium">Rôle</th>
                  <th className="text-left px-4 py-3 font-medium">Groupes liés</th>
                  <th className="text-left px-4 py-3 font-medium">Opp.</th>
                  <th className="text-left px-4 py-3 font-medium">Tâches</th>
                  <th className="text-left px-4 py-3 font-medium">Créé le</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const config = roleConfig[user.role] || roleConfig.COMMERCIAL;
                  return (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
                        >
                          {config.icon}
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.bands.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.bands.map((m) => (
                              <Link
                                key={m.bandId}
                                href={`/bands/${m.bandId}`}
                                className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                {m.band.name}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user._count.opportunities}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user._count.tasks}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.createdAt.toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/users/${user.id}/edit`}
                          className="text-sm text-primary hover:underline"
                        >
                          Modifier
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}