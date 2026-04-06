import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assistant",
  description:
    "Screening copilot grounded in retrieved submission rows — portfolio overview or single case.",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
