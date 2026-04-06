import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evaluate",
  description:
    "Live submission queue with risk context, charts, and approve or reject actions.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
