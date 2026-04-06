import { NextResponse } from "next/server";
import { notifyN8nSubmitForRow } from "@/lib/n8nNotifyServer";
import { getSupabaseServerClient } from "@/lib/env.server";
import { supabaseMisconfiguredResponse } from "@/lib/supabaseConfigError";

/** Isolated from /api/submit so the browser triggers n8n after a successful save (separate invocation). */
export const maxDuration = 60;

type Body = {
  submissionId?: string;
};

export async function POST(req: Request) {
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (e) {
    console.error(e);
    return supabaseMisconfiguredResponse();
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const submissionId = body.submissionId?.trim();
  if (!submissionId) {
    return NextResponse.json(
      { error: "submissionId is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Submission not found" },
      { status: 404 }
    );
  }

  const n8n = await notifyN8nSubmitForRow(data as Record<string, unknown>);
  // Upstream n8n failure must not be HTTP 200 — otherwise Vercel logs look “green” while workflows never ran.
  const upstreamFailed = !n8n.skipped && n8n.ok !== true;
  return NextResponse.json(
    { ok: !upstreamFailed, n8n },
    { status: upstreamFailed ? 502 : 200 }
  );
}
