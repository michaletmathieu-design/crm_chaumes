"use client";

import { useState } from "react";
import { assignOpportunity } from "@/app/actions/assign-opportunity";

type User = { id: string; firstName: string; lastName: string };

export default function AssignCommercial({ 
  opportunityId, 
  prospectId, 
  users, 
  currentAssigned 
}: { 
  opportunityId: string; 
  prospectId: string;
  users: User[]; 
  currentAssigned: User | null;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setIsUpdating(true);
    const newUserId = e.target.value === "" ? null : e.target.value;
    await assignOpportunity(opportunityId, prospectId, newUserId);
    setIsUpdating(false);
  }

  return (
    <select 
      value={currentAssigned?.id || ""} 
      onChange={handleChange}
      disabled={isUpdating}
      className="text-xs font-medium text-foreground bg-transparent border border-input rounded px-1.5 py-0.5 w-full cursor-pointer hover:bg-muted/50 transition-colors"
    >
      <option value="">-- Non assigné --</option>
      {users.map(u => (
        <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
      ))}
    </select>
  );
}