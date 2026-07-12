"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateUser } from "./update-user-action";

interface Band {
  id: string;
  name: string;
  genre: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  bands: { bandId: string; band: { name: string } }[];
}

interface EditUserFormProps {
  user: User;
  bands: Band[];
}

const initialState: { error?: string } = {};

export default function EditUserForm({ user, bands }: EditUserFormProps) {
  const [state, formAction, isPending] = useActionState(updateUser, initialState);
  const [selectedBands, setSelectedBands] = useState<string[]>(
    user.bands.map((b) => b.bandId)
  );
  const [role, setRole] = useState(user.role);

  function toggleBand(bandId: string) {
    setSelectedBands((prev) =>
      prev.includes(bandId)
        ? prev.filter((id) => id !== bandId)
        : [...prev, bandId]
    );
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <input type="hidden" name="userId" value={user.id} />

      {state?.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium mb-1.5">
            Prénom *
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            defaultValue={user.firstName}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium mb-1.5">
            Nom *
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            defaultValue={user.lastName}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5">
          Email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={user.email}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1.5">
          Rôle *
        </label>
        <select
          id="role"
          name="role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setSelectedBands([]);
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="COMMERCIAL">Commercial</option>
          <option value="MUSICIAN">Musicien</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {bands.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Groupes liés
            {role === "COMMERCIAL" && (
              <span className="text-muted-foreground font-normal ml-1">(groupes qu&apos;il gère)</span>
            )}
            {role === "MUSICIAN" && (
              <span className="text-muted-foreground font-normal ml-1">(groupes dont il est membre)</span>
            )}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {bands.map((band) => (
              <label
                key={band.id}
                className={`flex items-center gap-2 rounded-md border p-3 text-sm cursor-pointer transition-colors ${
                  selectedBands.includes(band.id)
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-muted/50"
                }`}
              >
                <input
                  type="checkbox"
                  name="bandIds"
                  value={band.id}
                  checked={selectedBands.includes(band.id)}
                  onChange={() => toggleBand(band.id)}
                  className="rounded"
                />
                <div>
                  <div className="font-medium">{band.name}</div>
                  <div className="text-xs text-muted-foreground">{band.genre}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Enregistrer les modifications
        </Button>
        <a
          href="/users"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Annuler
        </a>
      </div>
    </form>
  );
}