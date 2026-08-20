import { NextRequest, NextResponse } from 'next/server';
import { smartSearch, type FinderFilters } from '@/lib/ai-heuristics';
// import { generateEmbedding } from '@/lib/embeddings'; // disabled until pgvector is wired up

// ─── Types ───────────────────────────────────────────────────────────────────

interface FinderRequest {
  query: string;
  filters?: FinderFilters;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FinderRequest;
    const { query, filters } = body;

    if (!query || typeof query !== 'string' || query.length > 500) {
      return NextResponse.json({ error: 'Query must be 1-500 characters' }, { status: 400 });
    }

    let method: 'hybrid' | 'keyword' = 'keyword';

    // Embedding-based search disabled until pgvector is wired up.
    // Only call generateEmbedding when HUGGINGFACE_API_KEY is set and pgvector is available.
    // if (query && process.env.HUGGINGFACE_API_KEY) {
    //   const embedding = await generateEmbedding(query);
    //   if (embedding) { method = 'hybrid'; }
    // }

    // Smart keyword/score-based search (always works)
    const results = smartSearch(query || '', filters);

    return NextResponse.json(
      { results, method },
      {
        headers: { 'Cache-Control': 'private, max-age=60' },
      }
    );
  } catch (error) {
    console.error('[AI Finder] Error:', error);
    return NextResponse.json(
      { error: 'Search failed. Please try again.' },
      { status: 500 }
    );
  }
}
