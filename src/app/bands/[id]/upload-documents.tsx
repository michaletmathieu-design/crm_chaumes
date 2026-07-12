"use client";

import { useState } from "react";
import { UploadCloud, FileText, Trash2 } from "lucide-react";
import Link from "next/link";

type Doc = { id: string, name: string, fileUrl: string, category: string };

export default function UploadDocuments({ prospectId, initialDocs }: { prospectId: string, initialDocs: Doc[] }) {
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState<Doc[]>(initialDocs);

  async function handleUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("targetId", prospectId);
    formData.append("targetType", "BAND");
    formData.append("category", "RIDER");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setDocs(prev => [{ id: Date.now().toString(), name: file.name, fileUrl: "pending", category: "RIDER" }, ...prev]);
      } else {
        alert("Erreur serveur lors de l'upload");
      }
    } catch (error) {
      alert("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: string, fileUrl: string) {
    if (!confirm("Supprimer ce fichier ?")) return;

    try {
      await fetch(`/api/upload?id=${docId}&fileUrl=${encodeURIComponent(fileUrl)}`, { method: "DELETE" });
      setDocs(prev => prev.filter(d => d.id !== docId));
    } catch (error) {
      alert("Erreur lors de la suppression");
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleUpload(files[0]);
    }
  };

  return (
    <div>
      <div 
        className="border-2 border-dashed rounded-md p-6 text-center hover:border-primary/50 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          id="file-upload-band" 
          className="hidden" 
          accept=".pdf,.jpg,.png,.doc,.docx" 
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) handleUpload(e.target.files[0]);
          }} 
        />
        <label htmlFor="file-upload-band" className="cursor-pointer flex flex-col items-center gap-2">
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {uploading ? "Envoi en cours..." : "Glissez un fichier ici ou cliquez"}
          </span>
        </label>
      </div>
      
      {docs.length > 0 && (
        <div className="mt-4 space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-md border text-sm">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="flex-1 truncate">{doc.name}</span>
              <Link href={doc.fileUrl} target="_blank" className="text-xs text-primary hover:underline">
                Voir
              </Link>
              <button 
                onClick={() => handleDelete(doc.id, doc.fileUrl)} 
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3 w-3" /> Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}