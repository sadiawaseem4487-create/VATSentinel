"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type SubmissionRow = Record<string, unknown> & {
  id: string;
  created_at?: string | null;
  company_name?: string | null;
  status?: string | null;
};

const POLL_MS = 30_000;

function getNumericScore(row: SubmissionRow): number | null {
  for (const key of ["score", "ai_score", "risk_score", "ai_risk_score"]) {
    const v = row[key];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

function getRiskBand(row: SubmissionRow): string | null {
  const b = row.risk_band ?? row.ai_risk_band;
  if (typeof b === "string" && b.trim()) return b.trim();
  return null;
}

function riskBucket(
  row: SubmissionRow
): "High" | "Medium" | "Low" | "Unscored" {
  const score = getNumericScore(row);
  if (score != null) {
    if (score >= 70) return "High";
    if (score >= 35) return "Medium";
    return "Low";
  }
  const band = (getRiskBand(row) || "").toUpperCase();
  if (band === "HIGH") return "High";
  if (band === "MEDIUM") return "Medium";
  if (band === "LOW") return "Low";
  return "Unscored";
}

function statusLabel(s: string | null | undefined): string {
  if (!s) return "pending";
  return s.replace(/_/g, " ");
}

function isApprovedStatus(s: string | null | undefined) {
  return (s || "").toLowerCase() === "approved";
}

function isRejectedStatus(s: string | null | undefined) {
  return (s || "").toLowerCase() === "rejected";
}

function isOpenStatus(s: string | null | undefined) {
  return !isApprovedStatus(s) && !isRejectedStatus(s);
}

function formatMoney(amount: unknown, currency: unknown) {
  if (amount == null || amount === "") return "—";
  const n = Number(amount);
  if (Number.isNaN(n)) return "—";
  const cur =
    typeof currency === "string" && currency.length === 3 ? currency : "EUR";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur,
    }).format(n);
  } catch {
    return `${n} ${cur}`;
  }
}

function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function EvaluatorDashboardPage() {
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "approved" | "rejected">(
    "all"
  );
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newAlert, setNewAlert] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [reviewNotice, setReviewNotice] = useState<{
    type: "ok" | "warn";
    text: string;
  } | null>(null);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  const fetchSubmissions = useCallback(async (mode: "initial" | "poll" | "manual") => {
    if (mode === "initial") setLoading(true);
    if (mode === "manual") setRefreshing(true);
    setFetchError(null);

    try {
      const res = await fetch("/api/submissions", { cache: "no-store" });
      const json = (await res.json()) as {
        submissions?: SubmissionRow[];
        error?: string;
      };

      if (!res.ok) {
        setFetchError(json.error || "Could not load submissions.");
        return;
      }

      const list = json.submissions ?? [];
      setRows(list);
      setLastSynced(new Date());

      if (!initialLoadDone.current) {
        list.forEach((r) => seenIdsRef.current.add(r.id));
        initialLoadDone.current = true;
      } else {
        const newcomers = list.filter((r) => !seenIdsRef.current.has(r.id));
        if (newcomers.length > 0) {
          newcomers.forEach((r) => seenIdsRef.current.add(r.id));
          const names = newcomers
            .map((r) => (r.company_name as string) || "Unknown company")
            .slice(0, 3);
          setNewAlert(
            newcomers.length === 1
              ? `New submission: ${names[0]}`
              : `${newcomers.length} new submissions: ${names.join(", ")}${newcomers.length > 3 ? "…" : ""}`
          );
        }
      }
    } catch {
      setFetchError("Network error while loading submissions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions("initial");
  }, [fetchSubmissions]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetchSubmissions("poll");
    }, POLL_MS);
    return () => clearInterval(id);
  }, [fetchSubmissions]);

  useEffect(() => {
    const onFocus = () => fetchSubmissions("poll");
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchSubmissions]);

  const updateStatus = async (id: string, newStatus: "approved" | "rejected") => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          review_notes: `Evaluator dashboard: ${newStatus}`,
        }),
      });
      const json = (await res.json()) as {
        submission?: SubmissionRow;
        error?: string;
        n8nReviewNotified?: boolean;
        n8nReviewSkipped?: boolean;
        n8nReviewError?: string;
      };
      if (!res.ok) {
        setFetchError(json.error || "Update failed.");
        setReviewNotice(null);
        return;
      }
      if (json.submission) {
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...json.submission } : r))
        );
      }
      if (json.n8nReviewNotified) {
        setReviewNotice({
          type: "ok",
          text: "Decision saved. The n8n review webhook (review-case) returned OK.",
        });
      } else if (json.n8nReviewSkipped) {
        setReviewNotice({
          type: "warn",
          text: "Decision saved in Supabase only. Set N8N_REVIEW_WEBHOOK_URL in .env.local and restart the dev server to notify n8n.",
        });
      } else if (json.n8nReviewError) {
        setReviewNotice({
          type: "warn",
          text: `Decision saved in Supabase. n8n webhook failed: ${json.n8nReviewError}`,
        });
      } else {
        setReviewNotice(null);
      }
    } catch {
      setFetchError("Network error while updating.");
      setReviewNotice(null);
    }
    setUpdatingId(null);
  };

  const filteredRows = rows.filter((row) => {
    const st = row.status as string | null | undefined;
    if (filter === "open" && !isOpenStatus(st)) return false;
    if (filter === "approved" && !isApprovedStatus(st)) return false;
    if (filter === "rejected" && !isRejectedStatus(st)) return false;

    const q = search.trim().toLowerCase();
    if (!q) return true;
    const hay = [
      row.id,
      row.company_name,
      row.vat_number,
      row.country,
      row.contact_person,
      row.contact_email,
      row.claim_type,
      row.status,
    ]
      .map((x) => String(x ?? "").toLowerCase())
      .join(" ");
    return hay.includes(q);
  });

  const stats = useMemo(() => {
    const total = rows.length;
    const open = rows.filter((r) => isOpenStatus(r.status as string)).length;
    const approved = rows.filter((r) => isApprovedStatus(r.status as string)).length;
    const rejected = rows.filter((r) => isRejectedStatus(r.status as string)).length;
    const highRisk = rows.filter((r) => riskBucket(r) === "High").length;
    return { total, open, approved, rejected, highRisk };
  }, [rows]);

  const riskData = useMemo(
    () => [
      { name: "High", value: rows.filter((r) => riskBucket(r) === "High").length },
      {
        name: "Medium",
        value: rows.filter((r) => riskBucket(r) === "Medium").length,
      },
      { name: "Low", value: rows.filter((r) => riskBucket(r) === "Low").length },
      {
        name: "Unscored",
        value: rows.filter((r) => riskBucket(r) === "Unscored").length,
      },
    ],
    [rows]
  );

  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const key = statusLabel(r.status as string);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [rows]);

  const countryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const c = String(r.country || "Unknown").trim() || "Unknown";
      map.set(c, (map.get(c) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [rows]);

  const getScoreClass = (row: SubmissionRow) => {
    const b = riskBucket(row);
    if (b === "High") return "bg-red-100 text-red-900 ring-red-200";
    if (b === "Medium") return "bg-amber-100 text-amber-950 ring-amber-200";
    if (b === "Low") return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    return "bg-slate-100 text-slate-600 ring-slate-200";
  };

  const getStatusClass = (status: string | null | undefined) => {
    if (isApprovedStatus(status))
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    if (isRejectedStatus(status)) return "bg-red-100 text-red-900 ring-red-200";
    return "bg-slate-100 text-slate-800 ring-slate-200";
  };

  const chartColors = ["#059669", "#d97706", "#dc2626", "#94a3b8"];
  const statusColors = [
    "#0d9488",
    "#64748b",
    "#ca8a04",
    "#16a34a",
    "#dc2626",
    "#7c3aed",
  ];

  return (
    <div className="min-h-[calc(100dvh-8rem)] bg-gradient-to-b from-slate-50 via-white to-emerald-50/35 p-6 sm:p-10">
      <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-200/40 ring-1 ring-slate-950/[0.04] sm:p-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Evaluate
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Workspace
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Live queue from{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">
                submissions
              </code>
              . Refreshes on load, every {POLL_MS / 1000}s while this tab is
              visible, or when you choose Refresh.
            </p>
            {lastSynced && (
              <p className="mt-2 text-xs text-slate-500">
                Last synced: {lastSynced.toLocaleTimeString()}
                {refreshing ? " · Updating…" : ""}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={loading || refreshing}
              onClick={() => {
                setNewAlert(null);
                fetchSubmissions("manual");
              }}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <Link
              href="/submit"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              New VAT claim
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center justify-center rounded-xl border-2 border-slate-900 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Assistant
            </Link>
          </div>
        </div>

        {newAlert && (
          <div
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
            role="status"
          >
            <span className="font-medium">{newAlert}</span>
            <button
              type="button"
              onClick={() => setNewAlert(null)}
              className="rounded-lg bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200 hover:bg-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {fetchError && (
          <div
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            {fetchError}
          </div>
        )}

        {reviewNotice && (
          <div
            className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
              reviewNotice.type === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                : "border-amber-200 bg-amber-50 text-amber-950"
            }`}
            role="status"
          >
            <span>{reviewNotice.text}</span>
            <button
              type="button"
              onClick={() => setReviewNotice(null)}
              className="rounded-lg bg-white/80 px-3 py-1 text-xs font-semibold ring-1 ring-black/10 hover:bg-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <p className="py-16 text-center text-slate-600">Loading submissions…</p>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Total claims
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats.total}
                </p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
                  Open / in review
                </p>
                <p className="mt-2 text-3xl font-bold text-amber-950">
                  {stats.open}
                </p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50/80 p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-red-800">
                  High risk (AI)
                </p>
                <p className="mt-2 text-3xl font-bold text-red-900">
                  {stats.highRisk}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                  Approved
                </p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">
                  {stats.approved}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                  Rejected
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats.rejected}
                </p>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-slate-900">
                  Risk (score or band)
                </h2>
                <div className="h-72 min-h-[18rem] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minHeight={288}>
                    <BarChart data={riskData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {riskData.map((_, i) => (
                          <Cell key={i} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-slate-900">
                  Status mix
                </h2>
                <div className="h-72 min-h-[18rem] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minHeight={288}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={88}
                        label={({ name, percent }) =>
                          `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {statusData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={statusColors[index % statusColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-slate-900">
                  Top countries
                </h2>
                <div className="h-72 min-h-[18rem] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minHeight={288}>
                    <BarChart data={countryData} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" allowDecimals={false} stroke="#64748b" />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        stroke="#64748b"
                        fontSize={11}
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0d9488" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="dash-search"
                className="mb-2 block text-sm font-medium text-slate-800"
              >
                Search
              </label>
              <input
                id="dash-search"
                type="search"
                placeholder="Company, VAT, country, contact, claim type, status, or ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-xl rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  ["open", "Open"],
                  ["approved", "Approved"],
                  ["rejected", "Rejected"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    filter === key
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <p className="mb-4 text-sm text-slate-600">
              Showing {filteredRows.length} of {rows.length} submission(s)
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Claim</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">AI risk</th>
                    <th className="px-4 py-3">Workflow status</th>
                    <th className="px-4 py-3">Ref</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRows.map((row) => {
                    const id = row.id;
                    const score = getNumericScore(row);
                    const band = getRiskBand(row);
                    const open = expandedId === id;
                    return (
                      <Fragment key={id}>
                        <tr className="text-slate-800 transition hover:bg-slate-50/80">
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                            {formatWhen(row.created_at as string)}
                          </td>
                          <td className="max-w-[200px] px-4 py-3">
                            <div className="font-semibold text-slate-900">
                              {(row.company_name as string) || "—"}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500">
                              {[row.vat_number, row.country]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </div>
                          </td>
                          <td className="max-w-[180px] px-4 py-3 text-xs leading-relaxed">
                            <div>{(row.contact_person as string) || "—"}</div>
                            <div className="text-slate-500">
                              {(row.contact_email as string) || ""}
                            </div>
                          </td>
                          <td className="max-w-[160px] px-4 py-3 text-xs">
                            {(row.claim_type as string) || "—"}
                            {row.invoice_count != null && row.invoice_count !== "" ? (
                              <div className="text-slate-500">
                                {String(row.invoice_count)} invoices
                              </div>
                            ) : null}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums">
                            {formatMoney(row.total_claim_amount, row.currency)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex flex-col gap-0.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${getScoreClass(row)}`}
                            >
                              {score != null ? (
                                <span>Score {Math.round(score)}</span>
                              ) : (
                                <span>No score</span>
                              )}
                              {band ? (
                                <span className="font-normal opacity-90">
                                  {band}
                                </span>
                              ) : null}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${getStatusClass(row.status as string)}`}
                            >
                              {statusLabel(row.status as string)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              title={id}
                              onClick={() =>
                                setExpandedId((x) => (x === id ? null : id))
                              }
                              className="font-mono text-xs text-emerald-800 underline-offset-2 hover:underline"
                            >
                              {id.slice(0, 8)}…
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => updateStatus(id, "approved")}
                              disabled={updatingId === id}
                              className="mr-2 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStatus(id, "rejected")}
                              disabled={updatingId === id}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                        {open && (
                          <tr className="bg-slate-50/90">
                            <td colSpan={9} className="px-4 py-4 text-xs text-slate-700">
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    Submission ID
                                  </p>
                                  <p className="mt-1 break-all font-mono">{id}</p>
                                  <button
                                    type="button"
                                    className="mt-2 text-emerald-800 hover:underline"
                                    onClick={() =>
                                      navigator.clipboard?.writeText(id)
                                    }
                                  >
                                    Copy ID
                                  </button>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    Address
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap">
                                    {(row.address as string) || "—"}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    Period
                                  </p>
                                  <p className="mt-1">
                                    {[row.claim_period_start, row.claim_period_end]
                                      .filter(Boolean)
                                      .join(" → ") || "—"}
                                  </p>
                                </div>
                                <div className="sm:col-span-2 lg:col-span-3">
                                  <p className="font-semibold text-slate-900">
                                    Claim description
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap text-slate-600">
                                    {(row.claim_description as string) || "—"}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        No submissions match this filter or search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
