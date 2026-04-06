/**
 * Decorative hero: AI-style document scan + radar sweep (landing page).
 */
export function AgentScanHero() {
  return (
    <div
      className="relative mx-auto mt-10 w-full max-w-3xl select-none"
      role="img"
      aria-label="Illustration: an AI screening agent, documents with a moving scan line, and a rotating detection radar with signal blips."
    >
      <div
        aria-hidden
        className="flex flex-col items-center justify-center gap-10 sm:flex-row sm:gap-14 md:gap-20"
      >
        <DocumentScanStack />
        <div className="flex flex-col items-center gap-4">
          <RadarSweep />
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
            Detection sweep
          </span>
        </div>
        <AiAgentNode />
      </div>
    </div>
  );
}

function DocumentScanStack() {
  return (
    <div className="relative h-[168px] w-[130px] shrink-0">
      {/* stacked sheets */}
      <div className="absolute left-1 top-2 h-[148px] w-[112px] rounded-md border border-slate-200/90 bg-white shadow-md shadow-slate-300/40" />
      <div className="absolute left-0 top-0 h-[152px] w-[118px] rounded-md border border-slate-200 bg-white shadow-lg shadow-slate-400/30 ring-1 ring-slate-950/[0.04]">
        <div className="space-y-2 p-3 pt-4">
          <div className="h-1.5 w-[75%] rounded bg-slate-200" />
          <div className="h-1.5 w-full rounded bg-slate-100" />
          <div className="h-1.5 w-[83%] rounded bg-slate-100" />
          <div className="mt-3 h-1 w-[33%] rounded bg-amber-400/90 animate-[issue-blink_2.4s_ease-in-out_infinite] motion-reduce:animate-none" />
          <div className="h-1.5 w-full rounded bg-slate-100" />
          <div className="h-1.5 w-[66%] rounded bg-slate-100" />
        </div>
        {/* moving scan beam */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
          <div className="absolute inset-x-0 top-0 h-[28%] bg-gradient-to-b from-emerald-400/25 via-emerald-500/12 to-transparent animate-[doc-scan_2.8s_ease-in-out_infinite] motion-reduce:animate-none" />
        </div>
      </div>
      <div className="absolute -right-1 bottom-1 h-6 w-6 rounded-full border border-emerald-200 bg-emerald-50 text-[9px] font-bold leading-6 text-emerald-800 shadow-sm ring-2 ring-white">
        AI
      </div>
    </div>
  );
}

function RadarSweep() {
  return (
    <div className="relative h-[140px] w-[140px] shrink-0">
      {/* static rings */}
      <div className="absolute inset-0 z-0 rounded-full border border-emerald-200/70 bg-gradient-to-br from-slate-50 to-emerald-50/40 shadow-inner shadow-emerald-900/5" />
      <div className="absolute inset-3 z-0 rounded-full border border-dashed border-emerald-300/50" />
      <div className="absolute inset-8 z-0 rounded-full border border-emerald-200/40" />
      {/* rotating sweep */}
      <div
        className="absolute inset-0 z-[1] animate-[radar-sweep_3.8s_linear_infinite] rounded-full motion-reduce:animate-none"
        style={{
          background:
            "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(16, 185, 129, 0.35) 52deg, rgba(16, 185, 129, 0.08) 56deg, transparent 58deg)",
        }}
      />
      {/* center hub + blips above sweep */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[2] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600 shadow-[0_0_12px_rgba(5,150,105,0.6)]" />
      <span className="pointer-events-none absolute left-[72%] top-[28%] z-[2] h-1.5 w-1.5 rounded-full bg-amber-500 shadow-sm animate-[blip_2s_ease-in-out_infinite] motion-reduce:animate-none" />
      <span
        className="pointer-events-none absolute left-[32%] top-[62%] z-[2] h-1.5 w-1.5 rounded-full bg-red-500/90 animate-[blip_2s_ease-in-out_infinite] motion-reduce:animate-none [animation-delay:0.7s]"
      />
      <span
        className="pointer-events-none absolute left-[58%] top-[72%] z-[2] h-1 w-1 rounded-full bg-emerald-600 animate-[blip_2s_ease-in-out_infinite] motion-reduce:animate-none [animation-delay:1.1s]"
      />
    </div>
  );
}

function AiAgentNode() {
  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-lg font-bold text-white shadow-lg shadow-emerald-900/25 ring-2 ring-emerald-400/30 animate-[agent-float_4s_ease-in-out_infinite] motion-reduce:animate-none">
          <svg
            viewBox="0 0 24 24"
            className="h-9 w-9"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423L16.5 15.75l.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
            />
          </svg>
        </div>
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40 motion-reduce:animate-none" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
        </span>
      </div>
      <span className="max-w-[8rem] text-center text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
        Screening agent
      </span>
    </div>
  );
}
