"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/main-layout";
import { Sparkles, Download, Loader2 } from "lucide-react";

export default function ProspectionPage() {
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(formData: FormData) {
    setLoading(true);
    setError(null);
    setCsvData(null);

    try {
      const res = await fetch("/api/generate-leads", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setCsvData(data.csv);
      } else {
        setError(data.error || "Erreur inconnue");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!csvData) return;
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "prospects_ia.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Prospection IA</h2>
        <p className="text-muted-foreground">Genere une liste de prospects qualifiee grace a l'API Google Maps</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <form action={handleGenerate} className="bg-card border rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Ville / Region ciblee</label>
              <input type="text" name="city" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" placeholder="Ex: Dijon, Cote d'Or" />
            </div>
            <div>
              <label className="text-sm font-medium">Type de lieu specifique</label>
              <select name="venueType" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm">
			    <option value="Tout Type">Tout Type</option>
                <option value="Bars musicaux">Bars musicaux</option>
                <option value="Bars à concerts">Bars à concerts</option>
                <option value="Pubs">Pubs</option>
                <option value="Restaurants avec concerts">Restaurants avec concerts</option>
                <option value="Guinguettes">Guinguettes</option>
                <option value="Guinguettes d'été">Guinguettes d'été</option>
                <option value="Campings">Campings</option>
                <option value="Hôtels">Hôtels</option>
                <option value="Casinos de proximité">Casinos de proximité</option>
                <option value="Domaines de mariage">Domaines de mariage</option>
                <option value="Châteaux de réception">Châteaux de réception</option>
                <option value="Salles des fêtes">Salles des fêtes</option>
                <option value="Salles municipales">Salles municipales</option>
                <option value="Services culturels des mairies">Services culturels des mairies</option>
                <option value="Offices de tourisme">Offices de tourisme</option>
                <option value="Festivals locaux">Festivals locaux</option>
                <option value="Marchés nocturnes">Marchés nocturnes</option>
                <option value="Fêtes patronales">Fêtes patronales</option>
                <option value="Fêtes de village">Fêtes de village</option>
                <option value="Comités des fêtes">Comités des fêtes</option>
                <option value="Associations culturelles">Associations culturelles</option>
                <option value="Centres sociaux">Centres sociaux</option>
                <option value="MJC">MJC</option>
                <option value="Centres culturels">Centres culturels</option>
                <option value="Comités d'entreprise">Comités d'entreprise</option>
                <option value="Entreprises organisant des soirées">Entreprises organisant des soirées</option>
                <option value="Associations sportives">Associations sportives</option>
                <option value="Autre structure">Autre structure</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Style musical recherche</label>
              <input type="text" name="style" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" placeholder="Ex: Rock, Chanson Francaise" />
            </div>
            <div>
              <label className="text-sm font-medium">Quantite a generer</label>
              <input type="number" name="quantity" defaultValue="15" min="5" max="50" className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-md text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Google Maps genere les lieux..." : "Generer la liste 100% fiable"}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            Erreur : {error}
          </div>
        )}

        {csvData && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Liste 100% reelle generee !</h3>
                <p className="text-sm text-green-600">Téléchargez le fichier CSV et importez-le dans le CRM.</p>
              </div>
              <button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                <Download className="h-4 w-4" /> Telecharger le CSV
              </button>
            </div>
            <div className="bg-white p-4 rounded border text-xs font-mono max-h-60 overflow-y-auto whitespace-pre">
              {csvData}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}