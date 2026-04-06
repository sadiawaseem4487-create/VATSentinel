import { NextResponse } from "next/server";

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

  const ok = Boolean(url && serviceRole);

  return NextResponse.json({
    ok,
    supabaseUrlConfigured: Boolean(url),
    serviceRoleConfigured: Boolean(serviceRole),
    vercel: Boolean(process.env.VERCEL),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    /** Variable names only — empty array means Vercel did not inject any SUPABASE_* keys. */
    supabaseRelatedEnvKeys,
    ...(ok
      ? {}
      : {
          checklist:
            "Vercel → your project → Settings → Environment Variables → add NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for Production → Save → Deployments → Redeploy. Names must match exactly (see supabaseRelatedEnvKeys if you mistyped).",
        }),
  });
}
