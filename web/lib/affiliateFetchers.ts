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

// --- Adrevenue / Adrecord ---
async function fetchAdrecord(): Promise<RawDeal[]> {
  const base = process.env.ADRECORD_API_BASE;
  const key = process.env.ADRECORD_API_KEY;

  if (!base || !key) {
    console.warn('⚠️ ADRECORD env saknas – kör SAMPLE_DEALS istället.');
    return SAMPLE_DEALS.map((d) => ({
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

  try {
    // NOTE: Exempel-endpoint. Justera om din dokumentation säger annat (t.ex. /offers eller /products)
    const url = `${base}/offers`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      // ibland kräver API:t accept-header:
      // headers: { Authorization: `Bearer ${key}`, 'Accept': 'application/json' }
    });

    if (!r.ok) {
      console.error('Adrecord fetch fel:', r.status, await r.text());
      return [];
    }
    const json = await r.json();

    // Anpassa mappingen till hur deras svar ser ut.
    // Nedan är en säker standard för vanliga fält:
    const items = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
    return items.map((o: any) => ({
      source: 'adrevenue',
      source_id: String(o.id ?? o.offer_id ?? o.programId ?? cryptoRandom()),
      title: String(o.title ?? o.name ?? 'Erbjudande'),
      description: o.description ?? o.summary ?? null,
      category: o.category ?? o.vertical ?? null,
      price: o.price ?? null,
      currency: (o.currency || 'SEK') as string,
      link_url: o.tracking_url || o.trackingUrl || o.url || '#',
      image_url: o.image || o.logo || null,
    }));
  } catch (e) {
    console.error('Adrecord/Adrevenue API error:', e);
    return [];
  }
}

// Placeholder för andra nätverk (kan byggas ut senare)
async function fetchTradedoubler(): Promise<RawDeal[]> {
  return [];
}
async function fetchAmazon(): Promise<RawDeal[]> {
  return [];
}

function cryptoRandom() {
  // fallback id om inget finns i svaret
  return Math.random().toString(36).slice(2);
}

export async function fetchAllAffiliateDeals(): Promise<RawDeal[]> {
  const [adrevenue, tradedoubler, amazon] = await Promise.all([
    fetchAdrecord(),
    fetchTradedoubler(),
    fetchAmazon(),
  ]);

  const merged = [...adrevenue, ...tradedoubler, ...amazon];

  // Fallback om API:t inte gav något
  if (!merged.length) {
    return SAMPLE_DEALS.map((d) => ({
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

