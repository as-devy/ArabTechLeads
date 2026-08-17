import { NextResponse } from "next/server";

/** Legacy Supabase OAuth callback — Auth.js uses /api/auth/callback/google */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`);
}
