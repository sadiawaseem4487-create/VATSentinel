import "server-only";

import {
  getN8nReviewDefaultEmail,
  getN8nReviewWebhookUrl,
  getN8nSubmitWebhookUrl,
} from "@/lib/env.server";

export type N8nSubmitNotify = {
  skipped: boolean;
  /** Set when skipped — helps distinguish missing Vercel env vs invalid URL. */
  skipReason?: "env_unset" | "env_invalid";
  /** API route may set this when using after() — not returned from notifyN8nSubmitForRow. */
  queued?: boolean;
  ok?: boolean;
  httpStatus?: number;
  error?: "fetch_failed" | "timeout";
};

async function postSubmitWebhookWithTimeout(
  webhookUrl: string,
  webhookPayload: Record<string, unknown>,
  timeoutMs: number
): Promise<N8nSubmitNotify> {
  try {
    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "VAT-Sentinel/1.0 (notify-submit)",
      },
      body: JSON.stringify(webhookPayload),
      signal: AbortSignal.timeout(timeoutMs),
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

export async function notifyN8nSubmitForRow(
  data: Record<string, unknown>
): Promise<N8nSubmitNotify> {
  const rawSubmit =
    process.env.N8N_WEBHOOK_URL?.trim() ||
    process.env.N8N_VAT_Claim_URL?.trim();
  const webhookUrl = getN8nSubmitWebhookUrl();
  if (!webhookUrl) {
    const skipReason = !rawSubmit ? "env_unset" : "env_invalid";
    console.warn(
      "[n8n notify-submit] skipped:",
      skipReason === "env_unset"
        ? "Set N8N_WEBHOOK_URL or N8N_VAT_Claim_URL for this Vercel environment (Preview and Production are separate)."
        : "N8N webhook URL env is set but rejected (must be https:// for cloud, not a placeholder, no wrapping quotes)."
    );
    return { skipped: true, skipReason };
  }

  try {
    console.log(
      "[n8n notify-submit] POST",
      new URL(webhookUrl).hostname
    );
  } catch {
    console.log("[n8n notify-submit] POST (outbound to n8n webhook)");
  }

  const webhookPayload = {
    event: "vat_claim_submitted",
    source: "fraud-frontend",
    submissionId: data.id,
    submission_id: data.id,
    case_id: data.id,
    company_name: data.company_name,
    vat_number: data.vat_number,
    claim_type: data.claim_type,
    total_claim_amount: data.total_claim_amount,
    status: data.status,
    submission: data,
  };

  const webhookTimeoutMs = Math.min(
    Math.max(Number(process.env.N8N_WEBHOOK_TIMEOUT_MS) || 30000, 5000),
    55000
  );

  const firstTry = await postSubmitWebhookWithTimeout(
    webhookUrl,
    webhookPayload,
    webhookTimeoutMs
  );
  if (firstTry.ok) return firstTry;

  if (firstTry.error === "timeout" || firstTry.error === "fetch_failed") {
    // One retry helps when n8n/cloud network has a transient delay.
    const retryTimeoutMs = Math.min(webhookTimeoutMs + 5000, 55000);
    console.warn(
      "[n8n notify-submit] retrying once after transient failure",
      firstTry.error
    );
    return postSubmitWebhookWithTimeout(
      webhookUrl,
      webhookPayload,
      retryTimeoutMs
    );
  }

  return firstTry;
}

function resolveReviewCaseId(params: {
  id: string;
  data: Record<string, unknown>;
}): string {
  const maybeCaseId = params.data.case_id;
  if (typeof maybeCaseId === "string" && maybeCaseId.trim()) {
    return maybeCaseId.trim();
  }
  return params.id;
}

export type N8nReviewNotify = {
  skipped: boolean;
  skipReason?: "env_unset" | "env_invalid";
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
  const rawReview =
    process.env.N8N_REVIEW_WEBHOOK_URL?.trim() ||
    process.env.N8N_REVIEW_Case_WEBHOOK_URL?.trim();
  const reviewWebhookUrl = getN8nReviewWebhookUrl();
  if (!reviewWebhookUrl) {
    const skipReason = !rawReview ? "env_unset" : "env_invalid";
    console.warn(
      "[n8n notify-review] skipped:",
      skipReason === "env_unset"
        ? "Set N8N_REVIEW_WEBHOOK_URL or N8N_REVIEW_Case_WEBHOOK_URL for this Vercel environment (Preview vs Production)."
        : "N8N review webhook URL env is set but rejected (https://, not a placeholder)."
    );
    return { skipped: true, skipReason };
  }

  try {
    console.log(
      "[n8n notify-review] POST",
      new URL(reviewWebhookUrl).hostname
    );
  } catch {
    console.log("[n8n notify-review] POST (outbound to n8n webhook)");
  }

  const { id, status, data, reviewerEmail, reviewNotes } = params;
  const caseId = resolveReviewCaseId({ id, data });
  const finalOutcome =
    status === "approved"
      ? "approved"
      : status === "rejected"
        ? "rejected"
        : "pending";

  const webhookPayload = {
    event: "submission_review_decision",
    source: "fraud-frontend-evaluator",
    case_id: caseId,
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
