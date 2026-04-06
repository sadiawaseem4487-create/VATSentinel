import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VAT Sentinel · Demo",
  description:
    "Pilot demo: VAT reclaim intake, evaluator workspace, and screening assistant for trial use.",
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
      </body>
    </html>
  );
}
