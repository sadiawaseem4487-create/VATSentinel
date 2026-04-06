import Link from "next/link";
import { AgentScanHero } from "@/components/AgentScanHero";

function IconDocument({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-[calc(100dvh-8rem)] bg-gradient-to-b from-slate-50 via-white to-emerald-50/40">
      <div className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800/90">
            Pilot demo · VAT reclaim screening
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-[2.65rem] sm:leading-[1.1]">
            VAT Sentinel
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
            A calm, end-to-end trial surface: submit structured claims, review them
            in a live queue, and ask the assistant about the data you see here.
            Built for Finland-style pilot scenarios with optional fictional sample
            data.
          </p>
        </div>

        <AgentScanHero />

        <ul className="mx-auto mt-12 grid max-w-3xl gap-4 text-left text-sm text-slate-600 sm:grid-cols-3">
          <li className="rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm">
            <span className="font-semibold text-slate-800">Intake</span>
            <span className="mt-1 block leading-relaxed text-slate-600">
              Validated forms with optional one-click sample fill for demos.
            </span>
          </li>
          <li className="rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm">
            <span className="font-semibold text-slate-800">Screen</span>
            <span className="mt-1 block leading-relaxed text-slate-600">
              Submissions flow to your pipeline for scoring and automation.
            </span>
          </li>
          <li className="rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm">
            <span className="font-semibold text-slate-800">Decide</span>
            <span className="mt-1 block leading-relaxed text-slate-600">
              Evaluators see risk signals, charts, and approve or reject in one view.
            </span>
          </li>
        </ul>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2 md:gap-8">
          <article className="group flex flex-col rounded-2xl border border-slate-200/90 bg-white p-8 shadow-md shadow-slate-200/50 transition hover:border-emerald-200 hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100/80">
              <IconDocument className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-slate-900">
              Submit a claim
            </h2>
            <p className="mt-3 flex-1 leading-relaxed text-slate-600">
              Complete the VAT reclaim form. Entries are stored and sent to your
              configured screening webhook for this demo.
            </p>
            <Link
              href="/submit"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              Go to intake
            </Link>
          </article>

          <article className="group flex flex-col rounded-2xl border border-slate-200/90 bg-white p-8 shadow-md shadow-slate-200/50 transition hover:border-emerald-200 hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-slate-200/80">
              <IconChart className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-slate-900">
              Evaluate &amp; act
            </h2>
            <p className="mt-3 flex-1 leading-relaxed text-slate-600">
              Review the queue, filter and search, inspect risk context, and record
              decisions aligned with your workflow.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center justify-center rounded-xl border-2 border-slate-900 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Open workspace
            </Link>
          </article>
        </div>

        <p className="mt-14 text-center text-sm text-slate-500">
          Questions on the dataset?{" "}
          <Link
            href="/chat"
            className="font-medium text-emerald-800 underline-offset-4 hover:text-emerald-950 hover:underline"
          >
            Open the screening assistant
          </Link>
        </p>
      </div>
    </main>
  );
}
