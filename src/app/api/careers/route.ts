import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uxbndxymxrzvhlxgvqyn.supabase.co";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const formData = await req.formData();

    const userId = formData.get("userId") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;
    const portfolioUrl = formData.get("portfolioUrl") as string;
    const answersRaw = formData.get("answers") as string;
    const resumeFile = formData.get("resume") as File | null;

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let resumeUrl = "";

    // Upload resume to Supabase Storage
    if (resumeFile) {
      const bytes = await resumeFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${userId}-${Date.now()}-${resumeFile.name.replace(/[^a-zA-Z0-9.\-]/g, "")}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("applications")
        .upload(fileName, buffer, { contentType: resumeFile.type });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("applications")
        .getPublicUrl(uploadData.path);

      resumeUrl = urlData.publicUrl;
    }

    const answers = answersRaw ? JSON.parse(answersRaw) : {};

    // Save to Supabase
    const { data: dbData, error: dbError } = await supabase
      .from("career_applications")
      .insert({ user_id: userId, role, portfolio_url: portfolioUrl, resume_url: resumeUrl, answers })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database insert failed: ${dbError.message}`);
    }

    // TODO: Add Google Sheets integration via a server-side webhook or Edge Function
    // when GOOGLE_SERVICE_ACCOUNT_KEY and CAREERS_SHEET_ID are configured.
    console.log(`[careers] Application received: ${name} for ${role}`);

    return NextResponse.json({ success: true, application: dbData });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[careers] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
