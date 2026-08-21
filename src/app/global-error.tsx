"use client";

import { useEffect } from "react";
import { captureError } from "@/lib/monitoring";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, {
      route: "global-error-boundary",
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "4rem 1.5rem",
          textAlign: "center",
        }}
      >
        <h1>Something went wrong</h1>
        <p>Please reload the page, or try again.</p>
        {error.digest && (
          <p>
            <code style={{ fontSize: 12, opacity: 0.5 }}>ref: {error.digest}</code>
          </p>
        )}
        <button onClick={reset} style={{ marginTop: "1.5rem" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
