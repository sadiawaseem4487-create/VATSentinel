import { NextResponse } from "next/server";

/**
 * No secrets. Use to verify env is visible to the server (local + Vercel).
 * GET /api/health
 */
export async function GET() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  return NextResponse.json({
    ok: Boolean(url && serviceRole),
    supabaseUrlConfigured: Boolean(url),
    serviceRoleConfigured: Boolean(serviceRole),
    vercel: Boolean(process.env.VERCEL),
    vercelEnv: process.env.VERCEL_ENV ?? null,
  });
}
