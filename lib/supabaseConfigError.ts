import { NextResponse } from "next/server";

/** 503 when `getSupabaseServerClient()` cannot run — missing env vars. */
export function supabaseMisconfiguredResponse() {
  return NextResponse.json(
    {
      error: "Server is not configured (Supabase).",
      hint:
        "Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY. " +
        "Locally: `.env.local` next to `package.json`; values from Supabase → Project Settings → API; restart `npm run dev`. " +
        "Vercel: Settings → Environment Variables → add those keys for Production (names must match exactly), then Redeploy. " +
        "Check GET /api/health — both flags should be true when configured.",
    },
    { status: 503 }
  );
}
