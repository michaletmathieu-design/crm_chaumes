"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{id: string, type: string, name: string, href: string}>>([]);
  const router = useRouter();

  // Raccourci clavier
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Recherche API
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${query}`);
      const data = await res.json();
      setResults(data);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Fond sombre */}
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
      
      {/* Fenetre de recherche */}
      <div className="relative w-full max-w-lg bg-background border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center border-b px-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground mr-2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
          <input 
            autoFocus
            className="flex-1 h-12 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Rechercher un groupe, prospect, devis..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto p-2">
          {query.length > 0 && results.length === 0 && (
            <p className="p-4 text-sm text-center text-muted-foreground">Aucun resultat trouve.</p>
          )}
          {results.map((result) => (
            <button 
              key={result.id}
              className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
              onClick={() => {
                setOpen(false);
                setQuery("");
                router.push(result.href);
              }}
            >
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{result.type}</span>
              {result.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}