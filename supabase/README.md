1) Kör schema.sql i Supabase SQL Editor
2) Vercel env vars (web):
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE
   - OPENAI_API_KEY
3) Cron kör /api/sync varje hel timme (vercel.json)
