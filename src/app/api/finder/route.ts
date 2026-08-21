import { NextRequest, NextResponse } from "next/server";
import { parseFinderState } from "@/app/advanced-finder/finder-shared";
import { runFinder } from "@/app/advanced-finder/finder-server";
import { captureError } from "@/lib/monitoring";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const state = parseFinderState((k) => sp.get(k));
    const parsedLimit = parseInt(sp.get("limit") || "60", 10);
    const limit = Math.min(100, Math.max(1, Number.isFinite(parsedLimit) ? parsedLimit : 60));

    const { results, total } = runFinder(state, limit);

    return NextResponse.json(
      { results, total },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    await captureError(error, { route: '/api/finder', operation: 'run-finder' });
    return NextResponse.json({ results: [], total: 0 }, { status: 500 });
  }
}
