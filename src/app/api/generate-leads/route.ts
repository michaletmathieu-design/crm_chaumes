import { NextResponse } from "next/server";
import { generateLeads } from "@/app/prospection/generate-action";

export async function POST(request: Request) {
  const formData = await request.formData();
  const result = await generateLeads(formData);
  
  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
}