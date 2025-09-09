// web/app/api/debug/adrevenue/route.ts
import { NextResponse } from 'next/server';
import { fetchAllAffiliateDeals } from '@/lib/affiliateFetchers';

export async function GET() {
  try {
    const deals = await fetchAllAffiliateDeals();
    const sample = deals.slice(0, 5).map(d => ({
      source: d.source,
      source_id: d.source_id,
      title: d.title,
      link_url: d.link_url,
      image_url: d.image_url,
      category: d.category,
      currency: d.currency,
      price: d.price ?? null,
    }));
    return NextResponse.json({ ok: true, count: deals.length, sample });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
