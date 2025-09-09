import { openai } from './openai';
import { z } from 'zod';

const DealSchema = z.object({
  source: z.string(),
  source_id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  link_url: z.string().url(),
  image_url: z.string().nullable().optional(),
  score: z.number().nullable().optional(),
  is_featured: z.boolean().optional()
});
export type OptimizedDeal = z.infer<typeof DealSchema>;

export async function optimizeDealsWithAI(rawDeals: any[]) {
  const sys = `Du är en svensk e-handels- och SEO-expert. Du skriver kort, säljande copy.`;
  const user = `Optimera dessa deals. För varje deal:
- Lockande svensk titel (≤80 tecken)
- Kort CTA (≤140 tecken)
- Kategori: Elektronik, Mode, Sport, Hem, Skönhet, Resor (eller null)
- Score 0..100
- Markera exakt EN is_featured=true
Returnera JSON-array, behåll source & source_id.
Data: ${JSON.stringify(rawDeals).slice(0, 7000)}`;

  const r = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.3,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user }
    ]
  });

  const content = r.choices[0]?.message?.content || "[]";
  let json: any[] = [];
  try { json = JSON.parse(content); } catch { json = rawDeals; }
  return json.map((d) => ({
    ...d,
    category: d.category ?? null,
    score: d.score ?? 50,
    is_featured: Boolean(d.is_featured)
  }));
}
