"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateStage } from "./update-stage-action";

interface UpdateStageFormProps {
  opportunityId: string;
  currentStage: string;
}

const stages = [
  { id: "NEW", label: "Nouveau" },
  { id: "TO_CONTACT", label: "À contacter" },
  { id: "FIRST_EXCHANGE", label: "Premier échange" },
  { id: "QUOTE_SENT", label: "Devis envoyé" },
  { id: "CONFIRMED", label: "Confirmé" },
  { id: "LOST", label: "Perdu" },
];

export default function UpdateStageForm({ opportunityId, currentStage }: UpdateStageFormProps) {
  const [isPending, startTransition] = useTransition();

  function handleStageChange(formData: FormData) {
    startTransition(async () => {
      await updateStage(formData);
      window.location.reload();
    });
  }

  return (
    <form action={handleStageChange} className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold mb-3 text-sm">Changer le statut</h3>
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <select
        name="stage"
        defaultValue={currentStage}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {stages.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
      <Button type="submit" disabled={isPending} size="sm" className="w-full gap-2">
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Mettre à jour
      </Button>
    </form>
  );
}