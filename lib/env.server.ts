import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";

let supabaseServer: SupabaseClient | null = null;

/**
 * Supabase client with service role — use only in API routes / server code.
 * Same code path for local (.env.local) and Vercel (project env vars).
 */
/** Server-only URL: prefer public URL, then `SUPABASE_URL` (common in Supabase snippets). */
function getSupabaseProjectUrl(): string | undefined {
  const a = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const b = process.env.SUPABASE_URL?.trim();
  return a || b;
}

function getSupabaseServiceRole(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
}

export function getSupabaseServerClient(): SupabaseClient {
  if (supabaseServer) return supabaseServer;

  const url = getSupabaseProjectUrl();
  const key = getSupabaseServiceRole();
  if (!url || !key) {
    throw new Error(
      "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (see .env.example)."
    );
  }

  supabaseServer = createClient(url, key);
  return supabaseServer;
}

/** Strip quotes and reject placeholder URLs from .env.example copy-paste mistakes. */
function cleanWebhookUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let s = raw.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  const lower = s.toLowerCase();
  if (
    lower.includes("your_instance") ||
    lower.includes("your-instance") ||
    lower.includes("example.com")
  ) {
    return undefined;
  }
  if (
    !s.startsWith("https://") &&
    !s.startsWith("http://localhost") &&
    !s.startsWith("http://127.0.0.1")
  ) {
    return undefined;
  }
  return s;
}

/**
 * Submit-chain webhook. Primary: `N8N_WEBHOOK_URL`.
 * Alias: `N8N_VAT_Claim_URL` (same value — some teams use this name in Vercel).
 */
export function getN8nSubmitWebhookUrl(): string | undefined {
  return (
    cleanWebhookUrl(process.env.N8N_WEBHOOK_URL) ||
    cleanWebhookUrl(process.env.N8N_VAT_Claim_URL)
  );
}

/**
 * Review-chain webhook. Primary: `N8N_REVIEW_WEBHOOK_URL`.
 * Alias: `N8N_REVIEW_Case_WEBHOOK_URL`.
 */
export function getN8nReviewWebhookUrl(): string | undefined {
  return (
    cleanWebhookUrl(process.env.N8N_REVIEW_WEBHOOK_URL) ||
    cleanWebhookUrl(process.env.N8N_REVIEW_Case_WEBHOOK_URL)
  );
}

export function getN8nReviewDefaultEmail(): string | undefined {
  return process.env.N8N_REVIEW_DEFAULT_EMAIL?.trim() || undefined;
}

const DEFAULT_OPENROUTER_BASE = "https://openrouter.ai/api/v1";

/**
 * OpenRouter API key: `OPENAI_API_KEY` (name kept for SDK compatibility) or alias `OPENROUTER_API_KEY`.
 */
export function getOpenRouterApiKey(): string | undefined {
  return (
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.OPENROUTER_API_KEY?.trim() ||
    undefined
  );
}

/**
 * OpenRouter-compatible client. Returns null if the key is missing (503 from /api/chat).
 */
export function getOpenRouterClient(): OpenAI | null {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) return null;
  const baseURL =
    process.env.OPENROUTER_BASE_URL?.trim() || DEFAULT_OPENROUTER_BASE;
  return new OpenAI({ apiKey, baseURL });
}
