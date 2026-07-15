"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SearchCommand } from "@/components/search-command";
import { LayoutDashboard, Users, Music, CalendarDays, FileText, FolderOpen, Search, Settings, LogOut, MapPin, Sparkles, Menu, X } from "lucide-react";

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

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // NOUVEAU : État pour le menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Si pas connecte, on renvoie vers la page de login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // On n'affiche rien pendant le chargement ou si non connecte
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  // NOUVEAU : Fonction pour fermer le menu quand on clique sur un lien
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-muted/40 p-4">
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-2">
          <Music className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-bold text-sm leading-tight">CRM Tourneur</h1>
            <p className="text-xs text-muted-foreground">Les Productions</p>
          </div>
        </div>
        {/* Bouton Fermer uniquement visible sur mobile */}
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
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
              onClick={handleLinkClick}
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
      <button 
        onClick={() => { signOut(); handleLinkClick(); }} 
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full text-left"
      >
        <LogOut className="h-4 w-4" />
        Deconnexion
      </button>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      
      {/* SIDEBAR ORDINATEUR (Caché sur mobile