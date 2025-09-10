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
export async function __debug_adrevenue() {
  const attempts: any[] = [];
  if (!API_KEY) {
    return { deals: [], debug: { reason: 'missing_key' }, attempts };
  }

  for (const base of DOMAIN_CANDIDATES) {
    for (const style of ['bearer', 'xkey'] as AuthStyle[]) {
      try {
        // 1) Hämta kanaler (verifiera auth och domän)
        const ch = await tryEndpoint(base, '/channels', style);
        attempts.push({ step: 'channels', base, style, status: ch.status, ok: ch.ok });

        let channelId = CHANNEL_ID;
        if (ch.ok) {
          const list = Array.isArray((ch.body as any)?.results)
            ? (ch.body as any).results
            : Array.isArray(ch.body) ? ch.body : [];
          if (!channelId && list[0]?.id) channelId = String(list[0].id);
        }

        // 2) Hämta kampanjer
        const path = channelId ? `/campaigns?channelId=${encodeURIComponent(channelId)}` : '/campaigns';
        const camp = await tryEndpoint(base, path, style);
        attempts.push({
          step: 'campaigns', base, style, url: camp.url, status: camp.status, ok: camp.ok,
          bodySample: typeof camp.body === 'string' ? camp.body.slice(0, 200)
            : JSON.stringify(camp.body).slice(0, 200),
        });

        if (camp.ok) {
          let items: any[] = Array.isArray((camp.body as any)?.results)
            ? (camp.body as any).results
            : Array.isArray(camp.body) ? camp.body : [];
          if (PROGRAM_FILTER.length) {
            items = items.filter((x: any) =>
              PROGRAM_FILTER.includes(String(x.programId ?? x.advertiserId ?? x.id)));
          }
          const deals = mapCampaigns(items);
          if (deals.length) return { deals, debug: { base, style, path, count: deals.length }, attempts };
        }
      } catch (e: any) {
        attempts.push({ step: 'exception', base, style, error: String(e?.message || e) });
      }
    }
  }
  return { deals: [], debug: { reason: 'no_success' }, attempts };
}



