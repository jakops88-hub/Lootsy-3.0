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

async function fetchAdrecord(): Promise<RawDeal[]> {
  const base = process.env.ADRECORD_API_BASE;
  const key = process.env.ADRECORD_API_KEY;
  if (!base || !key) return SAMPLE_DEALS;
  try {
    const r = await fetch(`${base}/v1/offers`, { headers: { Authorization: `Bearer ${key}` } });
    const data = await r.json();
    return (data || []).map((o: any) => ({
      source: 'adrecord',
      source_id: String(o.id),
      title: o.title,
      description: o.description ?? null,
      category: o.category ?? null,
      price: o.price ?? null,
      currency: o.currency ?? 'SEK',
      link_url: o.trackingUrl || o.url,
      image_url: o.image || null
    }));
  } catch { return SAMPLE_DEALS; }
}

async function fetchTradedoubler(): Promise<RawDeal[]> {
  const base = process.env.TRADEDOUBLER_API_BASE;
  const key = process.env.TRADEDOUBLER_API_KEY;
  if (!base || !key) return [];
  try {
    const r = await fetch(`${base}/v1/deals`, { headers: { Authorization: `Bearer ${key}` } });
    const data = await r.json();
    return (data.items || []).map((o: any) => ({
      source: 'tradedoubler',
      source_id: String(o.id),
      title: o.title,
      description: o.description ?? null,
      category: o.category ?? null,
      price: o.price ?? null,
      currency: o.currency ?? 'SEK',
      link_url: o.trackingUrl || o.url,
      image_url: o.image || null
    }));
  } catch { return []; }
}

async function fetchAmazon(): Promise<RawDeal[]> {
  // Placeholder – implement PA-API signing if needed
  return [];
}

export async function fetchAllAffiliateDeals(): Promise<RawDeal[]> {
  const [a,b,c] = await Promise.all([fetchAdrecord(), fetchTradedoubler(), fetchAmazon()]);
  const merged = [...a, ...b, ...c];
  return merged.length ? merged : SAMPLE_DEALS;
}
