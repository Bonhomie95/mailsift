// Client-side Sentry init (Next.js loads this in the browser).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://82e1a734a51a2f7312f839dedf204609@o4511723855740928.ingest.de.sentry.io/4511723866619984",

  // Session Replay is intentionally OFF: it records the DOM, which includes the
  // domain/email lists users paste. We don't want that leaving the browser.
  integrations: [],

  // Sample 10% of performance traces (raise while debugging if needed).
  tracesSampleRate: 0.1,

  // Don't attach user info or request bodies to events (bodies contain domains).
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
