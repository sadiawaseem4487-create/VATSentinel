import { NextResponse } from "next/server";
import {
  getN8nReviewWebhookUrl,
  getN8nSubmitWebhookUrl,
} from "@/lib/env.server";

/**
 * No secrets. Use to verify env is visible to the server (local + Vercel).
 * GET /api/health
 *
 * `supabaseRelatedEnvKeys` lists **names only** of env vars whose names contain
 * "SUPABASE" (helps catch typos like SUPABASE_SERVICE_KEY vs …_ROLE_KEY).
 */
export async function GET() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const supabaseRelatedEnvKeys = Object.keys(process.env).filter((k) =>
    k.toUpperCase().includes("SUPABASE")
  );

  const n8nRelatedEnvKeys = Object.keys(process.env).filter((k) =>
    k.toUpperCase().includes("N8N")
  );

  const rawSubmit =
    process.env.N8N_WEBHOOK_URL?.trim() ||
    process.env.N8N_VAT_Claim_URL?.trim();
  const cleanedSubmit = getN8nSubmitWebhookUrl();
  const cleanedReview = getN8nReviewWebhookUrl();

  const ok = Boolean(url && serviceRole);

  return NextResponse.json({
    ok,
    supabaseUrlConfigured: Boolean(url),
    serviceRoleConfigured: Boolean(serviceRole),
    vercel: Boolean(process.env.VERCEL),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    /** Variable names only — empty array means Vercel did not inject any SUPABASE_* keys. */
    supabaseRelatedEnvKeys,
    n8nRelatedEnvKeys,
    n8nSubmitWebhookConfigured: Boolean(cleanedSubmit),
    n8nReviewWebhookConfigured: Boolean(cleanedReview),
    /**
     * True if N8N_WEBHOOK_URL or N8N_VAT_Claim_URL is set but was rejected
     * (placeholder, missing https://, extra quotes, etc.).
     */
    n8nSubmitWebhookUrlRejected: Boolean(rawSubmit && !cleanedSubmit),
    /**
     * Plain-language hint when submit webhook is not active. `vercelEnv` is
     * `preview` | `production` | `development` on Vercel — each needs env vars
     * enabled for that scope (Preview vs Production are separate checkboxes).
     */
    ...(!cleanedSubmit
      ? {
          n8nSubmitWebhookHint: rawSubmit
            ? "N8N_WEBHOOK_URL / N8N_VAT_Claim_URL is set but rejected — use https:// production URL from n8n (not webhook-test), no quotes or placeholders."
            : "N8N submit webhook URL is unset — set N8N_WEBHOOK_URL or N8N_VAT_Claim_URL in Vercel (Preview + Production), then Redeploy.",
        }
      : {}),
    ...(ok
      ? {}
      : {
          checklist:
            "Vercel → your project → Settings → Environment Variables → add NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for Production → Save → Deployments → Redeploy. Names must match exactly (see supabaseRelatedEnvKeys if you mistyped).",
        }),
  });
}
