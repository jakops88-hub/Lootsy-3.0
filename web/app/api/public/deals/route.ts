import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  try {
    // Hämta query params, t.ex. ?featured=1
    const { searchParams } = new URL(req.url);
    const featured = searchParams.get("featured");

    let query = supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false });

    if (featured) {
      query = query.eq("is_featured", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json(
        { ok: false, error: "Kunde inte hämta deals" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, count: data.length, deals: data });
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      { ok: false, error: "Serverfel vid hämtning av deals" },
      { status: 500 }
    );
  }
}
