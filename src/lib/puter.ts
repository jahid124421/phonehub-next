// Puter.js User-Pays — browser-side LLM. $0 server cost: user's own Puter account is billed.
// Docs: https://docs.puter.com — window.puter.ai.chat(prompt, { model, stream })
// Fallback chain remains: Puter (client) → Groq (server) → Gemini (server) → heuristic

export type PuterSource = 'puter';

declare global {
  interface Window {
    puter?: {
      ai?: {
        chat: (
          prompt: string,
          opts?: { model?: string; stream?: boolean }
        ) => Promise<string | { message?: { content?: string }; toString(): string }>;
      };
      auth?: {
        signIn: () => Promise<unknown>;
        isSignedIn: () => boolean;
      };
    };
  }
}

export function isPuterAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.puter?.ai?.chat === 'function';
}

export function isPuterSignedIn(): boolean {
  try {
    return window.puter?.auth?.isSignedIn?.() ?? false;
  } catch {
    return false;
  }
}

const PUTER_MODEL = 'claude-sonnet-4'; // Puter supports many; Sonnet is a good default

export async function askPuter(question: string, context?: string): Promise<string> {
  if (!isPuterAvailable()) throw new Error('Puter not available');
  const prompt = context
    ? `${context}\n\nUSER QUESTION: ${question}`
    : question;

  // Puter may return string or object; normalize to string
  const raw = await window.puter!.ai!.chat(prompt, { model: PUTER_MODEL });
  if (typeof raw === 'string') return raw.trim();
  if (raw && typeof raw === 'object') {
    const maybe = raw as { message?: { content?: string } };
    if (maybe.message?.content) return maybe.message.content.trim();
    return String(raw).trim();
  }
  throw new Error('Puter returned empty response');
}

export async function ensurePuterAuth(): Promise<void> {
  if (!isPuterAvailable()) throw new Error('Puter not available');
  if (isPuterSignedIn()) return;
  // Trigger Puter sign-in modal — user pays with their Puter account
  await window.puter!.auth?.signIn();
}
