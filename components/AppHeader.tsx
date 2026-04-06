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

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 shadow-sm shadow-slate-200/40 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-3 rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold tracking-tight text-white shadow-sm ring-1 ring-emerald-700/20"
            aria-hidden
          >
            VS
          </span>
          <span className="min-w-0 text-left leading-tight">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {deploymentLabel}
            </span>
            <span className="block truncate text-sm font-semibold text-slate-900 sm:text-base">
              VAT Sentinel
            </span>
          </span>
        </Link>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:gap-3">
          <span className="order-last hidden rounded-full border border-amber-200/90 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-950 sm:order-none sm:inline-flex">
            Finland pilot
          </span>
          <nav
            className="-mx-1 flex max-w-[min(100vw,28rem)] flex-nowrap items-center justify-end gap-0.5 overflow-x-auto px-1 pb-0.5 text-sm font-medium sm:max-w-none sm:flex-wrap sm:overflow-visible sm:pb-0"
            aria-label="Main"
          >
            {NAV.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-2.5 py-2 transition sm:px-3 ${
                    active
                      ? "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200/80"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
