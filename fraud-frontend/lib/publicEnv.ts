/**
 * Safe for client components. `NEXT_PUBLIC_VERCEL_ENV` is set at build time via
 * `next.config.mjs` from `VERCEL_ENV` (empty when developing locally).
 */
export function getDeploymentLabel(): "Local" | "Preview" | "Demo" {
  const v = process.env.NEXT_PUBLIC_VERCEL_ENV ?? "";
  if (v === "production") return "Demo";
  if (v === "preview") return "Preview";
  return "Local";
}
