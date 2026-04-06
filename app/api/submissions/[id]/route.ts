import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/env.server";
import { supabaseMisconfiguredResponse } from "@/lib/supabaseConfigError";

const ALLOWED = new Set(["pending", "approved", "rejected"]);

type PatchBody = {
  status?: string;
  review_notes?: string;
  reviewer_email?: string;
};

/**
 * Direct database updates for evaluator decisions (Supabase `submissions` table).
 * n8n review chain: call POST /api/n8n/notify-review from the client after a successful PATCH.
 */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (e) {
    console.error(e);
    return supabaseMisconfiguredResponse();
  }

  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    let body: PatchBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const status = body.status?.trim().toLowerCase();
    if (!status || !ALLOWED.has(status)) {
      return NextResponse.json(
        { error: "status must be pending, approved, or rejected" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("submissions")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("submissions patch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ submission: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}
