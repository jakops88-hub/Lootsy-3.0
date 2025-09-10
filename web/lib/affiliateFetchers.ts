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

const API_KEY = (process.env.ADREVENUE_API_KEY || '').trim();
const CHANNEL_ID = (process.env.ADREVENUE_CHANNEL_ID || '').trim();
const ENV_BASE = (process.env.ADREVENUE_API_BASE || '').trim().replace(/\/+$/, '');
const PROGRAM_FILTER = (process.env.ADRECORD_PROGRAM_IDS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

const DOMAIN_CANDIDATES = [
  // använd env först om den ser rimlig ut
  ...(ENV_BASE && /(adrevenue\.com|addrevenue\.io)/.test(ENV_BASE) ? [ENV_BASE] : []),
  'https://api.adrevenue.com/v2',
  'https://addrevenue.io/api/v2',
];

type AuthStyle = 'bearer' | 'xkey';
function buildHeaders(style: AuthStyle): Headers {
  const h = new Headers();
  h.set('Accept', 'application/json');
  if (style === 'bearer') h.set('Authorization', `Bearer ${API_KEY}`);
  else h.set('X-Api-Key', API_KEY);
  return h;
}

async function tryEndpoint(base: string, path: string, style: AuthStyle) {
  const url = `${base}${path}`;
  const res = await fetchWithTimeout(url, { headers: buildHeaders(style) }, 15000);
  const body = await safeJson(res);
  return { url, status: res.status, ok: res.ok, body };
}

function mapCampaigns(items: any[]): RawDeal[] {
  return (items || []).map((c: any) => ({
    source: 'adrevenue',
    source_id: String(c.id ?? c.campaignId ?? Math.random().toString(36).slice(2)),
    title: String(c.title ?? c.description ?? 'Kampanj'),
    description: c.longDescription ?? c.description ?? null,
    category: c.category ?? c.program ?? null,
    price: null,
    currency: 'SEK',
    link_url: c.trackingLink || c.url || '#',
    image_url: c.imageUrl || c.image || c.logo || null,
  }));
}

export async function fetchAllAffiliateDeals(): Promise<RawDeal[]> {
  const { deals } = await __debug_adrevenue();
  if (deals.length) return deals;

  // fallback → sample
  return SAMPLE_DEALS.map(d => ({
    source: 'sample',
    source_id: d.source_id,
    title: d.title,
    description: d.description ?? null,
    category: d.category ?? null,
    price: d.price ?? null,
    currency: d.currency ?? 'SEK',
    link_url: d.link_url,
    image_url: d.image_url ?? null,
  }));
}

// Exponeras till debug-route
// ----- Längst ned i filen: robust debug + main -----

export async function __debug_adrevenue() {
  const API_KEY = (process.env.ADREVENUE_API_KEY || '').trim();
  const CHANNEL_ID = (process.env.ADREVENUE_CHANNEL_ID || '').trim();
  const ENV_BASE = (process.env.ADREVENUE_API_BASE || '').trim().replace(/\/+$/, '');

  const bases = [];
  if (ENV_BASE && /(adrevenue\.com|addrevenue\.io)/.test(ENV_BASE)) bases.push(ENV_BASE);
  bases.push('https://api.adrevenue.com/v2', 'https://addrevenue.io/api/v2');

  const attempts: any[] = [];

  if (!API_KEY) {
    return { deals: [], debug: { reason: 'missing_key' }, attempts };
  }

  function headers(style: 'bearer' | 'xkey') {
    const h = new Headers();
    h.set('Accept', 'application/json');
    if (style === 'bearer') h.set('Authorization', `Bearer ${API_KEY}`);
    else h.set('X-Api-Key', API_KEY);
    return h;
  }

  async function tryFetch(base: string, path: string, style: 'bearer' | 'xkey') {
    const url = `${base}${path}`;
    try {
      const r = await fetch(url, { headers: headers(style), cache: 'no-store' });
      const txt = await r.text();
      let body: any; try { body = JSON.parse(txt); } catch { body = txt; }
      attempts.push({
        base, style, path, url, status: r.status, ok: r.ok,
        bodySample: typeof body === 'string' ? body.slice(0, 200) : JSON.stringify(body).slice(0, 200),
      });
      return { ok: r.ok, status: r.status, body, url };
    } catch (e: any) {
      attempts.push({ base, style, path, url, error: String(e?.message || e) });
      return { ok: false, status: 0, body: null, url };
    }
  }

  for (const base of bases) {
    for (const style of ['bearer', 'xkey'] as const) {
      // 1) channels – för att få kanal och testa auth/domän
      let channelId = CHANNEL_ID;
      const ch = await tryFetch(base, '/channels', style);
      if (ch.ok) {
        const arr = Array.isArray((ch.body as any)?.results)
          ? (ch.body as any).results
          : Array.isArray(ch.body) ? ch.body : [];
        if (!channelId && arr[0]?.id) channelId = String(arr[0].id);
      }
      // 2) campaigns – själva dealsen
      const path = channelId ? `/campaigns?channelId=${encodeURIComponent(channelId)}` : '/campaigns';
      const ca = await tryFetch(base, path, style);
      if (ca.ok) {
        let items: any[] = Array.isArray((ca.body as any)?.results)
          ? (ca.body as any).results
          : Array.isArray(ca.body) ? ca.body : [];
        const deals = (items || []).map((c: any) => ({
          source: 'adrevenue',
          source_id: String(c.id ?? c.campaignId ?? Math.random().toString(36).slice(2)),
          title: String(c.title ?? c.description ?? 'Kampanj'),
          description: c.longDescription ?? c.description ?? null,
          category: c.category ?? c.program ?? null,
          price: null,
          currency: 'SEK',
          link_url: c.trackingLink || c.url || '#',
          image_url: c.imageUrl || c.image || c.logo || null,
        }));
        if (deals.length) {
          return { deals, debug: { base, style, path, count: deals.length }, attempts };
        }
      }
    }
  }

  return { deals: [], debug: { reason: 'no_success' }, attempts };
}

export async function fetchAllAffiliateDeals() {
  const { deals } = await __debug_adrevenue();
  if (deals.length) return deals;

  // Fallback → sample
  return SAMPLE_DEALS.map(d => ({
    source: 'sample',
    source_id: d.source_id,
    title: d.title,
    description: d.description ?? null,
    category: d.category ?? null,
    price: d.price ?? null,
    currency: d.currency ?? 'SEK',
    link_url: d.link_url,
    image_url: d.image_url ?? null,
  }));
}
