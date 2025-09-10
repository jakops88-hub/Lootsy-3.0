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

// ---- ENV
const ENV_BASE   = (process.env.ADREVENUE_API_BASE || '').trim().replace(/\/+$/, '');
const API_KEY    = (process.env.ADREVENUE_API_KEY || '').trim();
const CHANNEL_ID = (process.env.ADREVENUE_CHANNEL_ID || '').trim();
const PROGRAM_FILTER = (process.env.ADRECORD_PROGRAM_IDS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

// ---- Bas-domäner att prova (env först om den ser rimlig ut)
const BASES: string[] = [];
if (ENV_BASE && /(adrevenue\.com|addrevenue\.io)/.test(ENV_BASE)) BASES.push(ENV_BASE);
BASES.push('https://api.adrevenue.com/v2', 'https://addrevenue.io/api/v2');

// ---- Helpers
function headers(style: 'bearer' | 'xkey') {
  const h = new Headers();
  h.set('Accept', 'application/json');
  if (style === 'bearer') h.set('Authorization', `Bearer ${API_KEY}`);
  else h.set('X-Api-Key', API_KEY);
  return h;
}

async function tryFetch(base: string, path: string, style: 'bearer' | 'xkey') {
  const url = `${base}${path}`;
  const res = await fetchWithTimeout(url, { headers: headers(style), cache: 'no-store' }, 15000);
  const body = await safeJson(res);
  return { url, status: res.status, ok: res.ok, body };
}

function mapCampaigns(items: any[]): RawDeal[] {
  const FALLBACK_IMG =
    'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&w=1200&q=60';

  return (items || []).map((c: any) => {
    const title =
      (typeof c.title === 'string' && c.title.trim()) ||
      (typeof c.description === 'string' && c.description.trim()) ||
      'Kampanj';

    const link = c.trackingLink || c.url || '#';

    const img =
      (typeof c.imageUrl === 'string' && c.imageUrl) ||
      (typeof c.image === 'string' && c.image) ||
      (typeof c.logo === 'string' && c.logo) ||
      FALLBACK_IMG;

    const cat = c.category || c.vertical || c.program || null;

    return {
      source: 'adrevenue',
      source_id: String(c.id ?? c.campaignId ?? Math.random().toString(36).slice(2)),
      title,
      description: c.longDescription ?? c.description ?? null,
      category: cat,
      price: null,
      currency: 'SEK',
      link_url: link,
      image_url: img,
    };
  });
}

// -------- DEBUG FETCH (används av /api/debug/adrevenue)
export async function __debug_adrevenue() {
  const attempts: any[] = [];

  if (!API_KEY) {
    return { deals: [], debug: { reason: 'missing_key' }, attempts };
  }

  for (const base of BASES) {
    for (const style of ['bearer', 'xkey'] as const) {
      // 1) Hämta kanaler (för att verifiera auth + ev. få channelId)
      let channelId = CHANNEL_ID;
      try {
        const ch = await tryFetch(base, '/channels', style);
        attempts.push({
          step: 'channels', base, style, url: `${base}/channels`,
          status: ch.status, ok: ch.ok,
          bodySample: typeof ch.body === 'string' ? ch.body.slice(0, 200) : JSON.stringify(ch.body).slice(0, 200),
        });
        if (ch.ok && !channelId) {
          const arr = Array.isArray((ch.body as any)?.results)
            ? (ch.body as any).results
            : Array.isArray(ch.body) ? ch.body : [];
          if (arr[0]?.id) channelId = String(arr[0].id);
        }
      } catch (e: any) {
        attempts.push({ step: 'channels-exception', base, style, error: String(e?.message || e) });
      }

      // 2) Hämta kampanjer (deals)
      const path = channelId ? `/campaigns?channelId=${encodeURIComponent(channelId)}` : '/campaigns';
      try {
        const ca = await tryFetch(base, path, style);
        attempts.push({
          step: 'campaigns', base, style, url: ca.url,
          status: ca.status, ok: ca.ok,
          bodySample: typeof ca.body === 'string' ? ca.body.slice(0, 200) : JSON.stringify(ca.body).slice(0, 200),
        });

        if (ca.ok) {
          let items: any[] = Array.isArray((ca.body as any)?.results)
            ? (ca.body as any).results
            : Array.isArray(ca.body) ? ca.body : [];
          if (PROGRAM_FILTER.length) {
            items = items.filter((x: any) =>
              PROGRAM_FILTER.includes(String(x.programId ?? x.advertiserId ?? x.id)));
          }
          const deals = mapCampaigns(items);
          if (deals.length) {
            return { deals, debug: { base, style, path, count: deals.length }, attempts };
          }
        }
      } catch (e: any) {
        attempts.push({ step: 'campaigns-exception', base, style, path, error: String(e?.message || e) });
      }
    }
  }

  return { deals: [], debug: { reason: 'no_success' }, attempts };
}

// -------- HUVUDFUNCTION (ENDA exporten med detta namn)
export async function fetchAllAffiliateDeals(): Promise<RawDeal[]> {
  const { deals } = await __debug_adrevenue();
  if (deals.length) return deals;

  // fallback → sample-data
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

