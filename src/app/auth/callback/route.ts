import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth/require-role";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  // Use the host the browser actually used (localhost locally, real domain on
  // Vercel). request.url can report 0.0.0.0 in dev, which browsers can't open.
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?error=missing_code`);
  }

  const supabase = await createClient();

  // Swap the code for a real session (sets the cookies)
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`);
  }

  // Signed in with Google, but are they on the whitelist and active?
  const staff = await getCurrentStaff();
  if (!staff) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/admin/login?error=not_authorized`);
  }

  return NextResponse.redirect(`${origin}/admin`);
}
