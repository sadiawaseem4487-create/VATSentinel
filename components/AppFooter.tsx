"use client";

import { usePathname } from "next/navigation";

export function AppFooter() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <footer className="mt-auto border-t border-slate-200/90 bg-slate-50/90 py-6 text-center text-xs leading-relaxed text-slate-500">
      <p className="mx-auto max-w-2xl px-4">
        <span className="font-medium text-slate-600">VAT Sentinel</span> — demo
        for pilot trials. Answers and scores are illustrative; not legal or tax
        advice. Sample data may be fictional.
      </p>
    </footer>
  );
}
