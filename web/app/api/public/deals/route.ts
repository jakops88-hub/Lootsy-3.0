import { NextRequest, NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase';

export const revalidate = 10;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const cat = searchParams.get('cat')?.trim();
  let query = supabasePublic.from('deals').select('*').order('is_featured',{ascending:false}).order('score',{ascending:false}).limit(60);
  if (cat) query = query.eq('category', cat);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
