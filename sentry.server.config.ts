// Server-side Sentry (used whenever the server handles a request).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://82e1a734a51a2f7312f839dedf204609@o4511723855740928.ingest.de.sentry.io/4511723866619984",

  // 10% of traces (raise temporarily if you need to debug performance).
  tracesSampleRate: 0.1,

  // Never attach request bodies or user info — POST bodies contain the domain
  // lists users submit, which we don't want in error reports.
  sendDefaultPii: false,
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },
});
