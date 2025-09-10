import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // Service role key används ENBART i server routes (aldrig i klient)
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const featured = searchParams.get("featured");

    let query = supabase
      .from("deals")
      .select("id, source, source_id, title, description, category, price, currency, link_url, image_url, score, is_featured, created_at")
      .order("created_at", { ascending: false });

    if (featured) {
      query = query.eq("is_featured", true).limit(1);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: data?.length || 0, deals: data || [] }, { headers: { "Cache-Control": "no-store" }});
  } catch (err: any) {
    console.error("API Error:", err?.message || err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
