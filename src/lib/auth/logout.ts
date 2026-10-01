"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revokeCurrentSession } from "@/lib/auth/session";

export async function logout() {
  // Username/password login: revoke the session row and clear the cookie
  await revokeCurrentSession();

  // Google login: sign out of Supabase (does nothing if there is no session)
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/admin/login");
}
