// web/app/api/sync/route.ts
import { NextResponse } from 'next/server';
import { fetchAllAffiliateDeals } from '@/lib/affiliateFetchers';
import { optimizeDealsWithAI } from '@/lib/optimizer';
import { upsertDeals } from '@/lib/db';
import { normalizeAll, ensureOneFeatured } from '@/lib/normalize';

export async function GET() {
  try {
    // 1) hämta
    const raw = await fetchAllAffiliateDeals();

    // 2) AI-optimering (kan kasta om API är slut)
    let optimized = await optimizeDealsWithAI(raw);

    // 3) defensiv normalisering (fixar "is featured", SEK, bild, m.m.)
    optimized = ensureOneFeatured(normalizeAll(optimized));

    // 4) skriv till DB
    await upsertDeals(optimized);

    return NextResponse.json({ ok: true, count: optimized.length });
  } catch (e: any) {
    console.error('SYNC_ERROR', e?.message || e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
