import { supabaseAdmin } from './supabase';
import { z } from 'zod';

const InDeal = z.object({
  source: z.string(),
  source_id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  link_url: z.string(),
  image_url: z.string().nullable().optional(),
  score: z.number().nullable().optional(),
  is_featured: z.boolean().optional()
});

export async function upsertDeals(deals: any[]) {
  const clean = deals.map(d => {
    const r = InDeal.parse(d);
    return {
      ...r,
      description: r.description ?? null,
      category: r.category ?? null,
      price: r.price ?? null,
      currency: r.currency ?? null,
      image_url: r.image_url ?? null,
      score: r.score ?? null,
      is_featured: r.is_featured ?? false
    };
  });
  const { error } = await supabaseAdmin.from('deals').upsert(clean, { onConflict: 'source,source_id' });
  if (error) throw error;
}
