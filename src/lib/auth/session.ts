import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/auth/require-role";

const SESSION_COOKIE = "dnhs_session";
const SESSION_HOURS = 8; // one school workday

export type SessionUser = {
  id: string; // whitelisted_users.id
  email: string | null;
  role: Role;
};

// The database only ever sees this hash, never the real token
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Create a session for a verified user and set the httpOnly cookie.
// Call this only from a server action or route handler.
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = h.get("user-agent");

  const admin = createAdminClient();
  const { error } = await admin.from("sessions").insert({
    whitelisted_user_id: userId,
    google_sub: null,
    session_token: hashToken(token),
    ip_address: ip ? ip.slice(0, 45) : null,
    user_agent: userAgent,
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw new Error("Could not create session.");

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

// Returns the user for a valid username session, or null.
// Read-only, so it is safe to call from layouts and pages.
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sessions")
    .select("whitelisted_users ( id, email, role, status )")
    .eq("session_token", hashToken(token))
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;

  const rel = data.whitelisted_users as unknown;
  const user = (Array.isArray(rel) ? rel[0] : rel) as
    | { id: string; email: string | null; role: string; status: string }
    | undefined;

  // A disabled account loses access even if its session is still valid
  if (!user || user.status !== "active") return null;

  return { id: user.id, email: user.email, role: user.role as Role };
}

// Revoke the current username session (if any) and clear the cookie.
// Call this only from a server action or route handler.
export async function revokeCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const admin = createAdminClient();
    await admin
      .from("sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("session_token", hashToken(token))
      .is("revoked_at", null);
  }

  cookieStore.delete(SESSION_COOKIE);
}
