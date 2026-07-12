"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addInteraction } from "./add-interaction-action";

interface AddInteractionFormProps {
  opportunityId: string;
}

export default function AddInteractionForm({ opportunityId }: AddInteractionFormProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await addInteraction(formData);
      window.location.reload();
    });
  }

  return (
    <form action={handleSubmit} className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">Ajouter un échange</h3>
      <input type="hidden" name="opportunityId" value={opportunityId} />
      
      <div className="flex gap-2 mb-3">
        <select name="type" required className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="PHONE">📞 Appel</option>
          <option value="EMAIL">✉️ Email</option>
          <option value="NOTE">📝 Note interne</option>
          <option value="MEETING">🤝 Réunion</option>
        </select>
        <Button type="submit" disabled={isPending} size="sm" className="gap-2">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Ajouter
        </Button>
      </div>
      
      <textarea
        name="content"
        required
        rows={3}
        placeholder="Ex: A appelé, intéressé par une date en juin. Veut recevoir un devis."
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />
    </form>
  );
}