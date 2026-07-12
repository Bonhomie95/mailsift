const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Required in Next 14 for src/instrumentation.ts (Sentry server init).
    instrumentationHook: true,
  },
};

// Single Sentry wrapper. Source maps upload only when SENTRY_AUTH_TOKEN is set,
// so local builds without it still succeed.
module.exports = withSentryConfig(nextConfig, {
  org: "bonhomie-inc",
  project: "mailsift",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Route Sentry through a Next.js rewrite to dodge ad-blockers.
  tunnelRoute: "/monitoring",
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  webpack: { automaticVercelMonitors: true },
});
