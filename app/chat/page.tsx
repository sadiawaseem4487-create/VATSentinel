"use client";

import { useEffect, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  meta?: {
    retrievedCount: number;
    scope: string;
    retrievalNote?: string | null;
  };
};

type Scope = "overview" | "case";

function formatRetrievalNote(note: string): string {
  const map: Record<string, string> = {
    missing_case_query: "enter a case search first",
    no_match: "no matching records",
    invalid_query: "refine your search terms",
    error: "data could not be loaded this turn",
  };
  return map[note] ?? note.replace(/_/g, " ");
}

function AssistantAvatar() {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 ring-2 ring-white shadow-sm"
      aria-hidden={true}
    >
      AI
    </div>
  );
}

/** SSR + first client paint: identical markup avoids hydration mismatches (e.g. stale RSC vs fresh client bundle). */
function ChatLoadingShell() {
  return (
    <div className="min-h-[calc(100dvh-8rem)] bg-gradient-to-b from-slate-50 via-white to-emerald-50/35 px-4 py-10 sm:px-8">
      <div
        className="mx-auto max-w-3xl space-y-6"
        aria-busy="true"
        aria-label="Loading assistant"
      >
        <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
        <div className="space-y-2 border-b border-slate-200 pb-8">
          <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-full max-w-lg animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-[min(28rem,52vh)] min-h-[12rem] animate-pulse rounded-2xl bg-slate-100 ring-1 ring-slate-200" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-50 ring-1 ring-slate-100" />
      </div>
    </div>
  );
}

function ChatPageContent() {
  const [scope, setScope] = useState<Scope>("overview");
  const [caseQuery, setCaseQuery] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [caseHint, setCaseHint] = useState<string | null>(null);
  /** null = health check pending */
  const [assistantConfigured, setAssistantConfigured] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { chatAssistantConfigured?: boolean }) => {
        if (!cancelled)
          setAssistantConfigured(Boolean(j.chatAssistantConfigured));
      })
      .catch(() => {
        if (!cancelled) setAssistantConfigured(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) return;
    if (scope === "case" && !caseQuery.trim()) {
      setCaseHint(
        "Single-case mode needs a value here: paste a submission UUID from the Evaluator, or enter part of a company name, VAT number, email, or contact name."
      );
      return;
    }
    setCaseHint(null);

    const userMessage: ChatMessage = {
      role: "user",
      text: message,
    };

    const historyPayload = messages.map((m) => ({
      role: m.role,
      content: m.text,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    const outgoing = message;
    setMessage("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: outgoing,
          scope,
          caseQuery: scope === "case" ? caseQuery.trim() : undefined,
          history: historyPayload,
        }),
      });

      const data = (await res.json()) as {
        reply?: string;
        error?: string;
        hint?: string;
        retrievedCount?: number;
        scope?: string;
        retrievalNote?: string | null;
      };

      if (!res.ok) {
        const errText =
          data.error ||
          "Something went wrong while processing your message. Please try again.";
        const fullText = data.hint ? `${errText}\n\n${data.hint}` : errText;
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: fullText,
            meta: {
              retrievedCount: 0,
              scope,
              retrievalNote: "error",
            },
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply || "No response was returned.",
          meta:
            data.retrievedCount !== undefined
              ? {
                  retrievedCount: data.retrievedCount,
                  scope: data.scope || scope,
                  retrievalNote: data.retrievalNote,
                }
              : undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "We couldn’t reach the assistant. Check your connection and try again.",
          meta: {
            retrievedCount: 0,
            scope,
            retrievalNote: "error",
          },
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100dvh-8rem)] bg-gradient-to-b from-slate-50 via-white to-emerald-50/35 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 border-b border-slate-200 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Assistant
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Screening copilot
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Replies use only submission rows retrieved for each turn. Switch
            between portfolio overview and a single case.
          </p>
        </header>

        {assistantConfigured === false ? (
          <div
            className="mb-6 rounded-xl border border-amber-200 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 shadow-sm"
            role="status"
          >
            <p className="font-semibold">Assistant needs an API key</p>
            <p className="mt-1.5 leading-relaxed text-amber-950/95">
              Add{" "}
              <code className="rounded border border-amber-300/80 bg-white/80 px-1.5 py-0.5 font-mono text-xs">
                OPENAI_API_KEY
              </code>{" "}
              (paste your{" "}
              <a
                href="https://openrouter.ai/keys"
                className="font-medium text-amber-900 underline decoration-amber-400/80 underline-offset-2 hover:text-amber-950"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenRouter
              </a>{" "}
              secret) or{" "}
              <code className="rounded border border-amber-300/80 bg-white/80 px-1.5 py-0.5 font-mono text-xs">
                OPENROUTER_API_KEY
              </code>{" "}
              in Vercel → Environment Variables for <strong>Preview</strong> and{" "}
              <strong>Production</strong>, then Redeploy. Check{" "}
              <code className="font-mono text-xs">/api/health</code> →{" "}
              <code className="font-mono text-xs">chatAssistantConfigured</code>.
            </p>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 ring-1 ring-slate-950/[0.03]">
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Retrieval scope
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setScope("overview");
                  setCaseHint(null);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  scope === "overview"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                Portfolio overview
              </button>
              <button
                type="button"
                onClick={() => {
                  setScope("case");
                  setCaseHint(null);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  scope === "case"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                Single case
              </button>
            </div>
            {scope === "case" ? (
              <div className="mt-4">
                <label
                  htmlFor="case-query"
                  className="mb-1 block text-xs font-medium text-slate-600"
                >
                  Case locator
                </label>
                <input
                  id="case-query"
                  type="text"
                  value={caseQuery}
                  onChange={(e) => {
                    setCaseQuery(e.target.value);
                    if (caseHint) setCaseHint(null);
                  }}
                  placeholder="Submission UUID, or keywords (company, VAT, email, contact)…"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/15"
                />
                {caseHint && (
                  <p className="mt-2 text-xs text-amber-800" role="alert">
                    {caseHint}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Uses total count plus the most recent submissions (capped for
                speed). Ask about status mix, amounts, or patterns in this
                sample.
              </p>
            )}
          </div>

          <div className="px-4 py-4 sm:px-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Conversation
              </h2>
            </div>
            <div className="max-h-[min(22rem,48vh)] min-h-[12rem] overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:max-h-[min(26rem,52vh)] sm:p-5">
              {messages.length === 0 && !loading && (
                <div className="rounded-lg border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    Start with a question
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Overview: “Summarize statuses in the latest sample and call
                    out anything that looks elevated risk.”
                    <br />
                    <span className="mt-1 inline-block">
                      Single case: locate the row, then “What are the claim
                      amount and period?”
                    </span>
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {messages.map((msg, index) => (
                  <div key={index}>
                    {msg.role === "user" ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                          You
                        </span>
                        <div className="max-w-[95%] rounded-2xl rounded-tr-md bg-slate-900 px-4 py-3 text-sm text-white shadow-md sm:max-w-[85%]">
                          <p className="whitespace-pre-wrap break-words leading-relaxed">
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <AssistantAvatar />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                            Assistant
                          </span>
                          <div className="mt-1 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-sm ring-1 ring-slate-950/[0.02]">
                            <p className="whitespace-pre-wrap break-words">
                              {msg.text}
                            </p>
                          </div>
                          {msg.meta && (
                            <p className="mt-2 text-[11px] text-slate-500">
                              <span className="text-slate-400">Sources:</span>{" "}
                              {msg.meta.retrievedCount} record
                              {msg.meta.retrievedCount === 1 ? "" : "s"} ·{" "}
                              {msg.meta.scope === "case"
                                ? "case lookup"
                                : "overview"}
                              {msg.meta.retrievalNote
                                ? ` · ${formatRetrievalNote(msg.meta.retrievalNote)}`
                                : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3">
                    <AssistantAvatar />
                    <div className="flex-1">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Assistant
                      </span>
                      <div className="mt-1 flex items-center gap-2 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <span className="inline-flex gap-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.3s]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.15s]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500" />
                        </span>
                        <span className="text-sm text-slate-500">
                          Retrieving context…
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6">
            <label htmlFor="chat-input" className="sr-only">
              Your message
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <textarea
                id="chat-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  scope === "overview"
                    ? "Ask about the retrieved sample…"
                    : "Ask about the matched case(s)…"
                }
                rows={2}
                className="min-h-[3.25rem] min-w-0 flex-1 resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/15"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading && assistantConfigured !== false)
                      sendMessage();
                  }
                }}
                disabled={assistantConfigured === false}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={loading || assistantConfigured === false}
                className="shrink-0 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
              >
                {loading
                  ? "Please wait…"
                  : assistantConfigured === false
                    ? "Configure API key"
                    : "Send"}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Shift+Enter for a new line. Replies are grounded in retrieved rows
              only; they are not legal or tax advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  if (!mounted) {
    return <ChatLoadingShell />;
  }

  return <ChatPageContent />;
}
