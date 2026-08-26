import { getFilterSpecsForProduct, type Product } from '@/lib/data';
import { smartSearch, type ScoredProduct } from '@/lib/ai-heuristics';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AnswerResult {
  answer: string;
  products: Product[];
  source: 'groq' | 'gemini' | 'local';
}

const TIMEOUT_MS = 8000;

// ─── Global daily LLM budget (defense-in-depth cost cap) ────────────────────
//
// The /api/answer rate limiter is per-IP, so a determined abuser with rotating
// IPs could still drive unbounded Groq/Gemini spend. This is a GLOBAL daily cap
// on LLM invocations: once exhausted, answers degrade gracefully to the local
// heuristic engine (zero cost) until the next UTC day.
//
// Note: the counter is per serverless instance, so on Vercel total spend is
// bounded by (active instances × budget) — still a hard, predictable ceiling.
// Configure with AI_DAILY_LLM_BUDGET (default 500 calls/day).

const DEFAULT_DAILY_LLM_BUDGET = 500;

let budgetDay = new Date().toISOString().slice(0, 10);
let llmCallsToday = 0;

export function llmBudgetLimit(): number {
  const raw = Number(process.env.AI_DAILY_LLM_BUDGET);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_DAILY_LLM_BUDGET;
}

export function llmBudgetRemaining(): number {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== budgetDay) {
    budgetDay = today;
    llmCallsToday = 0;
  }
  return Math.max(0, llmBudgetLimit() - llmCallsToday);
}

/** Returns true if an LLM call is allowed right now (and consumes one unit). */
function consumeLlmBudget(): boolean {
  if (llmBudgetRemaining() <= 0) return false;
  llmCallsToday += 1;
  return true;
}

// ─── Groq (primary) ──────────────────────────────────────────────────────────

export async function askGroq(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.3,
        max_tokens: 600,
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Groq HTTP ${res.status}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Groq returned empty/malformed response');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Gemini (fallback) ───────────────────────────────────────────────────────

export async function askGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
        }),
        signal: controller.signal,
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini HTTP ${res.status}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('')
      .trim();
    if (!text) throw new Error('Gemini returned empty/malformed response');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Grounding context ───────────────────────────────────────────────────────

function serializeProduct(p: ScoredProduct): string {
  const qs = p.quickSpecs || {};
  const fs = getFilterSpecsForProduct(p.id);
  const parts: string[] = [
    `- ${p.brand} ${p.name} (estimated launch price $${p.basePrice}, rating ${p.rating}/5)`,
  ];
  const specs: string[] = [];
  if (qs.camera || qs.mainCamera) specs.push(`Camera: ${qs.camera || qs.mainCamera}`);
  if (fs?.mainCameraMP) specs.push(`${fs.mainCameraMP}MP main`);
  if (qs.selfieCamera) specs.push(`Selfie: ${qs.selfieCamera}`);
  if (qs.battery) specs.push(`Battery: ${qs.battery}`);
  if (fs?.batteryCapacity) specs.push(`${fs.batteryCapacity}mAh`);
  if (qs.ram || qs.memory) specs.push(`RAM: ${qs.ram || qs.memory}`);
  if (qs.chipset || qs.processor || fs?.chipset) {
    specs.push(`Chipset: ${qs.chipset || qs.processor || fs?.chipset}`);
  }
  if (qs.display || qs.screen) specs.push(`Display: ${qs.display || qs.screen}`);
  if (specs.length > 0) parts.push(`  ${specs.join(' | ')}`);
  if (p.matchReasons.length > 0) parts.push(`  Why: ${p.matchReasons.join('; ')}`);
  return parts.join('\n');
}

const SYSTEM_PROMPT =
  "You are PhoneHub's phone expert. Answer ONLY using the product data below. " +
  'Be concise and cite specific models. If you mention price, always phrase it as ' +
  '"estimated launch price" — never as a current retail price or a live deal. ' +
  "If the data can't answer, say so.";

function buildPrompt(question: string, candidates: ScoredProduct[]): string {
  const context = candidates.map(serializeProduct).join('\n');
  return `PRODUCT DATA:\n${context}\n\nUSER QUESTION: ${question}`;
}

// ─── Heuristic fallback answer ───────────────────────────────────────────────

function heuristicAnswer(question: string, candidates: ScoredProduct[]): string {
  if (candidates.length === 0) {
    return `I couldn't find any products in our database matching "${question}". Try rephrasing with a brand, feature, or budget (e.g. "best camera phone under $600").`;
  }

  const lines: string[] = ['Here are the top matches from our data:', ''];
  for (const p of candidates.slice(0, 3)) {
    const qs = p.quickSpecs || {};
    const keySpec =
      qs.camera || qs.mainCamera || qs.battery || qs.display || qs.screen || '';
    lines.push(
      `**${p.brand} ${p.name}** — est. $${p.basePrice} launch price (${p.rating}/5)` +
        (keySpec ? ` — ${keySpec}` : '')
    );
    if (p.matchReasons.length > 0) {
      lines.push(`  - ${p.matchReasons.join('; ')}`);
    }
    lines.push('');
  }
  if (candidates.length > 3) {
    lines.push(`Plus ${candidates.length - 3} more match${candidates.length > 4 ? 'es' : ''} below.`);
  }
  return lines.join('\n');
}

// ─── Orchestrator: Groq → Gemini → local heuristics ─────────────────────────

export async function answerQuestion(question: string): Promise<AnswerResult> {
  const candidates = smartSearch(question).slice(0, 8);
  const products: Product[] = candidates.map(({ relevanceScore, matchReasons, ...p }) => p);

  if (candidates.length === 0) {
    return { answer: heuristicAnswer(question, candidates), products, source: 'local' };
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildPrompt(question, candidates) },
  ];

  // Hard cost cap: when the shared daily LLM budget is spent, skip the
  // paid providers entirely and answer with the free local engine.
  if (consumeLlmBudget()) {
    try {
      const answer = await askGroq(messages);
      return { answer, products, source: 'groq' };
    } catch {
      // Groq unavailable/failed — try Gemini
    }

    if (consumeLlmBudget()) {
      try {
        const answer = await askGemini(`${SYSTEM_PROMPT}\n\n${messages[1].content}`);
        return { answer, products, source: 'gemini' };
      } catch {
        // Gemini unavailable/failed — local heuristic answer
      }
    }
  }

  return { answer: heuristicAnswer(question, candidates), products, source: 'local' };
}
