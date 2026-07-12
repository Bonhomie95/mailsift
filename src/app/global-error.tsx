"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          background: "#0a0a12",
          color: "#e6e6f0",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <h2 style={{ marginBottom: 12 }}>Something went wrong.</h2>
          <p style={{ color: "#9a9ab0", marginBottom: 20 }}>
            We&rsquo;ve logged the error. Please try again.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#6d5efc",
              color: "#fff",
              border: 0,
              borderRadius: 10,
              padding: "10px 18px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
