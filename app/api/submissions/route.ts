import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/env.server";
import { supabaseMisconfiguredResponse } from "@/lib/supabaseConfigError";

export async function GET() {
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (e) {
    console.error(e);
    return supabaseMisconfiguredResponse();
  }

  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("submissions list error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ submissions: data ?? [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load submissions" },
      { status: 500 }
    );
  }
}
