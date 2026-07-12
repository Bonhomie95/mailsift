// Edge-runtime Sentry (middleware, edge routes).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://82e1a734a51a2f7312f839dedf204609@o4511723855740928.ingest.de.sentry.io/4511723866619984",

  tracesSampleRate: 0.1,

  sendDefaultPii: false,
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },
});
