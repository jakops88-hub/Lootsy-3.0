import { NextResponse } from 'next/server';
import { fetchAllAffiliateDeals } from '@/lib/affiliateFetchers';
import { optimizeDealsWithAI } from '@/lib/optimizer';
import { upsertDeals } from '@/lib/db';

export async function GET() {
  try {
    const raw = await fetchAllAffiliateDeals();
    const optimized = await optimizeDealsWithAI(raw);
    if (!optimized.some(d=>d.is_featured)) {
      let idx = 0, max = -1;
      optimized.forEach((d,i)=>{ const s = Number(d.score||0); if (s>max){max=s; idx=i;} });
      if (optimized[idx]) optimized[idx].is_featured = true;
    }
    await upsertDeals(optimized);
    return NextResponse.json({ ok: true, count: optimized.length });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
