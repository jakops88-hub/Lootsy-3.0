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

const BASE = (process.env.ADREVENUE_API_BASE || 'https://addrevenue.io/api/v2').replace(/\/+$/, '');
const KEY  = (process.env.ADREVENUE_API_KEY || '').trim();
const CHANNEL_ID = (process.env.ADREVENUE_CHANNEL_ID || '').trim(); // valfri men ger trackingLink
const PROGRAM_FILTER = (process.env.ADRECORD_PROGRAM_IDS || '')
  .split(',').map(s => s.trim()).filter(Boolean); // låt vara om du vill filtrera senare

function bearerHeaders(): Headers {
  const h = new Headers();
  h.set('Accept', 'application/json');
  h.set('Authorization', `Bearer ${KEY}`);
  return h;
}

async function getChannelId(): Promise<string | null> {
  if (CHANNEL_ID) return CHANNEL_ID;
  try {
    const res = await fetchWithTimeout(`${BASE}/channels`, { headers: bearerHeaders() }, 12000);
    if (!res.ok) return null;
    const body: any = await safeJson(res);
    const list = Array.isArray(body?.results) ? body.results : Array.isArray(body) ? body : [];
    const first = list[0];
    return first ? String(first.id) : null;
  } catch {
    return null;
  }
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

async function fetchAdrevenue(): Promise<{ deals: RawDeal[]; debug: any }> {
  if (!KEY) {
    // fallback → sample om ingen nyckel
    const deals = SAMPLE_DEALS.map(d => ({
      source: 'sample', source_id: d.source_id, title: d.title,
      description: d.description ?? null, category: d.category ?? null,
      price: d.price ?? null, currency: d.currency ?? 'SEK',
      link_url: d.link_url, image_url: d.image_url ?? null,
    }));
    return { deals, debug: { reason: 'missing_key' } };
  }

  // 1) välj kanal (för trackingLink i /campaigns)
  const chId = await getChannelId();

  // 2) hämta kampanjer (deals)
  const url = chId ? `${BASE}/campaigns?channelId=${encodeURIComponent(chId)}` : `${BASE}/campaigns`;
  try {
    const res = await fetchWithTimeout(url, { headers: bearerHeaders() }, 15000);
    const body: any = await safeJson(res);
    if (!res.ok) {
      return { deals: [], debug: { status: res.status, bodySample: typeof body === 'string' ? body.slice(0,200) : JSON.stringify(body).slice(0,200) } };
    }
    // Addrevenue svarar enligt docs: { http_code, count, results: [...] }
    let items: any[] = Array.isArray(body?.results) ? body.results : Array.isArray(body) ? body : [];
    if (PROGRAM_FILTER.length) {
      items = items.filter((x: any) => PROGRAM_FILTER.includes(String(x.programId ?? x.advertiserId ?? x.id)));
    }
    const mapped = mapCampaigns(items);
    return { deals: mapped, debug: { path: '/campaigns', channelId: chId, count: mapped.length } };
  } catch (e: any) {
    return { deals: [], debug: { error: String(e?.message || e), tried: url } };
  }
}

export async function fetchAllAffiliateDeals(): Promise<RawDeal[]> {
  const { deals } = await fetchAdrevenue();
  if (deals.length) return deals;

  // fallback → sample-deals
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

// Exponera debug-funktion till /api/debug/adrevenue
export const __debug_adrevenue = fetchAdrevenue;


