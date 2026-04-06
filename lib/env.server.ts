import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";

let supabaseServer: SupabaseClient | null = null;

/**
 * Supabase client with service role — use only in API routes / server code.
 * Same code path for local (.env.local) and Vercel (project env vars).
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (supabaseServer) return supabaseServer;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example)."
    );
  }

  supabaseServer = createClient(url, key);
  return supabaseServer;
}

export function getN8nSubmitWebhookUrl(): string | undefined {
  return process.env.N8N_WEBHOOK_URL?.trim() || undefined;
}

export function getN8nReviewWebhookUrl(): string | undefined {
  return process.env.N8N_REVIEW_WEBHOOK_URL?.trim() || undefined;
}

export function getN8nReviewDefaultEmail(): string | undefined {
  return process.env.N8N_REVIEW_DEFAULT_EMAIL?.trim() || undefined;
}

const DEFAULT_OPENROUTER_BASE = "https://openrouter.ai/api/v1";

/**
 * OpenRouter-compatible client (OPENAI_API_KEY holds the OpenRouter key in this project).
 * Returns null if the key is missing so callers can return a clear 503.
 */
export function getOpenRouterClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  const baseURL =
    process.env.OPENROUTER_BASE_URL?.trim() || DEFAULT_OPENROUTER_BASE;
  return new OpenAI({ apiKey, baseURL });
}
