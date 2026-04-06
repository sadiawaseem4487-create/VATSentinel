import "server-only";

import {
  getN8nReviewDefaultEmail,
  getN8nReviewWebhookUrl,
  getN8nSubmitWebhookUrl,
} from "@/lib/env.server";

export type N8nSubmitNotify = {
  skipped: boolean;
  ok?: boolean;
  httpStatus?: number;
  error?: "fetch_failed" | "timeout";
};

export async function notifyN8nSubmitForRow(
  data: Record<string, unknown>
): Promise<N8nSubmitNotify> {
  const webhookUrl = getN8nSubmitWebhookUrl();
  if (!webhookUrl) {
    return { skipped: true };
  }

  const webhookPayload = {
    event: "vat_claim_submitted",
    source: "fraud-frontend",
    submissionId: data.id,
    company_name: data.company_name,
    vat_number: data.vat_number,
    claim_type: data.claim_type,
    total_claim_amount: data.total_claim_amount,
    status: data.status,
    submission: data,
  };

  const webhookTimeoutMs = Math.min(
    Math.max(Number(process.env.N8N_WEBHOOK_TIMEOUT_MS) || 8000, 3000),
    55000
  );

  try {
    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "VAT-Sentinel/1.0 (notify-submit)",
      },
      body: JSON.stringify(webhookPayload),
      signal: AbortSignal.timeout(webhookTimeoutMs),
    });
    const webhookText = await webhookRes.text();
    if (!webhookRes.ok) {
      console.error(
        "n8n submit webhook non-OK:",
        webhookRes.status,
        webhookText.slice(0, 500)
      );
      return {
        skipped: false,
        ok: false,
        httpStatus: webhookRes.status,
      };
    }
    console.log("n8n submit webhook OK:", webhookRes.status);
    return {
      skipped: false,
      ok: true,
      httpStatus: webhookRes.status,
    };
  } catch (webhookError) {
    console.error("n8n submit webhook failed:", webhookError);
    const isTimeout =
      webhookError instanceof Error &&
      (webhookError.name === "TimeoutError" ||
        webhookError.name === "AbortError");
    return {
      skipped: false,
      ok: false,
      error: isTimeout ? "timeout" : "fetch_failed",
    };
  }
}

export type N8nReviewNotify = {
  skipped: boolean;
  notified?: boolean;
  error?: string;
};

export async function notifyN8nReviewDecision(params: {
  id: string;
  status: string;
  data: Record<string, unknown>;
  reviewerEmail: string;
  reviewNotes: string;
}): Promise<N8nReviewNotify> {
  const reviewWebhookUrl = getN8nReviewWebhookUrl();
  if (!reviewWebhookUrl) {
    return { skipped: true };
  }

  const { id, status, data, reviewerEmail, reviewNotes } = params;
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

  const reviewTimeoutMs = Math.min(
    Math.max(Number(process.env.N8N_REVIEW_WEBHOOK_TIMEOUT_MS) || 15000, 3000),
    55000
  );

  try {
    const webhookRes = await fetch(reviewWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "VAT-Sentinel/1.0 (notify-review)",
      },
      body: JSON.stringify(webhookPayload),
      signal: AbortSignal.timeout(reviewTimeoutMs),
    });
    const text = await webhookRes.text();
    if (!webhookRes.ok) {
      const err = `HTTP ${webhookRes.status}: ${text.slice(0, 280)}`;
      console.error("n8n review webhook non-OK:", webhookRes.status, text.slice(0, 500));
      return { skipped: false, notified: false, error: err };
    }
    console.log("n8n review webhook OK:", webhookRes.status);
    return { skipped: false, notified: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Webhook request failed";
    console.error("n8n review webhook failed:", e);
    return { skipped: false, notified: false, error: msg };
  }
}

export function resolveReviewerEmail(explicit?: string): string {
  return (
    explicit?.trim() ||
    getN8nReviewDefaultEmail() ||
    "evaluator@portal.local"
  );
}
