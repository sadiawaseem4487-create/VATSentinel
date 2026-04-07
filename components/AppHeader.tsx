"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDeploymentLabel } from "@/lib/publicEnv";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/submit", label: "Submit" },
  { href: "/dashboard", label: "Evaluate" },
  { href: "/chat", label: "Assistant" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname();
  const deploymentLabel = getDeploymentLabel();
  const isHome = pathname === "/";

  return (
    <header
      className={
        isHome
          ? "fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/35 shadow-[0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md"
          : "sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 shadow-sm shadow-slate-200/40 backdrop-blur-md supports-[backdrop-filter]:bg-white/80"
      }
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className={`group flex min-w-0 items-center gap-3 rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 ${
            isHome
              ? "focus-visible:outline-sky-400"
              : "focus-visible:outline-blue-600"
          }`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold tracking-tight text-white shadow-sm ring-1 ${
              isHome
                ? "bg-blue-600 ring-blue-500/30"
                : "bg-blue-600 ring-blue-700/20"
            }`}
            aria-hidden
          >
            VS
          </span>
          <span className="min-w-0 text-left leading-tight">
            <span
              className={`block text-[10px] font-semibold uppercase tracking-[0.14em] ${
                isHome ? "text-slate-400" : "text-slate-400"
              }`}
            >
              {deploymentLabel}
            </span>
            <span
              className={`block truncate text-sm font-semibold sm:text-base ${
                isHome ? "text-white" : "text-slate-900"
              }`}
            >
              VAT Sentinel
            </span>
            {isHome ? (
              <span className="hidden text-[11px] text-slate-400 sm:block">
                Tax compliance pilot
              </span>
            ) : null}
          </span>
        </Link>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:gap-3">
          <span
            className={`order-last hidden rounded-full px-2.5 py-1 text-[11px] font-medium sm:order-none sm:inline-flex ${
              isHome
                ? "border border-white/15 bg-white/5 text-sky-100"
                : "border border-amber-200/90 bg-amber-50 text-amber-950"
            }`}
          >
            Finland pilot
          </span>
          <nav
            className={`-mx-1 flex max-w-[min(100vw,28rem)] flex-nowrap items-center justify-end gap-0.5 overflow-x-auto px-1 pb-0.5 text-sm font-medium sm:max-w-none sm:flex-wrap sm:overflow-visible sm:pb-0 ${
              isHome ? "text-slate-200" : ""
            }`}
            aria-label="Main"
          >
            {NAV.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-2.5 py-2 transition sm:px-3 ${
                    isHome
                      ? active
                        ? "bg-white/15 text-white ring-1 ring-white/20"
                        : "text-slate-200 hover:bg-white/10 hover:text-white"
                      : active
                        ? "bg-blue-50 text-blue-950 ring-1 ring-blue-200/80"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          {isHome ? (
            <div className="flex items-center gap-2 pl-1">
              <Link
                href="/dashboard"
                className="hidden text-sm font-medium text-slate-300 transition hover:text-white sm:inline"
              >
                Sign in
              </Link>
              <Link
                href="/submit"
                className="inline-flex items-center gap-1 rounded-lg bg-blue-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-400"
              >
                Get started
                <span aria-hidden>→</span>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
