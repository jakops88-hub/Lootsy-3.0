import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data, error } = await supabaseAdmin.from('deals').select('id, link_url').eq('id', id).single();
  if (error || !data) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || null as any;
  const ua = req.headers.get('user-agent') || null;

  await supabaseAdmin.from('clicks').insert({
    deal_id: data.id,
    ip: ip || null,
    user_agent: ua || null
  });

  return NextResponse.redirect(data.link_url, { status: 302 });
}
