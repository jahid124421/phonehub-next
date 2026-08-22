"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/lib/data";

type Source = "groq" | "gemini" | "local";

interface AnswerResponse {
  answer: string;
  products: Product[];
  source: Source;
}

const EXAMPLE_QUESTIONS = [
  "Best phone for photography under $800?",
  "Which phone has the best battery life?",
  "Gaming phone under $600 with 12GB RAM?",
];

const SOURCE_BADGES: Record<Source, { label: string; className: string }> = {
  groq: { label: "AI · Groq", className: "badge-primary" },
  gemini: { label: "AI · Gemini", className: "badge-secondary" },
  local: { label: "Instant answer", className: "badge-accent" },
};

export default function AnswerBox() {
  return (
    <Suspense fallback={<AnswerBoxShell />}>
      <AnswerBoxInner />
    </Suspense>
  );
}

/** Static shell rendered while search params resolve (SSR / prerender). */
function AnswerBoxShell() {
  return (
    <div className="card bg-base-200 shadow-sm mb-8">
      <div className="card-body gap-4">
        <h2 className="card-title text-lg">Ask PhoneHub AI</h2>
        <div className="input input-bordered w-full opacity-50">
          Ask anything, e.g. best phone for photography under $800?
        </div>
      </div>
    </div>
  );
}

function AnswerBoxInner() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnswerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const lastAutoAsked = useRef<string | null>(null);

  async function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed || loadingRef.current) return;
    loadingRef.current = true;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }
      setResult(data as AnswerResponse);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  // Auto-ask when arriving with a search query (?q=...), e.g. from the
  // header search or command palette. Fires once per unique query.
  useEffect(() => {
    const trimmed = urlQuery.trim();
    if (trimmed.length < 3) return;
    if (lastAutoAsked.current === trimmed) return;
    lastAutoAsked.current = trimmed;
    setQuestion(trimmed);
    void ask(trimmed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  return (
    <div className="card bg-base-200 shadow-sm mb-8">
      <div className="card-body gap-4">
        <h2 className="card-title text-lg">Ask PhoneHub AI</h2>

        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Ask anything, e.g. best phone for photography under $800?"
          value={question}
          maxLength={500}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") ask(question);
          }}
        />

        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              className="btn btn-xs btn-outline"
              onClick={() => {
                setQuestion(q);
                ask(q);
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm opacity-70">
            <span className="loading loading-spinner loading-sm" />
            Thinking…
          </div>
        )}

        {error && <div className="alert alert-error text-sm">{error}</div>}

        {result && (
          <div className="flex flex-col gap-4">
            <div>
              <span className={`badge ${SOURCE_BADGES[result.source].className} mb-2`}>
                {SOURCE_BADGES[result.source].label}
              </span>
              <p className="whitespace-pre-line text-sm leading-relaxed">
                {result.answer}
              </p>
            </div>

            {result.products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {result.products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/phone/${p.id}`}
                    className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="card-body p-4 gap-1">
                      <p className="text-xs opacity-60">{p.brand}</p>
                      <h3 className="font-semibold text-sm leading-tight">{p.name}</h3>
                      <p className="text-sm font-bold text-primary">
                        {p.basePrice > 0 ? `$${p.basePrice}` : "Price TBD"}
                      </p>
                      <p className="text-xs opacity-70">★ {p.rating}/5</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
