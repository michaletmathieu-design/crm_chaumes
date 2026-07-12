"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createOpportunity } from "./create-opportunity-action";

interface Prospect {
  id: string;
  name: string;
  city: string;
}

interface Band {
  id: string;
  name: string;
  genre: string;
}

interface CreateOpportunityFormProps {
  prospects: Prospect[];
  bands: Band[];
}

const initialState: { error?: string } = {};

export default function CreateOpportunityForm({ prospects, bands }: CreateOpportunityFormProps) {
  const [state, formAction, isPending] = useActionState(createOpportunity, initialState);

  return (
    <form action={formAction} className="max-w-lg space-y-6">
      {state?.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="prospectId" className="block text-sm font-medium mb-1.5">
          Prospect (Lieu / Contact) *
        </label>
        <select
          id="prospectId"
          name="prospectId"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">-- Choisir un prospect --</option>
          {prospects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.city})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="bandId" className="block text-sm font-medium mb-1.5">
          Groupe à pitcher *
        </label>
        <select
          id="bandId"
          name="bandId"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">-- Choisir un groupe --</option>
          {bands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.genre})
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Créer l'opportunité
        </Button>
        <a
          href="/prospects"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Annuler
        </a>
      </div>
    </form>
  );
}