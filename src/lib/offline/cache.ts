// src/lib/offline/cache.ts
import { offlineDb } from "@/lib/offline/db";

export const REFERENCE_KEY = "reference-data";
const SESSION_KEY = "offline-session";

export type OfflineSession = {
  role: "admin" | "staff" | "teacher";
  name: string;
  expiresAt: number; // timestamp in ms; the offline page stops opening after this
};

export type CachedValue<T> = { value: T; savedAt: number };

export async function saveCache(key: string, value: unknown): Promise<void> {
  try {
    await offlineDb.cache.put({ key, value, savedAt: Date.now() });
  } catch (error) {
    console.error("[offline] could not save cache:", key, error);
  }
}

export async function readCache<T>(
  key: string,
): Promise<CachedValue<T> | null> {
  try {
    const row = await offlineDb.cache.get(key);
    return row ? { value: row.value as T, savedAt: row.savedAt } : null;
  } catch (error) {
    console.error("[offline] could not read cache:", key, error);
    return null;
  }
}

export async function clearCache(key: string): Promise<void> {
  try {
    await offlineDb.cache.delete(key);
  } catch (error) {
    console.error("[offline] could not clear cache:", key, error);
  }
}

// --- Saved sign-in note (role + name + expiry only; no password or token is ever stored) ---

export async function saveOfflineSession(
  session: OfflineSession,
): Promise<void> {
  await saveCache(SESSION_KEY, session);
}

// Returns the note only if it has not expired. An expired one is deleted.
export async function readOfflineSession(): Promise<OfflineSession | null> {
  const row = await readCache<OfflineSession>(SESSION_KEY);
  if (!row) return null;
  if (row.value.expiresAt <= Date.now()) {
    await clearCache(SESSION_KEY);
    return null;
  }
  return row.value;
}

export async function clearOfflineSession(): Promise<void> {
  await clearCache(SESSION_KEY);
}
