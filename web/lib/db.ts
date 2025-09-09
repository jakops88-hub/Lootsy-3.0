// web/lib/db.ts
import { supabaseAdmin } from './supabase';
import { z } from 'zod';
import { normalizeAll, ensureOneFeatured } from './normalize';

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
  // 🔧 normalisera & säkerställ en featured
  const normalized = ensureOneFeatured(normalizeAll(deals));

  const clean = normalized.map(d => {
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

  const { error } = await supabaseAdmin
    .from('deals')
    .upsert(clean, { onConflict: 'source,source_id' });

  if (error) throw error;
}
