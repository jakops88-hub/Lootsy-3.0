'use client';

import { useEffect, useMemo, useState } from 'react';

type Deal = {
  id?: string | number;
  source: string;
  source_id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  price?: number | null;
  currency?: string | null;
  link_url: string;
  image_url?: string | null;
  score?: number | null;
  is_featured?: boolean;
  created_at?: string | null;
  trending?: number | null;
};

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&w=1200&q=60';

function safeImg(src?: string | null) {
  return typeof src === 'string' && src.trim().length > 0 ? src : FALLBACK_IMG;
}

function fmtPrice(price?: number | null, currency?: string | null) {
  if (typeof price !== 'number') return '';
  const cur = currency || 'SEK';
  try {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price} ${cur}`;
  }
}

export default function Page() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/public/deals', { cache: 'no-store' });
        const data = await res.json();
        if (!data?.ok) throw new Error(data?.error || 'Kunde inte hämta deals.');
        if (mounted) setDeals(Array.isArray(data.deals) ? data.deals : []);
      } catch (e: any) {
        setErr(e?.message || 'Tekniskt fel');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Välj featured: i första hand is_featured; annars högst score/nyast
  const featured: Deal | null = useMemo(() => {
    if (!deals.length) return null;
    const withFeatured = deals.find((d) => d.is_featured);
    if (withFeatured) return withFeatured;
    const sorted = [...deals].sort((a, b) => {
      const sa = (a.score ?? 0);
      const sb = (b.score ?? 0);
      if (sb !== sa) return sb - sa;
      const ta = a.created_at ? Date.parse(a.created_at) : 0;
      const tb = b.created_at ? Date.parse(b.created_at) : 0;
      return tb - ta;
    });
    return sorted[0] || null;
  }, [deals]);

  // Trendande: sortera på trending/score/nyast och exkludera featured
  const trending: Deal[] = useMemo(() => {
    const rest = deals.filter(
      (d) => !(featured && (d.source === featured.source && d.source_id === featured.source_id))
    );
    const sorted = rest.sort((a, b) => {
      const ta = (a.trending ?? 0) + (a.score ?? 0) * 0.5;
      const tb = (b.trending ?? 0) + (b.score ?? 0) * 0.5;
      if (tb !== ta) return tb - ta;
      const da = a.created_at ? Date.parse(a.created_at) : 0;
      const db = b.created_at ? Date.parse(b.created_at) : 0;
      return db - da;
    });
    return sorted.slice(0, 8);
  }, [deals, featured]);

  // Lista alla kategorier (enkla, baserat på data)
  const categories = useMemo(() => {
    const set = new Set<string>();
    deals.forEach((d) => {
      const c = (d.category || 'Övrigt').trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'sv'));
  }, [deals]);

  // Filtrering och sökning för griden
  const filtered: Deal[] = useMemo(() => {
    let arr = [...deals];
    // dölj featured från grid högst upp (vi visar den i hero)
    if (featured) {
      arr = arr.filter(
        (d) => !(d.source === featured.source && d.source_id === featured.source_id)
      );
    }
    if (activeCategory && activeCategory !== 'Alla') {
      arr = arr.filter((d) => (d.category || 'Övrigt') === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter((d) => {
        const blob = `${d.title} ${d.description ?? ''} ${d.category ?? ''}`.toLowerCase();
        return blob.includes(q);
      });
    }
    // stabil sortering
    arr.sort((a, b) => {
      const sb = (b.score ?? 0) - (a.score ?? 0);
      if (sb !== 0) return sb;
      const tb = (b.trending ?? 0) - (a.trending ?? 0);
      if (tb !== 0) return tb;
      const db = (b.created_at ? Date.parse(b.created_at) : 0) - (a.created_at ? Date.parse(a.created_at) : 0);
      return db;
    });
    return arr;
  }, [deals, featured, activeCategory, query]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Lootsy – Sveriges smartaste deals</h1>
          <p className="text-slate-300/80">AI-kurerade kampanjer, uppdateras dagligen.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök efter produkter, varumärken…"
            className="h-10 w-72 rounded-xl border border-slate-600 bg-slate-800 px-4 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </header>

      {/* Status/Loader */}
      {loading && (
        <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800 p-6 text-slate-200">
          Laddar deals …
        </div>
      )}
      {err && (
        <div className="mb-8 rounded-xl border border-red-700 bg-red-900/40 p-6 text-red-100">
          {err}
        </div>
      )}

      {/* Dagens Superdeal */}
      {featured && !loading && (
        <section className="mb-10 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="relative">
              <img
                src={safeImg(featured.image_url)}
                alt={featured.title}
                className="h-full w-full object-cover md:h-[360px]"
              />
              <span className="absolute left-4 top-4 rounded-full bg-cyan-500 px-3 py-1 text-sm font-semibold text-slate-900">
                Dagens superdeal
              </span>
            </div>
            <div className="flex flex-col justify-center gap-3 p-6">
              <span className="w-fit rounded bg-slate-700/70 px-2 py-1 text-xs text-slate-200">
                {(featured.category || 'Övrigt')}
              </span>
              <h2 className="text-2xl font-bold text-slate-100">{featured.title}</h2>
              {featured.description && (
                <p className="max-w-prose text-slate-300">{featured.description}</p>
              )}
              <div className="mt-2 flex items-center gap-3">
                {fmtPrice(featured.price, featured.currency) && (
                  <span className="text-lg font-semibold text-slate-100">
                    {fmtPrice(featured.price, featured.currency)}
                  </span>
                )}
                <a
                  href={featured.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-900 hover:bg-cyan-400"
                >
                  Till butiken →
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trendande */}
      {!loading && trending.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-100">Trendande just nu</h3>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trending.map((d) => (
              <article
                key={`${d.source}-${d.source_id}-tr`}
                className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 hover:border-slate-600"
              >
                <div className="relative h-44 w-full">
                  <img
                    src={safeImg(d.image_url)}
                    alt={d.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-2 p-4">
                  <span className="rounded bg-slate-700/70 px-2 py-1 text-xs text-slate-200">
                    {d.category || 'Övrigt'}
                  </span>
                  <h4 className="line-clamp-2 font-semibold text-slate-100">{d.title}</h4>
                  {d.description && (
                    <p className="line-clamp-2 text-sm text-slate-300/80">{d.description}</p>
                  )}
                  <div className="pt-1">
                    <a
                      href={d.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-lg bg-cyan-500 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-cyan-400"
                    >
                      Se deal →
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Kategorier */}
      {!loading && categories.length > 0 && (
        <section className="mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`rounded-full border px-3 py-1 text-sm ${
                !activeCategory
                  ? 'border-cyan-500 bg-cyan-500 text-slate-900'
                  : 'border-slate-600 bg-slate-800 text-slate-200 hover:border-slate-500'
              }`}
            >
              Alla
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  activeCategory === c
                    ? 'border-cyan-500 bg-cyan-500 text-slate-900'
                    : 'border-slate-600 bg-slate-800 text-slate-200 hover:border-slate-500'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Alla deals */}
      {!loading && (
        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-100">Alla deals</h3>
            <span className="text-sm text-slate-400">
              {filtered.length} av {deals.length}
            </span>
          </div>
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-slate-200">
              Inga deals matchar din filtrering.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((d) => (
                <article
                  key={`${d.source}-${d.source_id}`}
                  className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 hover:border-slate-600"
                >
                  <div className="relative h-44 w-full">
                    <img
                      src={safeImg(d.image_url)}
                      alt={d.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-2 p-4">
                    <span className="rounded bg-slate-700/70 px-2 py-1 text-xs text-slate-200">
                      {d.category || 'Övrigt'}
                    </span>
                    <h4 className="line-clamp-2 font-semibold text-slate-100">{d.title}</h4>
                    {d.description && (
                      <p className="line-clamp-2 text-sm text-slate-300/80">{d.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-medium text-slate-200">
                        {fmtPrice(d.price, d.currency)}
                      </span>
                      <a
                        href={d.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-cyan-500 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-cyan-400"
                      >
                        Till butiken →
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}



