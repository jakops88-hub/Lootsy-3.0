// web/lib/normalize.ts
type AnyDeal = Record<string, any>;

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=60";

function cleanUrl(u?: string | null) {
  if (!u) return null;
  try {
    const url = new URL(u);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
    return null;
  } catch {
    return null;
  }
}

export function normalizeDeal(d: AnyDeal, index = 0): AnyDeal {
  // Tillåt “is featured”, “is_featured”, mm
  const isFeaturedRaw =
    d.is_featured ?? d["is featured"] ?? d.isFeatured ?? false;

  // Validera valuta
  const currency =
    String(d.currency || "").trim().toUpperCase() === "SEK" ? "SEK" : "SEK";

  // Säkra score och featured
  const score =
    typeof d.score === "number" && isFinite(d.score) ? d.score : 50;

  // Fixa bild-url
  const img = cleanUrl(d.image_url) || PLACEHOLDER_IMG;

  return {
    source: String(d.source || "unknown"),
    source_id: String(d.source_id || index),
    title: String(d.title || "Okänd produkt"),
    description: d.description ?? null,
    category: d.category ?? null,
    price:
      typeof d.price === "number" && isFinite(d.price) ? d.price : null,
    currency,
    link_url: cleanUrl(d.link_url) || "#",
    image_url: img,
    score,
    is_featured: Boolean(isFeaturedRaw),
  };
}

export function normalizeAll(deals: AnyDeal[]): AnyDeal[] {
  return deals.map((d, i) => normalizeDeal(d, i));
}

export function ensureOneFeatured(deals: AnyDeal[]): AnyDeal[] {
  if (deals.some((d) => d.is_featured)) return deals;
  // markera högsta score som featured
  let idx = 0,
    max = -1;
  deals.forEach((d, i) => {
    const s = Number(d.score || 0);
    if (s > max) {
      max = s;
      idx = i;
    }
  });
  if (deals[idx]) deals[idx].is_featured = true;
  return deals;
}
