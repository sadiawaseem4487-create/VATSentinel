"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { generateRandomVatSample } from "@/lib/randomVatSample";

const emptyForm = () => ({
  company_name: "",
  registration_number: "",
  vat_number: "",
  country: "",
  address: "",
  contact_person: "",
  contact_email: "",
  contact_phone: "",
  claim_period_start: "",
  claim_period_end: "",
  claim_type: "",
  total_claim_amount: "",
  currency: "EUR",
  invoice_count: "",
  claim_description: "",
  bank_name: "",
  account_holder_name: "",
  iban: "",
  swift_code: "",
  invoice_references: "",
  transaction_references: "",
  additional_notes: "",
  declaration_accepted: false,
});

type FormState = ReturnType<typeof emptyForm>;

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/15 disabled:opacity-60";
const labelClass = "block text-sm font-medium text-slate-700";
const sectionShell =
  "scroll-mt-28 rounded-2xl border border-slate-200/90 bg-slate-50/40 p-6 shadow-sm ring-1 ring-slate-950/[0.03] sm:p-8";

const STEPS = [
  { id: "sec-company", n: 1, short: "Company", title: "Company details" },
  { id: "sec-contact", n: 2, short: "Contact", title: "Contact person" },
  { id: "sec-claim", n: 3, short: "Claim", title: "Claim details" },
  { id: "sec-bank", n: 4, short: "Bank", title: "Bank details" },
  { id: "sec-support", n: 5, short: "Supporting", title: "Supporting information" },
  { id: "sec-declaration", n: 6, short: "Declaration", title: "Declaration" },
] as const;

type SectionId = (typeof STEPS)[number]["id"];

const navInactive =
  "group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900";
const navActive =
  "flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-2 text-sm font-medium text-slate-900 ring-1 ring-slate-200/80";
const badgeInactive =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-200/80 text-xs font-bold text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-900";
const badgeActive =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-xs font-bold text-emerald-900";
const pillInactive =
  "rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900";
const pillActive =
  "rounded-full border border-emerald-400 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-950 ring-1 ring-emerald-200/60";

function SectionHeader({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6 flex gap-4 border-b border-slate-200/80 pb-5">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-md shadow-emerald-900/10"
        aria-hidden
      >
        {step}
      </div>
      <div className="min-w-0 pt-0.5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function SubmitPage() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{
    type: "success" | "error" | "validation";
    message: string;
    submissionId?: string;
  } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [activeSectionId, setActiveSectionId] = useState<SectionId>(
    STEPS[0].id
  );

  useEffect(() => {
    const ids = STEPS.map((s) => s.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
        const first = visible[0];
        if (first?.target.id && ids.includes(first.target.id as SectionId)) {
          setActiveSectionId(first.target.id as SectionId);
        }
      },
      {
        root: null,
        rootMargin: "-32% 0px -48% 0px",
        threshold: [0, 0.05, 0.1, 0.2],
      }
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("demo") === "1" || q.get("prefill") === "1") {
      queueMicrotask(() => {
        setForm(generateRandomVatSample() as FormState);
        setBanner({
          type: "validation",
          message:
            "Loaded random Finland-only sample from URL (?demo=1). All data is fictional; submit to test the pipeline.",
        });
        setFieldErrors({});
      });
    }
  }, []);

  const applySampleData = () => {
    setForm(generateRandomVatSample() as FormState);
    setFieldErrors({});
    setBanner({
      type: "validation",
      message:
        "Random Finland-only test data filled in (fictional). Click again for a new scenario.",
    });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const target = e.target as HTMLInputElement;
    const value =
      target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = useCallback((f: FormState) => {
    const err: Record<string, string> = {};
    if (!f.company_name.trim()) err.company_name = "Company name is required.";
    if (!f.contact_person.trim())
      err.contact_person = "Contact person is required.";
    if (!f.contact_email.trim()) {
      err.contact_email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contact_email.trim())) {
      err.contact_email = "Enter a valid email address.";
    }
    if (!f.declaration_accepted) {
      err.declaration_accepted = "You must confirm the declaration.";
    }
    if (f.claim_period_start && f.claim_period_end) {
      const a = new Date(f.claim_period_start).getTime();
      const b = new Date(f.claim_period_end).getTime();
      if (a > b)
        err.claim_period_end = "Claim period end must be on or after the start date.";
    }
    if (f.total_claim_amount !== "") {
      const n = Number(f.total_claim_amount);
      if (Number.isNaN(n) || n < 0)
        err.total_claim_amount = "Enter a valid non-negative amount.";
    }
    if (f.invoice_count !== "") {
      const n = Number(f.invoice_count);
      if (Number.isNaN(n) || !Number.isInteger(n) || n < 0)
        err.invoice_count = "Invoice count must be a whole number ≥ 0.";
    }
    return err;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    const err = validate(form);
    setFieldErrors(err);
    if (Object.keys(err).length > 0) {
      const keys = Object.keys(err);
      const firstId = keys[0];
      setBanner({
        type: "validation",
        message:
          "Some required fields are missing or invalid. Scroll to the red messages below — contact name, email, and the declaration checkbox are required.",
      });
      requestAnimationFrame(() => {
        const el = firstId
          ? document.getElementById(firstId)
          : formRef.current?.querySelector("[aria-invalid=true]");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        if (el instanceof HTMLElement) el.focus?.();
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          total_claim_amount: form.total_claim_amount
            ? Number(form.total_claim_amount)
            : null,
          invoice_count: form.invoice_count
            ? Number(form.invoice_count)
            : null,
        }),
      });

      let data: {
        error?: string;
        hint?: string;
        id?: string;
        ok?: boolean;
      } = {};
      try {
        data = await res.json();
      } catch {
        setBanner({
          type: "error",
          message: "Invalid response from server. Please try again.",
        });
        setLoading(false);
        return;
      }

      if (res.ok && data.id) {
        type N8nShape = {
          skipped?: boolean;
          skipReason?: "env_unset" | "env_invalid";
          ok?: boolean;
          httpStatus?: number;
          error?: string;
        };
        let n8n: N8nShape | undefined;
        try {
          const n8nRes = await fetch("/api/n8n/notify-submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ submissionId: data.id }),
          });
          const n8nJson = (await n8nRes.json().catch(() => ({}))) as {
            n8n?: N8nShape;
            error?: string;
          };
          if (n8nJson.n8n) {
            n8n = n8nJson.n8n;
          } else if (!n8nRes.ok) {
            n8n = {
              skipped: false,
              ok: false,
              httpStatus: n8nRes.status,
            };
          }
        } catch {
          n8n = { skipped: false, ok: false, error: "fetch_failed" };
        }

        let extra = "";
        if (n8n?.skipped) {
          extra =
            n8n.skipReason === "env_invalid"
              ? " n8n was not called: webhook URL env is invalid (use https:// production URL, no quotes)."
              : " n8n was not called: set N8N_WEBHOOK_URL or N8N_VAT_Claim_URL under Preview and Production in Vercel.";
        } else if (n8n?.ok === false) {
          const reason =
            n8n.error === "timeout"
              ? "timeout (workflow may be slow; on Vercel Hobby ~10s limit — use “Respond immediately” in n8n or shorten the chain)"
              : n8n.error === "fetch_failed"
                ? "network"
                : "HTTP error";
          extra = ` n8n webhook failed (${n8n.httpStatus ?? "?"}, ${reason}). Check URL, workflow Active, and env.`;
        }
        setBanner({
          type: "success",
          message:
            "Claim saved." +
            (extra
              ? extra
              : " VAT sentinel workflow (n8n) was notified."),
          submissionId: data.id,
        });
        setForm(emptyForm());
        setFieldErrors({});
      } else {
        const msg = [data.error || "Submission failed.", data.hint]
          .filter(Boolean)
          .join(" ");
        setBanner({
          type: "error",
          message: msg,
        });
      }
    } catch {
      setBanner({
        type: "error",
        message: "Network error. Check your connection and try again.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100dvh-8rem)] bg-gradient-to-b from-slate-50 via-white to-emerald-50/40">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
        <header className="mb-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Submit
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            VAT reclaim intake
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Data is stored and forwarded to your configured{" "}
            <strong className="font-semibold text-slate-800">VAT Sentinel</strong>{" "}
            webhook for automated screening and audit logging, using your existing
            automation contract.
          </p>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
            <span className="font-medium text-slate-800">Required to submit:</span>{" "}
            company name, contact person, contact email, and the declaration at
            the end.
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={applySampleData}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg border border-amber-300 bg-amber-50/90 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-sm transition hover:bg-amber-100 disabled:opacity-50"
            >
              Fill sample data (testing)
            </button>
            <p className="text-xs text-slate-500 sm:max-w-md">
              Or open{" "}
              <code className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-slate-800">
                /submit?demo=1
              </code>{" "}
              to auto-fill on load. Sample data is fictional (Finland-style).
            </p>
          </div>
        </header>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-200/50 ring-1 ring-slate-950/[0.04] sm:p-8 lg:p-10">
          {banner && (
            <div
              role="alert"
              className={`mb-8 rounded-xl border px-4 py-3 text-sm ${
                banner.type === "success"
                  ? "border-emerald-200 bg-emerald-50/90 text-emerald-950"
                  : banner.type === "validation"
                    ? "border-amber-200 bg-amber-50/90 text-amber-950"
                    : "border-red-200 bg-red-50/90 text-red-950"
              }`}
            >
              <p>{banner.message}</p>
              {banner.submissionId && (
                <p className="mt-2 font-mono text-xs text-slate-700">
                  Submission ID: {banner.submissionId}
                </p>
              )}
            </div>
          )}

          <div className="mb-8 lg:hidden">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Jump to section
            </p>
            <div className="flex flex-wrap gap-2">
              {STEPS.map((s) => {
                const on = activeSectionId === s.id;
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    aria-current={on ? "location" : undefined}
                    className={on ? pillActive : pillInactive}
                  >
                    {s.n}. {s.short}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-[11.5rem_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[13rem_minmax(0,1fr)]">
            <aside className="mb-10 hidden lg:block">
              <div className="sticky top-28">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Sections
                </p>
                <nav aria-label="Form sections" className="space-y-0.5">
                  {STEPS.map((s) => {
                    const on = activeSectionId === s.id;
                    return (
                      <a
                        key={s.id}
                        href={`#${s.id}`}
                        aria-current={on ? "location" : undefined}
                        className={on ? navActive : navInactive}
                      >
                        <span className={on ? badgeActive : badgeInactive}>
                          {s.n}
                        </span>
                        <span className="leading-tight">{s.short}</span>
                      </a>
                    );
                  })}
                </nav>
              </div>
            </aside>

            <form
              id="vat-claim-form"
              ref={formRef}
              onSubmit={handleSubmit}
              className="min-w-0 pb-28"
              noValidate
              aria-busy={loading}
            >
              <fieldset disabled={loading} className="m-0 min-w-0 border-0 p-0">
                <legend className="sr-only">VAT claim details</legend>

                <div id="sec-company" className={sectionShell}>
                  <SectionHeader
                    step={1}
                    title="Company details"
                    description="Legal entity and registered address for this reclaim."
                  />
                  <div className="space-y-1">
                    <label htmlFor="company_name" className={labelClass}>
                      Company name <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="company_name"
                      name="company_name"
                      value={form.company_name}
                      onChange={handleChange}
                      className={inputClass}
                      aria-invalid={!!fieldErrors.company_name}
                      aria-describedby={
                        fieldErrors.company_name ? "err-company_name" : undefined
                      }
                      autoComplete="organization"
                    />
                    {fieldErrors.company_name && (
                      <p id="err-company_name" className="text-sm text-red-600">
                        {fieldErrors.company_name}
                      </p>
                    )}
                  </div>
                  <div className="mt-5 grid gap-5 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="registration_number"
                        className={labelClass}
                      >
                        Registration number
                      </label>
                      <input
                        id="registration_number"
                        name="registration_number"
                        value={form.registration_number}
                        onChange={handleChange}
                        className={inputClass}
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="vat_number" className={labelClass}>
                        VAT number
                      </label>
                      <input
                        id="vat_number"
                        name="vat_number"
                        value={form.vat_number}
                        onChange={handleChange}
                        className={inputClass}
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="country" className={labelClass}>
                        Country
                      </label>
                      <input
                        id="country"
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        className={inputClass}
                        autoComplete="country-name"
                      />
                    </div>
                  </div>
                  <div className="mt-5 space-y-1">
                    <label htmlFor="address" className={labelClass}>
                      Address
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      rows={3}
                      className={inputClass}
                      autoComplete="street-address"
                    />
                  </div>
                </div>

                <div id="sec-contact" className={`${sectionShell} mt-6`}>
                  <SectionHeader
                    step={2}
                    title="Contact person"
                    description="Primary contact for questions about this submission."
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label htmlFor="contact_person" className={labelClass}>
                        Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="contact_person"
                        name="contact_person"
                        value={form.contact_person}
                        onChange={handleChange}
                        className={inputClass}
                        aria-invalid={!!fieldErrors.contact_person}
                        aria-describedby={
                          fieldErrors.contact_person
                            ? "err-contact_person"
                            : undefined
                        }
                        autoComplete="name"
                      />
                      {fieldErrors.contact_person && (
                        <p
                          id="err-contact_person"
                          className="text-sm text-red-600"
                        >
                          {fieldErrors.contact_person}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="contact_email" className={labelClass}>
                        Email <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="contact_email"
                        type="email"
                        name="contact_email"
                        value={form.contact_email}
                        onChange={handleChange}
                        className={inputClass}
                        aria-invalid={!!fieldErrors.contact_email}
                        aria-describedby={
                          fieldErrors.contact_email
                            ? "err-contact_email"
                            : undefined
                        }
                        autoComplete="email"
                      />
                      {fieldErrors.contact_email && (
                        <p
                          id="err-contact_email"
                          className="text-sm text-red-600"
                        >
                          {fieldErrors.contact_email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 max-w-md space-y-1">
                    <label htmlFor="contact_phone" className={labelClass}>
                      Phone
                    </label>
                    <input
                      id="contact_phone"
                      type="tel"
                      name="contact_phone"
                      value={form.contact_phone}
                      onChange={handleChange}
                      className={inputClass}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div id="sec-claim" className={`${sectionShell} mt-6`}>
                  <SectionHeader
                    step={3}
                    title="Claim details"
                    description="Period, amounts, and how this reclaim should be classified."
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label htmlFor="claim_period_start" className={labelClass}>
                        Period start
                      </label>
                      <input
                        id="claim_period_start"
                        type="date"
                        name="claim_period_start"
                        value={form.claim_period_start}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="claim_period_end" className={labelClass}>
                        Period end
                      </label>
                      <input
                        id="claim_period_end"
                        type="date"
                        name="claim_period_end"
                        value={form.claim_period_end}
                        onChange={handleChange}
                        className={inputClass}
                        aria-invalid={!!fieldErrors.claim_period_end}
                        aria-describedby={
                          fieldErrors.claim_period_end
                            ? "err-claim_period_end"
                            : undefined
                        }
                      />
                      {fieldErrors.claim_period_end && (
                        <p
                          id="err-claim_period_end"
                          className="text-sm text-red-600"
                        >
                          {fieldErrors.claim_period_end}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <div className="space-y-1">
                      <label htmlFor="claim_type" className={labelClass}>
                        Claim type
                      </label>
                      <select
                        id="claim_type"
                        name="claim_type"
                        value={form.claim_type}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option value="">Select claim type</option>
                        <option value="VAT Refund">VAT Refund</option>
                        <option value="Input VAT Recovery">
                          Input VAT Recovery
                        </option>
                        <option value="Cross-Border VAT Claim">
                          Cross-Border VAT Claim
                        </option>
                        <option value="Correction / Adjustment">
                          Correction / Adjustment
                        </option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="invoice_count" className={labelClass}>
                        Invoice count
                      </label>
                      <input
                        id="invoice_count"
                        type="number"
                        name="invoice_count"
                        value={form.invoice_count}
                        onChange={handleChange}
                        min={0}
                        step={1}
                        className={inputClass}
                        aria-invalid={!!fieldErrors.invoice_count}
                        aria-describedby={
                          fieldErrors.invoice_count
                            ? "err-invoice_count"
                            : undefined
                        }
                      />
                      {fieldErrors.invoice_count && (
                        <p
                          id="err-invoice_count"
                          className="text-sm text-red-600"
                        >
                          {fieldErrors.invoice_count}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label htmlFor="total_claim_amount" className={labelClass}>
                        Total claim amount
                      </label>
                      <input
                        id="total_claim_amount"
                        type="number"
                        name="total_claim_amount"
                        value={form.total_claim_amount}
                        onChange={handleChange}
                        min={0}
                        step="0.01"
                        className={inputClass}
                        aria-invalid={!!fieldErrors.total_claim_amount}
                        aria-describedby={
                          fieldErrors.total_claim_amount
                            ? "err-total_claim_amount"
                            : undefined
                        }
                      />
                      {fieldErrors.total_claim_amount && (
                        <p
                          id="err-total_claim_amount"
                          className="text-sm text-red-600"
                        >
                          {fieldErrors.total_claim_amount}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="currency" className={labelClass}>
                        Currency
                      </label>
                      <select
                        id="currency"
                        name="currency"
                        value={form.currency}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-5 space-y-1">
                    <label htmlFor="claim_description" className={labelClass}>
                      Claim description
                    </label>
                    <textarea
                      id="claim_description"
                      name="claim_description"
                      value={form.claim_description}
                      onChange={handleChange}
                      rows={4}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div id="sec-bank" className={`${sectionShell} mt-6`}>
                  <SectionHeader
                    step={4}
                    title="Bank details"
                    description="Refund destination where applicable. Leave blank if not yet available."
                  />
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-1">
                      <label htmlFor="bank_name" className={labelClass}>
                        Bank name
                      </label>
                      <input
                        id="bank_name"
                        name="bank_name"
                        value={form.bank_name}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="account_holder_name" className={labelClass}>
                        Account holder
                      </label>
                      <input
                        id="account_holder_name"
                        name="account_holder_name"
                        value={form.account_holder_name}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="iban" className={labelClass}>
                        IBAN / account
                      </label>
                      <input
                        id="iban"
                        name="iban"
                        value={form.iban}
                        onChange={handleChange}
                        className={inputClass}
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="swift_code" className={labelClass}>
                        SWIFT / BIC
                      </label>
                      <input
                        id="swift_code"
                        name="swift_code"
                        value={form.swift_code}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div id="sec-support" className={`${sectionShell} mt-6`}>
                  <SectionHeader
                    step={5}
                    title="Supporting information"
                    description="References and notes that help reviewers validate the claim."
                  />
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="space-y-1">
                      <label htmlFor="invoice_references" className={labelClass}>
                        Invoice references
                      </label>
                      <textarea
                        id="invoice_references"
                        name="invoice_references"
                        value={form.invoice_references}
                        onChange={handleChange}
                        rows={4}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="transaction_references"
                        className={labelClass}
                      >
                        Transaction references
                      </label>
                      <textarea
                        id="transaction_references"
                        name="transaction_references"
                        value={form.transaction_references}
                        onChange={handleChange}
                        rows={4}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="mt-5 space-y-1">
                    <label htmlFor="additional_notes" className={labelClass}>
                      Additional notes
                    </label>
                    <textarea
                      id="additional_notes"
                      name="additional_notes"
                      value={form.additional_notes}
                      onChange={handleChange}
                      rows={4}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div id="sec-declaration" className={`${sectionShell} mt-6`}>
                  <SectionHeader
                    step={6}
                    title="Declaration"
                    description="Required confirmation before submission."
                  />
                  <div className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
                    <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-slate-800">
                      <input
                        id="declaration_accepted"
                        type="checkbox"
                        name="declaration_accepted"
                        checked={form.declaration_accepted}
                        onChange={handleChange}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        aria-invalid={!!fieldErrors.declaration_accepted}
                        aria-describedby={
                          fieldErrors.declaration_accepted
                            ? "err-declaration"
                            : undefined
                        }
                      />
                      <span>
                        I confirm that the submitted VAT claim information is
                        correct. <span className="text-red-600">*</span>
                      </span>
                    </label>
                    {fieldErrors.declaration_accepted && (
                      <p id="err-declaration" className="mt-2 text-sm text-red-600">
                        {fieldErrors.declaration_accepted}
                      </p>
                    )}
                  </div>
                </div>

                <p className="mt-8 text-sm text-slate-500">
                  When you are ready, submit using the button in the bar at the
                  bottom of the screen.
                </p>
              </fieldset>
            </form>
          </div>
        </div>

        <div
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/90 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-md sm:px-8"
          role="region"
          aria-label="Submit actions"
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <p className="hidden text-sm text-slate-600 sm:block">
              {loading
                ? "Sending your claim…"
                : "Complete required fields, then submit. Section links highlight as you scroll; use them to jump ahead."}
            </p>
            <button
              type="submit"
              form="vat-claim-form"
              disabled={loading}
              className="ml-auto w-full rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[220px]"
            >
              {loading ? "Submitting…" : "Submit VAT claim"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
