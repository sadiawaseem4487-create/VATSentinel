import type { Metadata } from "next";
import Link from "next/link";
import { HomeSplashGate } from "@/components/HomeSplashGate";

export const metadata: Metadata = {
  title: "Home",
  description:
    "VAT Sentinel — tax compliance intelligence for VAT reclaim screening, automation, and review.",
};

function IconBrain({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function IconNetwork({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5v13.5" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function IconDocument({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function IconBolt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
}

const CAPABILITIES = [
  {
    title: "AI-assisted screening",
    body: "Ask the copilot about portfolio totals and cases — grounded in data retrieved from your environment.",
    icon: IconBrain,
  },
  {
    title: "Structured intake",
    body: "Validated VAT reclaim forms with optional demo fill, stored in Supabase and forwarded to your pipeline.",
    icon: IconDocument,
  },
  {
    title: "Risk & signals",
    body: "Evaluator workspace with charts, risk bands, and clear approve / reject actions on each submission.",
    icon: IconChart,
  },
  {
    title: "Workflow automation",
    body: "Webhook notifications to n8n (or similar) so scoring, alerts, and audit steps stay in your stack.",
    icon: IconBolt,
  },
  {
    title: "Operational mapping",
    body: "Search, filter, and expand rows to inspect full context before you record a decision.",
    icon: IconNetwork,
  },
  {
    title: "Compliance posture",
    body: "Demo-only; designed for pilot trials — not legal or tax advice. Sample data may be fictional.",
    icon: IconShield,
  },
] as const;

export default function HomePage() {
  return (
    <HomeSplashGate>
      <main className="flex min-h-[calc(100dvh-8rem)] flex-col">
        {/* Hero — full viewport feel with padding for fixed header */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 pt-20 pb-20 sm:pt-24 sm:pb-28">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-5xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-200 ring-1 ring-sky-400/20">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" aria-hidden />
              VAT compliance intelligence
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl sm:leading-[1.1]">
              Protect public revenue.
              <br />
              <span className="bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-transparent">
                Ensure VAT compliance.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              VAT Sentinel connects intake, automation, and review in one pilot-ready
              surface. Route claims through your screening stack, then decide in a
              live queue with AI-grounded context.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Access platform
                <span aria-hidden>→</span>
              </Link>
              <a
                href="#capabilities"
                className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80"
              >
                Learn more
              </a>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section
          id="capabilities"
          className="scroll-mt-24 bg-white py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Platform capabilities
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Everything you need for a credible pilot: data in one place,
                automation hooks, and a clear path from intake to decision.
              </p>
            </div>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map(({ title, body, icon: Icon }) => (
                <li
                  key={title}
                  className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-6 shadow-sm ring-1 ring-slate-950/[0.03] transition hover:border-blue-200/80 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Quick links — light cards */}
        <section className="border-y border-slate-200/80 bg-slate-50/80 py-14">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid gap-6 md:grid-cols-2">
              <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  Submit a claim
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                  Open the intake form. Data is stored and sent to your configured
                  webhook for this demo.
                </p>
                <Link
                  href="/submit"
                  className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Go to intake
                </Link>
              </article>
              <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  Evaluate &amp; assistant
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                  Review the live queue or ask questions grounded in retrieved
                  submission rows.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/dashboard"
                    className="inline-flex flex-1 items-center justify-center rounded-xl border-2 border-slate-900 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    Workspace
                  </Link>
                  <Link
                    href="/chat"
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-900 transition hover:bg-blue-100"
                  >
                    Assistant
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 py-16 text-center">
          <div className="mx-auto max-w-2xl px-6">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to run the pilot?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              Use the demo environment to walk through intake, automation, and
              review. Configure keys and webhooks in your deployment settings.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
            >
              Sign in to workspace
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        {/* Landing footer (global AppFooter hidden on /) */}
        <footer className="border-t border-slate-800 bg-black py-10 text-slate-400">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                VS
              </span>
              <span className="text-sm font-semibold text-slate-200">
                VAT Sentinel
              </span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-xs font-medium">
              <span className="text-slate-500">Demo deployment</span>
              <a
                href="/api/health"
                className="text-slate-400 transition hover:text-white"
              >
                Health
              </a>
            </nav>
            <p className="text-center text-[11px] text-slate-600 sm:text-right">
              © {new Date().getFullYear()} VAT Sentinel — pilot trial. Not legal or
              tax advice.
            </p>
          </div>
        </footer>
      </main>
    </HomeSplashGate>
  );
}
