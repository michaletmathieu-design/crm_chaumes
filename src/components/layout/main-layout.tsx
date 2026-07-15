"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SearchCommand } from "@/components/search-command";
import { LayoutDashboard, Users, Music, CalendarDays, FileText, FolderOpen, Search, Settings, LogOut, MapPin, Sparkles } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Pipeline", href: "/opportunities", icon: Users },
  { name: "Lieux / Prospects", href: "/prospects", icon: MapPin },
  { name: "Groupes", href: "/bands", icon: Music },
  { name: "Agenda", href: "/calendar", icon: CalendarDays },
  { name: "Devis", href: "/quotes", icon: FileText },
  { name: "Documents", href: "/documents", icon: FolderOpen },
  { name: "Prospection IA", href: "/prospection", icon: Sparkles },
  { name: "Utilisateurs", href: "/users", icon: Settings, adminOnly: true },
];

// Les 4 onglets qu'on veut afficher sur la barre MOBILE en bas
const mobileNavItems = [
  { name: "Pipeline", href: "/opportunities", icon: Users },
  { name: "Prospects", href: "/prospects", icon: MapPin },
  { name: "Prospection", href: "/prospection", icon: Sparkles },
  { name: "Agenda", href: "/calendar", icon: CalendarDays },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-muted/40 p-4">
      <div className="flex items-center gap-2 mb-8 px-2">
        <Music className="h-6 w-6 text-primary" />
        <div>
          <h1 className="font-bold text-sm leading-tight">CRM Tourneur</h1>
          <p className="text-xs text-muted-foreground">Les Productions</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems
          .filter((item) => {
            if ("adminOnly" in item && item.adminOnly) {
              return session?.user?.role === "ADMIN";
            }
            return true;
          })
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                pathname === item.href
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
      </nav>
      <Separator className="my-4" />
      <button onClick={() => signOut()} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full text-left">
        <LogOut className="h-4 w-4" />
        Deconnexion
      </button>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* MENU ORDINATEUR (Caché sur mobile) */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r">
        <SidebarContent />
      </aside>
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
          <div className="flex-1 flex justify-center">
            <button 
              onClick={() => alert("Utilise Ctrl+K")} 
              className="relative w-full max-w-md flex items-center gap-2 bg-muted/50 border rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <Search className="h-4 w-4" />
              Rechercher...
              <kbd className="pointer-events-none ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">Ctrl+K</span>
              </kbd>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {session?.user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline-block text-sm font-medium">{session?.user?.name}</span>
          </div>
        </header>
        
        {/* Le padding-bottom (pb-20) est ajouté sur mobile pour que le texte ne soit pas caché sous la barre du bas */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:pb-6 md:p-6">{children}</main>

        {/* BARRE DE NAVIGATION MOBILE (Fixée en bas, cachée sur ordinateur) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around bg-background border-t h-16 px-2">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px]">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <SearchCommand />
    </div>
  );
}