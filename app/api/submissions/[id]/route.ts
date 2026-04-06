import { NextResponse } from "next/server";
import {
  getN8nReviewDefaultEmail,
  getN8nReviewWebhookUrl,
  getSupabaseServerClient,
} from "@/lib/env.server";
import { supabaseMisconfiguredResponse } from "@/lib/supabaseConfigError";

const ALLOWED = new Set(["pending", "approved", "rejected"]);

type PatchBody = {
  status?: string;
  /** Shown in n8n / audit trail */
  review_notes?: string;
  /** Defaults to N8N_REVIEW_DEFAULT_EMAIL or a placeholder */
  reviewer_email?: string;
};

/**
 * Direct database updates for evaluator decisions happen here (Supabase `submissions` table).
 * Optional n8n second chain: set N8N_REVIEW_WEBHOOK_URL (e.g. …/webhook/review-case).
 * Align n8n "Fetch Case" filter with your key: often `submission_id` = submission UUID.
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

    const reviewWebhookUrl = getN8nReviewWebhookUrl();
    let n8nReviewNotified = false;
    let n8nReviewError: string | undefined;
    const n8nReviewSkipped = !reviewWebhookUrl;

    if (reviewWebhookUrl) {
      const reviewerEmail =
        body.reviewer_email?.trim() ||
        getN8nReviewDefaultEmail() ||
        "evaluator@portal.local";

      const reviewNotes =
        body.review_notes?.trim() ||
        `Portal decision: ${status} (submission ${id.slice(0, 8)}…)`;

      const finalOutcome =
        status === "approved"
          ? "approved"
          : status === "rejected"
            ? "rejected"
            : "pending";

      const webhookPayload = {
        event: "submission_review_decision",
        source: "fraud-frontend-evaluator",
        case_id: id,
        submission_id: id,
        submissionId: id,
        new_status: status,
        reviewer_email: reviewerEmail,
        review_notes: reviewNotes,
        final_outcome: finalOutcome,
        actor_type: "human_reviewer",
        submission: data,
      };

      try {
        const webhookRes = await fetch(reviewWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });
        const text = await webhookRes.text();
        if (!webhookRes.ok) {
          n8nReviewError = `HTTP ${webhookRes.status}: ${text.slice(0, 280)}`;
          console.error(
            "n8n review webhook non-OK:",
            webhookRes.status,
            text.slice(0, 500)
          );
        } else {
          n8nReviewNotified = true;
          console.log("n8n review webhook OK:", webhookRes.status);
        }
      } catch (e) {
        n8nReviewError =
          e instanceof Error ? e.message : "Webhook request failed";
        console.error("n8n review webhook failed:", e);
      }
    } else {
      console.warn(
        "N8N_REVIEW_WEBHOOK_URL is not set; submission updated in Supabase only."
      );
    }

    return NextResponse.json({
      submission: data,
      n8nReviewNotified,
      n8nReviewSkipped,
      ...(n8nReviewError ? { n8nReviewError } : {}),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}
