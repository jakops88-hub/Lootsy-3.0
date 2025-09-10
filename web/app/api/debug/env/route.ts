import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ADREVENUE_API_BASE: process.env.ADREVENUE_API_BASE || null,
    ADREVENUE_API_KEY_present: Boolean(process.env.ADREVENUE_API_KEY),
    ADREVENUE_CHANNEL_ID_present: Boolean(process.env.ADREVENUE_CHANNEL_ID),
    // för att hitta ev. gamla namn:
    ADRECORD_API_KEY_present: Boolean(process.env.ADRECORD_API_KEY),
    NODE_ENV: process.env.NODE_ENV,
  });
}
