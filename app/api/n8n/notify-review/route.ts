import { NextResponse, after } from "next/server";
import {
  notifyN8nReviewDecision,
  resolveReviewerEmail,
} from "@/lib/n8nNotifyServer";
import { getN8nReviewWebhookUrl, getSupabaseServerClient } from "@/lib/env.server";
import { supabaseMisconfiguredResponse } from "@/lib/supabaseConfigError";

const ALLOWED = new Set(["pending", "approved", "rejected"]);

/** Called from the dashboard after PATCH succeeds — separate serverless invocation. */
export const maxDuration = 60;

type Body = {
  submissionId?: string;
  status?: string;
  review_notes?: string;
  reviewer_email?: string;
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
  const status = body.status?.trim().toLowerCase();

  if (!submissionId) {
    return NextResponse.json(
      { error: "submissionId is required" },
      { status: 400 }
    );
  }
  if (!status || !ALLOWED.has(status)) {
    return NextResponse.json(
      { error: "status must be pending, approved, or rejected" },
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

  const reviewNotes =
    body.review_notes?.trim() ||
    `Portal decision: ${status} (submission ${submissionId.slice(0, 8)}…)`;

  const payload = {
    id: submissionId,
    status,
    data: data as Record<string, unknown>,
    reviewerEmail: resolveReviewerEmail(body.reviewer_email),
    reviewNotes,
  };

  if (!getN8nReviewWebhookUrl()) {
    const n8n = await notifyN8nReviewDecision(payload);
    const n8nReviewNotified = n8n.skipped ? false : Boolean(n8n.notified);
    const n8nReviewSkipped = n8n.skipped;
    const n8nReviewError = n8n.error;
    const upstreamFailed = !n8n.skipped && !n8n.notified;

    return NextResponse.json(
      {
        ok: !upstreamFailed,
        n8nReviewNotified,
        n8nReviewSkipped,
        ...(n8n.skipped && n8n.skipReason
          ? { n8nReviewSkipReason: n8n.skipReason }
          : {}),
        ...(n8nReviewError ? { n8nReviewError } : {}),
      },
      { status: upstreamFailed ? 502 : 200 }
    );
  }

  console.log(
    "[n8n notify-review] webhook queued via after(); response returns immediately — see logs for POST result"
  );

  after(() => {
    void notifyN8nReviewDecision(payload)
      .then((n8n) => {
        if (n8n.skipped) {
          console.warn("[n8n notify-review] after(): skipped", n8n.skipReason);
        } else if (!n8n.notified) {
          console.error("[n8n notify-review] after(): upstream failed", n8n.error);
        } else {
          console.log("[n8n notify-review] after(): OK");
        }
      })
      .catch((err) => {
        console.error("[n8n notify-review] after(): exception", err);
      });
  });

  return NextResponse.json({
    ok: true,
    n8nReviewNotified: false,
    n8nReviewQueued: true,
    n8nReviewSkipped: false,
  });
}
