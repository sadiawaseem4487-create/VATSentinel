import type { SupabaseClient } from "@supabase/supabase-js";

export type RagScope = "overview" | "case";

export type RagResult = {
  contextText: string;
  retrievedCount: number;
  scope: RagScope;
  retrievalNote?: string;
  /** When set, the API should return this to the user and skip the LLM (no raw DB errors in chat). */
  useCannedReply?: boolean;
  cannedReply?: string;
};

/** Use * so schemas without optional AI columns (e.g. score) still work. */
const SUBMISSIONS_SELECT = "*";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function looksLikeUuid(s: string): boolean {
  return UUID_RE.test(s.trim());
}

function truncate(v: unknown, max: number): string {
  if (v == null || v === "") return "";
  const t = String(v);
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function maskIban(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const s = v.replace(/\s/g, "");
  if (s.length < 6) return "[on file]";
  return `…${s.slice(-4)}`;
}

function numericScore(row: Record<string, unknown>): number | null {
  for (const k of ["score", "ai_score", "risk_score"]) {
    const v = row[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

function band(row: Record<string, unknown>): string | null {
  const b = row.risk_band ?? row.ai_risk_band;
  return typeof b === "string" && b.trim() ? b.trim() : null;
}

/** Shape one row for the LLM — keeps bank identifiers masked in overview; fuller in single-case still masks IBAN. */
function rowForLlm(
  row: Record<string, unknown>,
  mode: "overview" | "detail"
): Record<string, unknown> {
  const base = {
    id: row.id,
    created_at: row.created_at,
    company_name: row.company_name,
    registration_number: row.registration_number,
    vat_number: row.vat_number,
    country: row.country,
    address: truncate(row.address, mode === "overview" ? 200 : 500),
    contact_person: row.contact_person,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    claim_period_start: row.claim_period_start,
    claim_period_end: row.claim_period_end,
    claim_type: row.claim_type,
    total_claim_amount: row.total_claim_amount,
    currency: row.currency,
    invoice_count: row.invoice_count,
    claim_description: truncate(row.claim_description, mode === "overview" ? 320 : 1200),
    bank_name: row.bank_name,
    account_holder_name: row.account_holder_name,
    iban_hint: maskIban(row.iban),
    swift_code: row.swift_code,
    invoice_references: truncate(row.invoice_references, 240),
    transaction_references: truncate(row.transaction_references, 240),
    additional_notes: truncate(row.additional_notes, mode === "overview" ? 200 : 500),
    declaration_accepted: row.declaration_accepted,
    status: row.status,
    risk_score: numericScore(row),
    risk_band: band(row),
  };
  return base;
}

function compactContext(rows: Record<string, unknown>[], maxChars: number): string {
  const payload = JSON.stringify(rows, null, 2);
  if (payload.length <= maxChars) return payload;
  const trimmed = rows.slice(0, Math.max(1, Math.floor(rows.length / 2)));
  return `${JSON.stringify(trimmed, null, 2)}\n\n[…truncated for size; ask a narrower question or use single-case search.]`;
}

function getAggregateMaxRows(): number {
  const n = Number(process.env.CHAT_AGGREGATE_MAX_ROWS);
  if (Number.isFinite(n) && n > 0) return Math.min(Math.floor(n), 500_000);
  return 100_000;
}

function getOverviewSampleLimit(): number {
  const n = Number(process.env.CHAT_OVERVIEW_SAMPLE_SIZE);
  if (Number.isFinite(n) && n >= 10 && n <= 200) return Math.floor(n);
  return 75;
}

async function getCreatedAtBounds(
  supabase: SupabaseClient
): Promise<{ oldest: string | null; newest: string | null }> {
  const { data: minRow } = await supabase
    .from("submissions")
    .select("created_at")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const { data: maxRow } = await supabase
    .from("submissions")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return {
    oldest:
      typeof minRow?.created_at === "string" ? minRow.created_at : null,
    newest:
      typeof maxRow?.created_at === "string" ? maxRow.created_at : null,
  };
}

type ScanAggregates = {
  histogram: Record<string, number>;
  sumByCurrency: Record<string, number>;
  rowsScanned: number;
  scanTruncated: boolean;
  error?: string;
};

/**
 * Paginated scan of `submissions` for status histogram and sum of claim amounts
 * across the whole table (bounded by CHAT_AGGREGATE_MAX_ROWS).
 */
async function scanSubmissionsForAggregates(
  supabase: SupabaseClient
): Promise<ScanAggregates> {
  const maxRows = getAggregateMaxRows();
  const pageSize = 1000;
  let from = 0;
  const histogram: Record<string, number> = {};
  const sumByCurrency: Record<string, number> = {};
  let scanTruncated = false;

  while (from < maxRows) {
    const { data, error } = await supabase
      .from("submissions")
      .select("id, status, total_claim_amount, currency")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      return {
        histogram,
        sumByCurrency,
        rowsScanned: from,
        scanTruncated: false,
        error: error.message,
      };
    }
    if (!data?.length) break;

    for (const row of data) {
      const st = String(row.status ?? "unknown");
      histogram[st] = (histogram[st] || 0) + 1;
      const amt = row.total_claim_amount;
      if (typeof amt === "number" && !Number.isNaN(amt)) {
        const cur = String(row.currency ?? "EUR").trim() || "EUR";
        sumByCurrency[cur] = (sumByCurrency[cur] || 0) + amt;
      }
    }

    from += data.length;
    if (data.length < pageSize) break;
    if (from >= maxRows) {
      scanTruncated = true;
      break;
    }
  }

  return { histogram, sumByCurrency, rowsScanned: from, scanTruncated };
}

export async function retrieveRagContext(
  supabase: SupabaseClient,
  scope: RagScope,
  caseQuery: string | undefined
): Promise<RagResult> {
  if (scope === "case") {
    const q = (caseQuery || "").trim();
    if (!q) {
      return {
        contextText:
          "No case search term was provided. The user must enter a submission UUID or keywords (company, VAT, email, contact name) in the case search field.",
        retrievedCount: 0,
        scope: "case",
        retrievalNote: "missing_case_query",
      };
    }

    if (looksLikeUuid(q)) {
      const { data, error } = await supabase
        .from("submissions")
        .select(SUBMISSIONS_SELECT)
        .eq("id", q.trim())
        .maybeSingle();

      if (error) {
        console.error("[chatRag] case by id:", error.message);
        return {
          contextText: "",
          retrievedCount: 0,
          scope: "case",
          retrievalNote: "error",
          useCannedReply: true,
          cannedReply:
            "We couldn’t load that submission right now. Please try again in a moment. If it keeps happening, open the Evaluator to confirm the ID, or check that the app can reach your database.",
        };
      }
      if (!data) {
        return {
          contextText: `No submission found with id exactly matching: ${q}`,
          retrievedCount: 0,
          scope: "case",
          retrievalNote: "no_match",
        };
      }
      const shaped = rowForLlm(data as Record<string, unknown>, "detail");
      return {
        contextText: `SINGLE SUBMISSION (answer using only this record):\n${JSON.stringify(shaped, null, 2)}`,
        retrievedCount: 1,
        scope: "case",
      };
    }

    const safe = q
      .replace(/[%_,]/g, " ")
      .replace(/["']/g, "")
      .trim()
      .slice(0, 80);
    if (!safe) {
      return {
        contextText:
          "Case search contained only invalid characters. Ask the user to enter letters, numbers, or a submission UUID.",
        retrievedCount: 0,
        scope: "case",
        retrievalNote: "invalid_query",
      };
    }

    const pattern = `%${safe}%`;
    const { data, error } = await supabase
      .from("submissions")
      .select(SUBMISSIONS_SELECT)
      .or(
        `company_name.ilike.${pattern},vat_number.ilike.${pattern},contact_email.ilike.${pattern},contact_person.ilike.${pattern}`
      )
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      console.error("[chatRag] case search:", error.message);
      return {
        contextText: "",
        retrievedCount: 0,
        scope: "case",
        retrievalNote: "error",
        useCannedReply: true,
        cannedReply:
          "We couldn’t search submissions right now. Please try again shortly. You can also look up the case directly in the Evaluator.",
      };
    }

    const list = (data || []) as Record<string, unknown>[];
    if (list.length === 0) {
      return {
        contextText: `No submissions matched keyword search for: "${safe}". Suggest trying another keyword or pasting the full submission UUID from the Evaluator.`,
        retrievedCount: 0,
        scope: "case",
        retrievalNote: "no_match",
      };
    }

    const shaped = list.map((r) => rowForLlm(r, "detail"));
    return {
      contextText: `MATCHED SUBMISSIONS (${list.length} — compare using only these records):\n${compactContext(shaped, 28_000)}`,
      retrievedCount: list.length,
      scope: "case",
    };
  }

  const { count, error: countErr } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true });

  if (countErr) {
    console.error("[chatRag] overview count:", countErr.message);
    return {
      contextText: "",
      retrievedCount: 0,
      scope: "overview",
      retrievalNote: "error",
      useCannedReply: true,
      cannedReply:
        "We couldn’t load the submissions overview. Please try again in a moment. If this continues, verify database access from this environment.",
    };
  }

  const totalInDb = count ?? 0;
  const sampleLimit = getOverviewSampleLimit();

  const [bounds, scan, recentRes] = await Promise.all([
    getCreatedAtBounds(supabase),
    scanSubmissionsForAggregates(supabase),
    supabase
      .from("submissions")
      .select(SUBMISSIONS_SELECT)
      .order("created_at", { ascending: false })
      .limit(sampleLimit),
  ]);

  if (recentRes.error) {
    console.error("[chatRag] overview list:", recentRes.error.message);
    return {
      contextText: "",
      retrievedCount: 0,
      scope: "overview",
      retrievalNote: "error",
      useCannedReply: true,
      cannedReply:
        "We couldn’t load the latest submissions for analysis. Please try again shortly, or use the Evaluator to browse claims while we retry.",
    };
  }

  const rows = (recentRes.data || []) as Record<string, unknown>[];

  const statusHistogramSample: Record<string, number> = {};
  for (const r of rows) {
    const s = String(r.status ?? "unknown");
    statusHistogramSample[s] = (statusHistogramSample[s] || 0) + 1;
  }

  const highRiskInSample = rows.filter((r) => {
    const sc = numericScore(r);
    const b = (band(r) || "").toUpperCase();
    if (sc != null && sc >= 70) return true;
    if (b === "HIGH") return true;
    return false;
  }).length;

  const aggregatesComplete =
    !scan.scanTruncated &&
    !scan.error &&
    scan.rowsScanned === totalInDb;

  const fullDatabaseAggregates = {
    total_submissions_in_database: totalInDb,
    submission_created_at_range: {
      oldest: bounds.oldest,
      newest: bounds.newest,
    },
    status_counts:
      scan.error != null ? { _error: scan.error } : scan.histogram,
    aggregates_coverage:
      scan.error != null
        ? "Aggregates unavailable (scan failed); use sample below and total count only."
        : aggregatesComplete
          ? "Status counts and sums below are over ALL rows in the database."
          : `Partial scan only: ${scan.rowsScanned} rows read (limit CHAT_AGGREGATE_MAX_ROWS=${getAggregateMaxRows()}). Counts and sums apply to scanned rows only; total_submissions_in_database is still exact.`,
    sum_total_claim_amount_by_currency:
      scan.error != null ? {} : scan.sumByCurrency,
    rows_scanned_for_aggregates: scan.rowsScanned,
    scan_truncated: scan.scanTruncated,
  };

  const recentSampleBlock = {
    sample_size: rows.length,
    sample_note: `Only the ${rows.length} most recent submissions (by created_at) are listed below for detail. Portfolio-wide figures are in FULL_DATABASE_AGGREGATES. Do not say there are only ${rows.length} companies if total_submissions_in_database is higher.`,
    status_histogram_in_this_sample_only: statusHistogramSample,
    high_risk_count_in_this_sample_only: highRiskInSample,
    risk_columns_note:
      "Risk scores and bands appear only when present on each row.",
  };

  const shaped = rows.map((r) => rowForLlm(r, "overview"));
  const body = compactContext(shaped, 26_000);

  const contextText = `DATABASE OVERVIEW — ground answers ONLY in this JSON.

SECTION A — FULL_DATABASE_AGGREGATES (use for portfolio totals, status mix, and sum of claim amounts):
${JSON.stringify(fullDatabaseAggregates, null, 2)}

SECTION B — RECENT_SAMPLE_FOR_DETAIL (examples and narrative; NOT an exhaustive list of all companies):
${JSON.stringify(recentSampleBlock, null, 2)}

RECENT_SUBMISSIONS_SAMPLE_ROWS:
${body}`;

  return {
    contextText,
    retrievedCount: rows.length,
    scope: "overview",
  };
}
