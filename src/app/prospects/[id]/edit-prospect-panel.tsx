"use client";

import { useState } from "react";
import { User, Phone, Mail, MapPin, Pencil, X, Check } from "lucide-react";
import { updateProspect } from "./update-prospect-action";

// On définit le type des données qu'on reçoit du serveur
type ProspectData = {
  id: string;
  name: string;
  city: string;
  venueType: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  capacity: number | null;
  minFee: number | null;
  maxFee: number | null;
  status: string;
};

export default function EditProspectPanel({ prospect }: { prospect: ProspectData }) {
  const [isEditing, setIsEditing] = useState(false);

  // Fonction appelée quand on clique sur "Enregistrer"
  async function handleSubmit(formData: FormData) {
    await updateProspect(prospect.id, formData);
    setIsEditing(false); // Retourne au mode affichage
  }

  return (
    <div className="md:col-span-1 space-y-4">
      
      {/* --- CARTE 1 : INFOS DU LIEU --- */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Informations du lieu</h3>
          <button onClick={() => setIsEditing(!isEditing)} className="text-muted-foreground hover:text-foreground transition-colors">
            {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </button>
        </div>

        {isEditing ? (
          /* MODE EDITION */
          <form action={handleSubmit} className="space-y-3 text-sm">
            <input type="text" name="name" defaultValue={prospect.name} className="w-full bg-background border rounded px-2 py-1" placeholder="Nom du lieu" required />
            <input type="text" name="contactName" defaultValue={prospect.contactName || ""} className="w-full bg-background border rounded px-2 py-1" placeholder="Contact" />
            <input type="text" name="phone" defaultValue={prospect.phone || ""} className="w-full bg-background border rounded px-2 py-1" placeholder="Téléphone" />
            <input type="email" name="email" defaultValue={prospect.email || ""} className="w-full bg-background border rounded px-2 py-1" placeholder="Email" />
            <input type="text" name="city" defaultValue={prospect.city} className="w-full bg-background border rounded px-2 py-1" placeholder="Ville" required />
            <input type="text" name="venueType" defaultValue={prospect.venueType} className="w-full bg-background border rounded px-2 py-1" placeholder="Type (BAR, PUB...)" />
            
            {/* Champ caché pour gérer le statut (on le mettra dans la carte 2) */}
            <input type="hidden" name="status" value={prospect.status} />

            <button type="submit" className="w-full bg-primary text-primary-foreground rounded py-1.5 text-sm font-medium flex items-center justify-center gap-1 hover:bg-primary/90">
              <Check className="h-3 w-3" /> Enregistrer
            </button>
          </form>
        ) : (
          /* MODE AFFICHAGE (Ton code d'origine) */
          <div className="space-y-3 text-sm">
            {prospect.contactName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{prospect.contactName}</span>
              </div>
            )}
            {prospect.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{prospect.phone}</span>
              </div>
            )}
            {prospect.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{prospect.email}</span>
              </div>
            )}
            {prospect.city && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{prospect.city}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- CARTE 2 : DETAILS (Jauge, Budgets) --- */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold mb-3 text-sm">Détails</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span>{prospect.venueType}</span>
          </div>
          {prospect.capacity && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jauge</span>
              <span>{prospect.capacity} places</span>
            </div>
          )}
          {prospect.minFee && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Budget Min</span>
              <span>{prospect.minFee} EUR</span>
            </div>
          )}
          {prospect.maxFee && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Budget Max</span>
              <span>{prospect.maxFee} EUR</span>
            </div>
          )}
          
          {/* Affichage du statut qu'on vient d'ajouter */}
          <div className="flex justify-between pt-2 border-t mt-2">
            <span className="text-muted-foreground">Statut</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              prospect.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
              prospect.status === 'INACTIVE' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {prospect.status === 'ACTIVE' ? 'Actif' : prospect.status === 'INACTIVE' ? 'Inactif' : 'À vérifier'}
            </span>
          </div>
        </div>
      </div>
      
    </div>
  );
}