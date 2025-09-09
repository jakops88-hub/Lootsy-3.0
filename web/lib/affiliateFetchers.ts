// web/lib/affiliateFetchers.ts
import { SAMPLE_DEALS } from './sampleData';
import { fetchWithTimeout, safeJson } from './http';

export type RawDeal = {
  source: string;
  source_id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  price?: number | null;
  currency?: string | null;
  link_url: string;
  image_url?: string | null;
};

const BASE = (process.env.ADRECORD_API_BASE || 'https://api.adrecord.com/v2').replace(/\/+$/,'');
const KEY  = (process.env.ADRECORD_API_KEY || '').trim();
const PROGRAM_FILTER = (process.env.ADRECORD_PROGRAM_IDS || '')
  .split(',').map(s=>s.trim()).filter(Boolean);

// — helper: try multiple header styles (Bearer + X-Api-Key)
function buildHeader(style: 'bearer'|'xkey') {
  return style === 'bearer'
    ? { Authorization: `Bearer ${KEY}`, Accept: 'application/json' }
    : { 'X-Api-Key': KEY, Accept: 'application/json' };
}

async function tryFetch(path: string): Promise<{items:any[], trace:any}> {
  const urls = [`${BASE}${path}`, `${BASE}${path}/`]; // handle trailing slash
  const styles: Array<'bearer'|'xkey'> = ['bearer','xkey'];
  const trace: any[] = [];
  for (const u of urls) {
    for (const style of styles) {
      try {
        const res = await fetchWithTimeout(u, { headers: buildHeader(style) }, 12000);
        const body = await safeJson(res);
        trace.push({ url:u, style, status: res.status, ok: res.ok, bodySample: typeof body==='string'? body.slice(0,200): JSON.stringify(body).slice(0,200) });
        if (!res.ok) continue;
        const candidates = ['data','offers','programs','products','items','results'];
        let arr: any[] = [];
        for (const k of candidates) {
          if (Array.isArray((body as any)?.[k])) { arr = (body as any)[k]; break; }
        }
        if (!arr.length && Array.isArray(body)) arr = body;
        return { items: arr, trace };
      } catch (e:any) {
        trace.push({ url:u, style, error: String(e?.message || e) });
        continue;
      }
    }
  }
  return { items: [], trace };
}

function applyProgramFilter(items: any[]) {
  if (!PROGRAM_FILTER.length) return items;
  return items.filter((o:any) =>
    PROGRAM_FILTER.includes(String(o.programId ?? o.program_id ?? o.advertiserId ?? o.id))
  );
}

function mapGeneric(items:any[], src='adrevenue'): RawDeal[] {
  return (items||[]).map((o:any)=>({
    source: src,
    source_id: String(o.id ?? o.offer_id ?? o.programId ?? o.productId ?? cryptoRand()),
    title: String(o.title ?? o.name ?? o.productName ?? 'Erbjudande'),
    description: o.description ?? o.summary ?? o.shortDescription ?? null,
    category: o.category ?? o.vertical ?? o.programCategory ?? null,
    price: typeof o.price==='number' ? o.price : null,
    currency: (o.currency || 'SEK') as string,
    link_url: o.tracking_url || o.trackingUrl || o.url || '#',
    image_url: o.image || o.imageUrl || o.logo || null,
  }));
}

function cryptoRand(){ return Math.random().toString(36).slice(2); }

async function fetchAdrevenue(): Promise<{deals:RawDeal[], debug:any}> {
  if (!KEY) {
    const deals = SAMPLE_DEALS.map(d=>({
      source:'sample', source_id:d.source_id, title:d.title,
      description:d.description ?? null, category:d.category ?? null,
      price:d.price ?? null, currency:d.currency ?? 'SEK',
      link_url:d.link_url, image_url:d.image_url ?? null
    }));
    return { deals, debug: { reason: 'missing_key' } };
  }

  const paths = ['/offers','/programs','/products'];
  const globalTrace:any[] = [];
  for (const p of paths) {
    const { items, trace } = await tryFetch(p);
    globalTrace.push({ path:p, trace });
    if (items.length) {
      const filtered = applyProgramFilter(items);
      const mapped   = mapGeneric(filtered, 'adrevenue');
      return { deals: mapped, debug: { path: p, tried: globalTrace } };
    }
  }
  return { deals: [], debug: { path: null, tried: globalTrace } };
}

export async function fetchAllAffiliateDeals(): Promise<RawDeal[]> {
  const { deals } = await fetchAdrevenue();
  if (deals.length) return deals;
  // fallback
  return SAMPLE_DEALS.map(d=>({
    source:'sample', source_id:d.source_id, title:d.title,
    description:d.description ?? null, category:d.category ?? null,
    price:d.price ?? null, currency:d.currency ?? 'SEK',
    link_url:d.link_url, image_url:d.image_url ?? null
  }));
}

export const __debug_adrevenue = fetchAdrevenue; // for debug route

