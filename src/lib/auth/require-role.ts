// src/lib/auth/require-role.ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type Role = "admin" | "staff" | "teacher";

export type CurrentStaff = {
  id: string; // whitelisted_users.id (use this for reviewed_by)
  email: string;
  role: Role;
};

export class AuthError extends Error {}

// Returns the signed-in, active whitelisted user, or null.
export async function getCurrentStaff(): Promise<CurrentStaff | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(); // verified with Supabase, not just read from the cookie

  const email = user?.email?.toLowerCase();
  if (!email) return null;

  // ilike = case-insensitive match; escape % _ \ so they aren't treated as wildcards
  const escaped = email.replace(/[\\%_]/g, "\\$&");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("whitelisted_users")
    .select("id, email, role")
    .eq("status", "active")
    .ilike("email", escaped)
    .maybeSingle();

  if (error || !data) return null;

  return { id: data.id, email: data.email, role: data.role as Role };
}

// Throws AuthError unless the caller is an active user with one of the allowed roles.
export async function requireRole(...allowed: Role[]): Promise<CurrentStaff> {
  const staff = await getCurrentStaff();

  if (!staff) {
    throw new AuthError("You are not signed in or not authorized.");
  }
  if (!allowed.includes(staff.role)) {
    throw new AuthError("You do not have permission to do this.");
  }
  return staff;
}
