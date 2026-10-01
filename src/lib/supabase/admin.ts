// src/lib/supabase/admin.ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

// Bypasses RLS. Only import this from server actions, route handlers,
// or server components, and only AFTER checking the caller's role.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  }

  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
