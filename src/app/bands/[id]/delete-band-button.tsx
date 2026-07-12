"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteBand } from "./delete-band-action";

interface DeleteBandButtonProps {
  bandId: string;
  bandName: string;
}

export default function DeleteBandButton({ bandId, bandName }: DeleteBandButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      `Supprimer « ${bandName} » ?\n\nCette action est irréversible. Tous les documents, devis et événements liés seront également supprimés.`
    );

    if (!confirmed) return;

    startTransition(async () => {
      try {
        await deleteBand(bandId);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erreur lors de la suppression");
      }
    });
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      className="gap-2"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      {isPending ? "Suppression…" : "Supprimer ce groupe"}
    </Button>
  );
}