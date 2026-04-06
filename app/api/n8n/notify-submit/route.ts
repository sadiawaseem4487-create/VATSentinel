import { NextResponse, after } from "next/server";
import { notifyN8nSubmitForRow } from "@/lib/n8nNotifyServer";
import { getN8nSubmitWebhookUrl, getSupabaseServerClient } from "@/lib/env.server";
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

  const row = data as Record<string, unknown>;

  if (!getN8nSubmitWebhookUrl()) {
    const n8n = await notifyN8nSubmitForRow(row);
    const upstreamFailed = !n8n.skipped && n8n.ok !== true;
    return NextResponse.json(
      { ok: !upstreamFailed, n8n },
      { status: upstreamFailed ? 502 : 200 }
    );
  }

  console.log(
    "[n8n notify-submit] webhook queued via after(); response returns immediately — see logs for POST result"
  );

  after(() => {
    void notifyN8nSubmitForRow(row)
      .then((n8n) => {
        if (n8n.skipped) {
          console.warn("[n8n notify-submit] after(): skipped", n8n.skipReason);
        } else if (n8n.ok === false) {
          console.error("[n8n notify-submit] after(): upstream failed", {
            httpStatus: n8n.httpStatus,
            error: n8n.error,
          });
        } else {
          console.log("[n8n notify-submit] after(): OK", n8n.httpStatus);
        }
      })
      .catch((err) => {
        console.error("[n8n notify-submit] after(): exception", err);
      });
  });

  return NextResponse.json({
    ok: true,
    n8n: { skipped: false, queued: true },
  });
}
