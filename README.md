# Lootsy 3.1 – AI-driven affiliate-plattform

Nyheter i 3.1:
- Klicktracking via `/api/redirect` (Supabase `clicks`)
- Deal-detaljsidor `/deal/[id]` med SEO + JSON-LD
- Sidor: /about, /contact, /privacy
- `sitemap.xml` för indexering

## Snabbstart
- Supabase: kör `supabase/schema.sql`
- Web: `cp web/.env.example web/.env.local` → fyll i nycklar → `npm i && npm run dev`
- Kör `/api/sync` för att seed:a deals
- Mobil: `cd mobile && npm i && npm start` (ställ `apiBaseUrl`)

## Deploy
- Push till GitHub → Vercel (root = `web/`)
- Lägg env i Vercel
- Cron kör `/api/sync` varje hel timme
