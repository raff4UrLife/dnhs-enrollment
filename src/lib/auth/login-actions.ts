// src/lib/auth/login-actions.ts
"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSession } from "@/lib/auth/session";

export type LoginResult = { ok: true } | { ok: false; error: string };

const GENERIC_ERROR = "Invalid username or password.";
const LOCKED_ERROR = "Too many failed attempts. Please try again in an hour.";
const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MINUTES = 60;

// Compared against when the username doesn't exist, so a wrong username
// takes about as long as a wrong password (hides which usernames are real)
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function loginWithPassword(
  username: string,
  password: string,
): Promise<LoginResult> {
  // Never trust the client: validate everything again here
  if (typeof username !== "string" || typeof password !== "string") {
    return { ok: false, error: GENERIC_ERROR };
  }

  const cleanUsername = username.trim().toLowerCase();
  if (!/^[a-z0-9._]{3,24}$/.test(cleanUsername) || password.length === 0) {
    return { ok: false, error: GENERIC_ERROR };
  }
  if (password.length > 128) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const admin = createAdminClient();

  // 1) Too many recent failures for this username? Stop before checking anything.
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count, error: countError } = await admin
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("username", cleanUsername)
    .gte("created_at", since);

  // If we can't count, fail closed rather than allow unlimited guessing
  if (countError) {
    return { ok: false, error: "Something went wrong. Try again." };
  }
  const failedSoFar = count ?? 0;
  if (failedSoFar >= MAX_FAILED_ATTEMPTS) {
    return { ok: false, error: LOCKED_ERROR };
  }

  // 2) Check the username and password
  const { data, error } = await admin
    .from("whitelisted_users")
    .select("id, password_hash, status")
    .eq("username", cleanUsername)
    .maybeSingle();

  if (error) {
    return { ok: false, error: "Something went wrong. Try again." };
  }

  const passwordMatches = await bcrypt.compare(
    password,
    data?.password_hash ?? DUMMY_HASH,
  );

  // 3) Failure (unknown user, wrong password, or disabled account): record it
  if (!data || !passwordMatches || data.status !== "active") {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    await admin.from("login_attempts").insert({
      username: cleanUsername,
      ip_address: ip ? ip.slice(0, 45) : null,
    });

    return {
      ok: false,
      error:
        failedSoFar + 1 >= MAX_FAILED_ATTEMPTS ? LOCKED_ERROR : GENERIC_ERROR,
    };
  }

  // 4) Success: clear this username's failed attempts and start the session
  await admin.from("login_attempts").delete().eq("username", cleanUsername);

  try {
    await createSession(data.id);
  } catch {
    return { ok: false, error: "Something went wrong. Try again." };
  }

  return { ok: true };
}
