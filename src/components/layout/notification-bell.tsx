"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { getPendingFollowUps } from "@/app/actions/get-notifications";
import Link from "next/link";

type Relance = {
  id: string;
  title: string;
  dueDate: string;
  opportunity: {
    prospect: { name: string; city: string };
    band: { name: string };
  };
};

export default function NotificationBell() {
  const [relances, setRelances] = useState<Relance[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // On charge les relances au démarrage
    getPendingFollowUps().then(setRelances);

    // On rafraîchit les relances toutes les 60 secondes (optionnel)
    const interval = setInterval(() => {
      getPendingFollowUps().then(setRelances);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === yesterday.toDateString()) return "Hier";
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative">
      {/* Bouton Cloche */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="h-5 w-5" />
        {relances.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {relances.length > 9 ? '9+' : relances.length}
          </span>
        )}
      </button>

      {/* Menu déroulant des notifications */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b bg-muted/50">
            <h3 className="font-semibold text-sm">Relances à faire ({relances.length})</h3>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {relances.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">Aucune relance en attente !</p>
            ) : (
              relances.map((relance) => (
                <Link 
                  key={relance.id} 
                  href={`/opportunities/${relance.opportunity.id}`}
                  onClick={() => setIsOpen(false)}
                  className="block p-3 hover:bg-muted/50 transition-colors border-b last:border-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{relance.opportunity.band.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {relance.opportunity.prospect.name} ({relance.opportunity.prospect.city})
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                      {formatDate(relance.dueDate)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate italic">{relance.title}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}