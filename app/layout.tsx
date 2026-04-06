import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import "./globals.css";

function metadataBaseUrl(): URL {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      return new URL(site.startsWith("http") ? site : `https://${site}`);
    } catch {
      /* fall through */
    }
  }
  if (process.env.VERCEL_URL)
    return new URL(`https://${process.env.VERCEL_URL}`);
  return new URL("http://localhost:3947");
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl(),
  title: {
    default: "VAT Sentinel · Demo",
    template: "%s · VAT Sentinel",
  },
  description:
    "Pilot demo: VAT reclaim intake, evaluator workspace, and screening assistant for trial use.",
  openGraph: {
    type: "website",
    locale: "en",
    siteName: "VAT Sentinel",
    title: "VAT Sentinel · Demo",
    description:
      "VAT reclaim intake, live evaluator workspace, and screening assistant for Finland-style pilot trials.",
  },
  twitter: {
    card: "summary_large_image",
    title: "VAT Sentinel · Demo",
    description:
      "VAT reclaim intake, live evaluator workspace, and screening assistant.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900 antialiased">
        <AppHeader />
        <div className="flex-1">{children}</div>
        <AppFooter />
        <Analytics />
      </body>
    </html>
  );
}
