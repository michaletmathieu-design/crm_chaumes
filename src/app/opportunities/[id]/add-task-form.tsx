"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addTask } from "./add-task-action";

interface AddTaskFormProps {
  opportunityId: string;
}

export default function AddTaskForm({ opportunityId }: AddTaskFormProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await addTask(formData);
      window.location.reload();
    });
  }

  return (
    <form action={handleSubmit} className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">Ajouter une relance / tâche</h3>
      <input type="hidden" name="opportunityId" value={opportunityId} />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
        <div className="md:col-span-2">
          <input
            type="text"
            name="title"
            required
            placeholder="Ex: Relancer pour la disponibilité"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <input
            type="date"
            name="dueDate"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          <select name="type" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="FOLLOW_UP">Relance</option>
            <option value="CALL">Appel à faire</option>
            <option value="SEND_QUOTE">Envoyer devis</option>
            <option value="OTHER">Autre</option>
          </select>
          <Button type="submit" disabled={isPending} size="sm" className="gap-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            +
          </Button>
        </div>
      </div>
      
      <div className="flex gap-2">
        <label className="text-xs text-muted-foreground flex items-center gap-1.5">
          Priorité :
          <select name="priority" defaultValue="MEDIUM" className="rounded-md border border-input bg-background px-2 py-1 text-xs">
            <option value="LOW">Basse</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
          </select>
        </label>
      </div>
    </form>
  );
}