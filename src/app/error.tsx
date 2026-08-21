"use client";

import { useEffect } from "react";
import { captureError } from "@/lib/monitoring";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, {
      route: "app-error-boundary",
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <main className="container mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="mt-3 opacity-70">
        We hit an unexpected error. You can try again — if it keeps happening,
        rest assured it has been logged.
      </p>
      {error.digest && (
        <code className="mt-4 text-xs opacity-50">ref: {error.digest}</code>
      )}
      <button onClick={reset} className="btn btn-primary mt-8">
        Try again
      </button>
    </main>
  );
}
