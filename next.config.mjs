import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Lock the app root when another lockfile exists higher in the tree (e.g.
   * ~/package-lock.json). Without this, Next can resolve the wrong workspace
   * and local dev returns 500 / “unable to handle this request”.
   */
  turbopack: {
    root: __dirname,
  },
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "",
  },
};

export default nextConfig;
