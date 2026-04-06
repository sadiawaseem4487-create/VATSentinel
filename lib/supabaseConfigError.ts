import { NextResponse } from "next/server";

/** 503 when `getSupabaseServerClient()` cannot run — missing env vars. */
export function supabaseMisconfiguredResponse() {
  return NextResponse.json(
    {
      error: "Server is not configured (Supabase).",
      hint:
        "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. " +
        "Locally: copy `.env.example` to `.env.local` in the project root (next to `package.json`), paste values from Supabase → Project Settings → API, then restart `npm run dev`. " +
        "On Vercel: Project → Settings → Environment Variables (Production), add the same keys, then Redeploy.",
    },
    { status: 503 }
  );
}
