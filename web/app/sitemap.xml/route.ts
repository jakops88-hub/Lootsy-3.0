import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase';

export const revalidate = 3600;

export async function GET() {
  const base = process.env.APP_BASE_URL || 'http://localhost:3000';
  const { data } = await supabasePublic.from('deals').select('id').limit(200);
  const urls = (data||[]).map(d => `<url><loc>${base}/deal/${d.id}</loc></url>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>${base}/</loc></url>
    <url><loc>${base}/about</loc></url>
    <url><loc>${base}/contact</loc></url>
    <url><loc>${base}/privacy</loc></url>
    ${urls}
  </urlset>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } as any });
}
