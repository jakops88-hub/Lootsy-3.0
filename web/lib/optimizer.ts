import { z } from "zod";

const CATEGORIES = [
  "Elektronik",
  "Hem",
  "Skönhet & Hälsa",
  "Mode",
  "Sport & Fritid",
  "Barn & Baby",
  "Mat & Dryck",
  "Resor",
  "Övrigt"
] as const;

const DealIn = z.object({
  source: z.string(),
  source_id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  link_url: z.string(),
  image_url: z.string().nullable().optional(),
});

export type DealIn = z.infer<typeof DealIn>;
export type DealOut = DealIn & {
  category: string | null;
  score?: number | null;
  is_featured?: boolean;
};

// --- enkel fallback-kategorisering om OpenAI saknas/felar
function keywordCategory(t: string): string | null {
  const s = t.toLowerCase();
  if (/(macbook|iphone|airpods|laptop|tv|hdr|ssd|ps5|xbox)/.test(s)) return "Elektronik";
  if (/(soffa|kök|säng|dammsug|airfryer|kaff|inred)/.test(s)) return "Hem";
  if (/(kräm|hud|vitamin|schampo|smink|parfym)/.test(s)) return "Skönhet & Hälsa";
  if (/(jacka|skor|sneakers|nike|adidas|byxor|klänning)/.test(s)) return "Mode";
  if (/(träning|gym|cykel|golf|fotboll|löp)/.test(s)) return "Sport & Fritid";
  if (/(blöja|leksak|barn|baby)/.test(s)) return "Barn & Baby";
  if (/(kaffe|protein|mat|livs|snacks)/.test(s)) return "Mat & Dryck";
  if (/(hotell|flyg|resa|resor)/.test(s)) return "Resor";
  return "Övrigt";
}

export async function optimizeDealsWithAI(raw: DealIn[]): Promise<DealOut[]> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  // Om ingen nyckel: kör fallback snabbt
  if (!OPENAI_API_KEY) {
    return raw.map((d, i) => ({
      ...d,
      title: d.title,
      description: d.description ?? null,
      category: d.category ?? keywordCategory(`${d.title} ${d.description ?? ""}`),
      score: 50,
      is_featured: i === 0
    }));
  }

  // Använd GPT för att putsa + kategorisera
  try {
    const payload = {
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Du är en svensk e-handelsexpert. För varje deal: förbättra titel (max 90 tecken), kort beskrivning (max 140 tecken), och mappa till en av kategorierna: " +
            CATEGORIES.join(", ") + ". Returnera en JSON-array."
        },
        {
          role: "user",
          content:
            "Deals:\n" + JSON.stringify(raw.slice(0, 40)) + // batchar första 40 per körning
            "\nSvara med JSON-array där varje objekt har: { title, description, category }."
        }
      ]
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) throw new Error(`OpenAI ${r.status}`);

    const json: any = await r.json();
    const content = json?.choices?.[0]?.message?.content ?? "[]";
    let aiArr: any[] = [];
    try { aiArr = JSON.parse(content); } catch { aiArr = []; }

    return raw.map((d, i) => {
      const ai = aiArr[i] || {};
      const cat = typeof ai.category === "string" && CATEGORIES.includes(ai.category) ? ai.category : (d.category ?? keywordCategory(`${d.title} ${d.description ?? ""}`));
      const title = typeof ai.title === "string" && ai.title.trim() ? ai.title.trim() : d.title;
      const descr = typeof ai.description === "string" && ai.description.trim() ? ai.description.trim() : (d.description ?? null);
      return {
        ...d,
        title,
        description: descr,
        category: cat,
        score: 60,          // lite boost för AI-putsad
        is_featured: i === 0
      };
    });

  } catch (e) {
    // Felsäkert: fall tillbaka till keyword-mappning
    return raw.map((d, i) => ({
      ...d,
      category: d.category ?? keywordCategory(`${d.title} ${d.description ?? ""}`),
      score: 50,
      is_featured: i === 0
    }));
  }
}
