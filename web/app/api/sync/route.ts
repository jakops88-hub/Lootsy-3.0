// web/app/api/sync/route.ts
import { NextResponse } from 'next/server';
import { fetchAllAffiliateDeals } from '@/lib/affiliateFetchers';
import { optimizeDealsWithAI, type DealIn, type DealOut } from '@/lib/optimizer';
import { upsertDeals } from '@/lib/db'; // eller '@/lib/supabase' beroende på din export

// --------------- helpers (typesäkra) ----------------

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&w=1200&q=60';

function normalizeAll(deals: DealOut[]): DealOut[] {
  return deals.map((d) => ({
    ...d,
    title: (d.title || '').toString().trim(),
    description: (d.description ?? null),
    category: (d.category ?? null),
    currency: d.currency ?? 'SEK',
    image_url:
      typeof d.image_url === 'string' && d.image_url.trim().length > 0
        ? d.image_url
        : FALLBACK_IMG,
    price: typeof d.price === 'number' ? d.price : null,
    score: typeof d.score === 'number' ? d.score : 50,
    is_featured: Boolean(d.is_featured),
  }));
}

function ensureOneFeatured(deals: DealOut[]): DealOut[] {
  if (deals.some((d) => d.is_featured)) return deals;
  if (deals.length === 0) return deals;
  return deals.map((d, i) => (i === 0 ? { ...d, is_featured: true } : d));
}

// --------------- main route ----------------

export async function GET() {
  try {
    // 1) Hämta råa deals från nätet (Adrevenue)
    const raw = await fetchAllAffiliateDeals();

    // Mappar RawDeal -> DealIn (samma fält men typesäkert)
    const input: DealIn[] = raw.map((d) => ({
      source: d.source,
      source_id: d.source_id,
      title: d.title,
      description: d.description ?? null,
      category: d.category ?? null,
      price: d.price ?? null,
      currency: d.currency ?? null,
      link_url: d.link_url,
      image_url: d.image_url ?? null,
    }));

    // 2) OpenAI-kategorisering/puts (eller keyword-fallback om ingen nyckel)
    const optimized: DealOut[] = await optimizeDealsWithAI(input);

    // 3) Defensiv normalisering + minst en featured
    const toStore: DealOut[] = ensureOneFeatured(normalizeAll(optimized));

    // 4) Skriv till DB (upsert på source+source_id)
    await upsertDeals(toStore);

    return NextResponse.json({ ok: true, count: toStore.length });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    );
  }
}
