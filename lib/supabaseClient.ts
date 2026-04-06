import { createClient } from "@supabase/supabase-js";

/**
 * Browser-safe Supabase (anon key). Returns null if public env vars are missing.
 * Prefer API routes + service role for sensitive operations.
 */
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key);
}
