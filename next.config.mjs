/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Expose Vercel deployment tier to the client (empty when developing locally). */
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "",
  },
};

export default nextConfig;
