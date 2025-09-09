// web/lib/affiliateFetchers.ts
import { SAMPLE_DEALS } from './sampleData';

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

const BASE = process.env.ADRECORD_API_BASE || 'https://api.adrecord.com/v2';
const KEY  = process.env.ADRECORD_API_KEY || '';
const PROGRAM_FILTER = (process.env.ADRECORD_PROGRAM_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

async function fetchJson(url: string) {
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${KEY}`,
      Accept: 'application/json'
    }
  });
  const text = await r.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* leave as string */ }
  return { ok: r.ok, status: r.status, json, text };
}

function mapGeneric(items: any[], src = 'adrevenue'): RawDeal[] {
  return (items || []).map((o: any) => ({
    source: src,
    source_id: String(o.id ?? o.offer_id ?? o.programId ?? o.productId ?? Math.random().toString(36).slice(2)),
    title: String(o.title ?? o.name ?? o.productName ?? 'Erbjudande'),
    description: o.description ?? o.summary ?? o.shortDescription ?? null,
    category: o.category ?? o.vertical ?? o.programCategory ?? null,
    price: typeof o.price === 'number' ? o.price : null,
    currency: (o.currency || 'SEK') as string,
    link_url: o.tracking_url || o.trackingUrl || o.url || '#',
    image_url: o.image || o.imageUrl || o.logo || null,
  }));
}

function applyProgramFilter(items: any[]): any[] {
  if (!PROGRAM_FILTER.length) return items;
  return items.filter(
    (o: any) =>
      PROGRAM_FILTER.includes(String(o.programId ?? o.program_id ?? o.id))
  );
}

async function tryEndpoint(path: string, dataKeyCandidates: string[]): Promise<RawDeal[]> {
  if (!KEY) return [];
  const { ok, status, json, text } = await fetchJson(`${BASE}${path}`);
  if (!ok) {
    console.error(`[Adrevenue] ${path} ${status}:`, typeof json === 'object' ? json : text);
    return [];
  }
  let items: any[] = [];
  for (const k of dataKeyCandidates) {
    if (Array.isArray((json || {})[k])) { items = json[k]; break; }
  }
  if (!items.length && Array.isArray(json)) items = json;
  items = applyProgramFilter(items);
  const mapped = mapGeneric(items, 'adrevenue');
  console.log(`[Adrevenue] ${path} -> ${mapped.length} items`);
  return mapped;
}

// Main fetcher – testar flera kända endpoints
async function fetchAdrevenue(): Promise<RawDeal[]> {
  if (!KEY) {
    console.warn('⚠️ ADRECORD_API_KEY saknas – använder SAMPLE_DEALS.');
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
  // Prova kända vägar; lägg gärna till fler om din dokumentation säger annat
  const order: Array<[string, string[]]> = [
    ['/offers',      ['data', 'offers']],
    ['/programs',    ['data', 'programs']],
    ['/products',    ['data', 'products']],
  ];
  for (const [path, keys] of order) {
    const rows = await tryEndpoint(path, keys);
    if (rows.length) return rows;
  }
  return [];
}

// Placeholder för andra nätverk
async function fetchTradedoubler(): Promise<RawDeal[]> { return []; }
async function fetchAmazon(): Promise<RawDeal[]> { return []; }

export async function fetchAllAffiliateDeals(): Promise<RawDeal[]> {
  const [adrevenue, tradedoubler, amazon] = await Promise.all([
    fetchAdrevenue(),
    fetchTradedoubler(),
    fetchAmazon(),
  ]);
  const merged = [...adrevenue, ...tradedoubler, ...amazon];
  if (!merged.length) {
    console.warn('⚠️ Inga affiliate-deals – fallback till SAMPLE_DEALS.');
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
  return merged;
}

