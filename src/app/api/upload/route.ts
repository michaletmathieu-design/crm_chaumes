import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const targetId = formData.get("targetId") as string;
    const targetType = formData.get("targetType") as string; // "PROSPECT" ou "BAND"
    const category = formData.get("category") as string;

    if (!file) return NextResponse.json({ error: "Pas de fichier" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;

    // 1. Envoi dans le bucket Supabase
    const { data, error } = await supabase.storage
      .from("documents")
      .upload(uniqueName, buffer, { contentType: file.type });

    if (error) throw new Error("Erreur upload Supabase: " + error.message);

    // 2. Recupere l'URL publique
    const { data: publicUrlData } = supabase.storage.from("documents").getPublicUrl(data.path);

    // 3. Sauvegarde en base de donnees selon le type
    if (targetType === "BAND") {
      await prisma.document.create({
        data: { name: file.name, category, fileUrl: publicUrlData.publicUrl, bandId: targetId },
      });
    } else {
      await prisma.document.create({
        data: { name: file.name, category, fileUrl: publicUrlData.publicUrl, prospectId: targetId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const fileUrl = searchParams.get("fileUrl");

    if (!id || !fileUrl) return NextResponse.json({ error: "Donnees manquantes" }, { status: 400 });

    const fileName = fileUrl.split("/").pop();
    if (fileName) {
      await supabase.storage.from("documents").remove([fileName]);
    }

    await prisma.document.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erreur de suppression" }, { status: 500 });
  }
}