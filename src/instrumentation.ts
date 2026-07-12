import * as Sentry from "@sentry/nextjs";

// Next.js calls register() once on server/edge startup — load the matching
// Sentry config for the runtime.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Reports errors thrown in nested React Server Components to Sentry.
export const onRequestError = Sentry.captureRequestError;
