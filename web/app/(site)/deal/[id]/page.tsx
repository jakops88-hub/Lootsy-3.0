import { supabasePublic } from '@/lib/supabase';
import Image from 'next/image';
import type { Metadata } from 'next';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabasePublic.from('deals').select('*').eq('id', params.id).single();
  if (!data) return { title: 'Deal saknas – Lootsy' };
  const title = data.title + ' – Lootsy';
  const description = data.description || 'Se erbjudandet på Lootsy';
  const url = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/deal/${params.id}`;
  const images = data.image_url ? [{ url: data.image_url }] : [];
  return {
    title, description,
    openGraph: { title, description, url, images },
    twitter: { card: 'summary_large_image', title, description, images }
  };
}

export default async function DealPage({ params }: Props) {
  const { data } = await supabasePublic.from('deals').select('*').eq('id', params.id).single();
  if (!data) return <div className="text-slate-300">Deal saknas.</div>;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.title,
    description: data.description,
    image: data.image_url,
    offers: {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: data.currency || 'SEK',
      url: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/redirect?id=${data.id}`
    }
  };

  return (
    <div className="card p-6 space-y-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-2xl font-bold">{data.title}</h1>
      <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10">
        {data.image_url ? (
          <Image src={data.image_url} alt={data.title} fill className="object-cover" />
        ) : <div className="w-full h-full grid place-items-center text-slate-500">Ingen bild</div>}
      </div>
      {data.description && <p className="text-slate-300">{data.description}</p>}
      <div className="flex gap-2">
        {data.category && <span className="badge">{data.category}</span>}
        {data.price && <span className="badge">{data.price} {data.currency || 'kr'}</span>}
      </div>
      <a href={`/api/redirect?id=${data.id}`} className="btn-primary w-fit">Till butiken →</a>
    </div>
  );
}
