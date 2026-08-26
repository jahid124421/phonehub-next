"use client";

import { useState } from 'react';
import { askPuter, isPuterAvailable, ensurePuterAuth } from '@/lib/puter';

interface Props {
  context?: string;
  placeholder?: string;
}

export default function PuterChat({ context, placeholder }: Props) {
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk() {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      if (!isPuterAvailable()) {
        throw new Error('Puter not loaded. Check your connection and refresh.');
      }
      await ensurePuterAuth();
      const res = await askPuter(trimmed, context);
      setAnswer(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Puter request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body gap-3">
        <h3 className="font-semibold flex items-center gap-2">
          PhoneHub AI <span className="badge badge-primary badge-sm">Puter User-Pays · $0 to us</span>
        </h3>
        <p className="text-xs opacity-60">
          Your question is answered by your own Puter account — PhoneHub pays nothing. Sign-in required once.
        </p>
        <div className="flex gap-2">
          <input
            className="input input-bordered flex-1"
            placeholder={placeholder ?? 'Ask about phones, specs, or comparisons…'}
            value={q}
            maxLength={500}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          />
          <button className="btn btn-primary" onClick={handleAsk} disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-sm" /> : 'Ask'}
          </button>
        </div>
        {error && <div className="alert alert-error text-sm py-2">{error}</div>}
        {answer && <div className="prose prose-sm max-w-none whitespace-pre-line text-sm leading-relaxed">{answer}</div>}
      </div>
    </div>
  );
}
