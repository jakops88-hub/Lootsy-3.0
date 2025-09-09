import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseAdmin = createClient(url, process.env.SUPABASE_SERVICE_ROLE!, {
  auth: { persistSession: false }
});

export const supabasePublic = createClient(url, anon, {
  auth: { persistSession: typeof window !== 'undefined' }
});
