'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  return (
    <Suspense fallback={<p className="text-slate-400">Laddar…</p>}>
      <HomeContent />
    </Suspense>
  );
}

type Deal = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number | null;
  currency: string | null;
  link_url: string;
  image_url: string | null;
  is_featured: boolean;
  score?: number | null;
};

function HomeContent() {
  const sp = useSearchParams();
  const cat = sp.get('cat') || undefined;
  const q = sp.get('q') || '';
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = new URL('/api/public/deals', window.location.origin);
    if (cat) url.searchParams.set('cat', cat);
    if (q) url.searchParams.set('q', q);
    setLoading(true);
    fetch(url.toString()).then(r => r.json()).then(setDeals).finally(()=>setLoading(false));
  }, [cat, q]);

  const featured = useMemo(() => deals.find(d => d.is_featured), [deals]);
  const rest = useMemo(() => deals.filter(d => !d.is_featured), [deals]);

  return (
    <div className="space-y-8">
      <div className="card p-6">
        <h1 className="text-3xl font-bold mb-2">Dagens Superdeal</h1>
        {!featured && <p className="text-slate-400">Ingen superdeal ännu – kör synken så dyker en upp.</p>}
        {featured && (
          <div className="grid md:grid-cols-[2fr,1fr] gap-6">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">{featured.title}</h2>
              {featured.description && <p className="text-slate-300">{featured.description}</p>}
              <div className="flex items-center gap-2">
                {featured.category && <span className="badge">{featured.category}</span>}
                {featured.price && <span className="badge">{featured.price} {featured.currency || 'kr'}</span>}
              </div>
              <a href={`/api/redirect?id=${featured.id}`} className="btn-primary w-fit">Se deal</a>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10">
              {featured.image_url ? (
                <Image src={featured.image_url} alt={featured.title} fill className="object-cover" />
              ) : <div className="w-full h-full grid place-items-center text-slate-500">Ingen bild</div>}
            </div>
          </div>
        )}
      </div>

      <SearchBar />

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Alla deals {cat ? `– ${cat}` : ''}</h3>
        {loading ? (
          <p className="text-slate-400">Laddar deals…</p>
        ) : (
          <div className="grid-deals">
            {rest.map(d => <DealCard key={d.id} deal={d} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  return (
    <article className="card p-4 flex flex-col gap-3">
      <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-[4/3]">
        {deal.image_url ? (
          <Image src={deal.image_url} alt={deal.title} fill className="object-cover" />
        ) : <div className="w-full h-full grid place-items-center text-slate-500">Ingen bild</div>}
      </div>
      <h4 className="font-semibold line-clamp-2">{deal.title}</h4>
      <p className="text-slate-400 text-sm line-clamp-3">{deal.description}</p>
      <div className="flex gap-2 text-xs">
        {deal.category && <span className="badge">{deal.category}</span>}
        {deal.price && <span className="badge">{deal.price} {deal.currency || 'kr'}</span>}
      </div>
      <div className="flex gap-2 mt-auto">
        <a className="btn-ghost" href={`/api/redirect?id=${deal.id}`}>Till butiken →</a>
        <Link className="btn-ghost" href={`/deal/${deal.id}`}>Mer info</Link>
      </div>
    </article>
  );
}

function SearchBar() {
  const sp = useSearchParams();
  const q0 = sp.get('q') || '';
  const cat0 = sp.get('cat') || '';
  const [q, setQ] = useState(q0);
  const [cat, setCat] = useState(cat0);
  const apply = () => {
    const url = new URL(window.location.href);
    if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
    if (cat) url.searchParams.set('cat', cat); else url.searchParams.delete('cat');
    window.location.href = url.toString();
  };
  return (
    <div className="card p-4 flex flex-col md:flex-row gap-3 items-center">
      <input
        value={q}
        onChange={e=>setQ(e.target.value)}
        placeholder="Sök efter 'AirPods', 'jacka', 'resor'…"
        className="w-full md:flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 outline-none"
      />
      <select
        value={cat}
        onChange={e=>setCat(e.target.value)}
        className="rounded-xl bg-white/5 border border-white/10 px-3 py-2"
      >
        <option value="">Alla kategorier</option>
        <option>Elektronik</option>
        <option>Mode</option>
        <option>Sport</option>
        <option>Hem</option>
        <option>Skönhet</option>
        <option>Resor</option>
      </select>
      <bu

