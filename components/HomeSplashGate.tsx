"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const STORAGE_KEY = "vat-sentinel-splash-seen";
const DISPLAY_MS = 2000;
const FADE_MS = 280;

type SplashPhase = "pending" | "show" | "hide";

export function HomeSplashGate({ children }: { children: React.ReactNode }) {
  const [splash, setSplash] = useState<SplashPhase>("pending");
  const [fading, setFading] = useState(false);

  useLayoutEffect(() => {
    queueMicrotask(() => {
      try {
        if (sessionStorage.getItem(STORAGE_KEY) === "1") {
          setSplash("hide");
          return;
        }
      } catch {
        /* private mode */
      }
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        try {
          sessionStorage.setItem(STORAGE_KEY, "1");
        } catch {
          /* ignore */
        }
        setSplash("hide");
        return;
      }
      setSplash("show");
    });
  }, []);

  useEffect(() => {
    if (splash !== "show") return;
    const t = window.setTimeout(() => {
      setFading(true);
      window.setTimeout(() => {
        try {
          sessionStorage.setItem(STORAGE_KEY, "1");
        } catch {
          /* ignore */
        }
        setSplash("hide");
        setFading(false);
      }, FADE_MS);
    }, DISPLAY_MS);
    return () => window.clearTimeout(t);
  }, [splash]);

  function skip() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setFading(true);
    window.setTimeout(() => {
      setSplash("hide");
      setFading(false);
    }, FADE_MS);
  }

  return (
    <>
      {children}
      {splash === "show" ? (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-white to-sky-50/50 px-6 transition-opacity duration-300 ease-out ${
            fading ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          aria-busy="true"
          aria-label="Welcome"
        >
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold tracking-tight text-white shadow-lg shadow-blue-900/20 ring-1 ring-blue-700/25">
              VS
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-blue-900/90">
              Finland pilot · Demo
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              VAT Sentinel
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Intake, automation, and review in one calm workspace — grounded in
              live data for pilot trials.
            </p>
            <ol className="mt-8 space-y-3 text-left text-sm text-slate-700">
              <li className="flex gap-3 rounded-xl border border-slate-200/90 bg-white/90 px-4 py-3 shadow-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-xs font-bold text-blue-900">
                  1
                </span>
                <span>
                  <strong className="text-slate-900">Submit</strong> structured
                  VAT reclaim intake
                </span>
              </li>
              <li className="flex gap-3 rounded-xl border border-slate-200/90 bg-white/90 px-4 py-3 shadow-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-xs font-bold text-blue-900">
                  2
                </span>
                <span>
                  <strong className="text-slate-900">Automate</strong> via your
                  screening pipeline (e.g. n8n)
                </span>
              </li>
              <li className="flex gap-3 rounded-xl border border-slate-200/90 bg-white/90 px-4 py-3 shadow-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-xs font-bold text-blue-900">
                  3
                </span>
                <span>
                  <strong className="text-slate-900">Evaluate</strong> and ask
                  the assistant about the portfolio
                </span>
              </li>
            </ol>
            <p className="mt-6 text-[11px] leading-relaxed text-slate-500">
              Demo only — not legal or tax advice. Sample data may be fictional.
            </p>
          </div>
          <button
            type="button"
            onClick={skip}
            className="mt-10 text-sm font-semibold text-blue-800 underline decoration-blue-400/80 underline-offset-4 transition hover:text-blue-950"
          >
            Skip
          </button>
        </div>
      ) : null}
    </>
  );
}
