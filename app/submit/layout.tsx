import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit claim",
  description:
    "Structured VAT reclaim intake — saved to Supabase and forwarded to your screening webhook.",
};

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
