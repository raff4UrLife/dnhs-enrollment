// src/lib/offline/cache.ts
import { offlineDb } from "@/lib/offline/db";

export const REFERENCE_KEY = "reference-data";
const SESSION_KEY = "offline-session";

// Section Rosters are cached one row per school year + section,
// e.g. "section-roster:2026:12".
export const ROSTER_PREFIX = "section-roster:";

export function rosterKey(
  schoolYearId: string | number,
  sectionId: string | number,
): string {
  return `${ROSTER_PREFIX}${schoolYearId}:${sectionId}`;
}

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

// --- Cached Section Rosters (contain student names and grades) ---

// Every roster saved on this computer, for the offline section picker.
export async function readAllRosterCaches<T>(): Promise<
  Array<CachedValue<T> & { key: string }>
> {
  try {
    const rows = await offlineDb.cache
      .where("key")
      .startsWith(ROSTER_PREFIX)
      .toArray();
    return rows.map((row) => ({
      key: row.key,
      value: row.value as T,
      savedAt: row.savedAt,
    }));
  } catch (error) {
    console.error("[offline] could not read roster caches:", error);
    return [];
  }
}

export async function clearRosterCaches(): Promise<void> {
  try {
    await offlineDb.cache.where("key").startsWith(ROSTER_PREFIX).delete();
  } catch (error) {
    console.error("[offline] could not clear roster caches:", error);
  }
}

// --- Saved sign-in note (role + name + expiry only; no password or token is ever stored) ---

export async function saveOfflineSession(
  session: OfflineSession,
): Promise<void> {
  await saveCache(SESSION_KEY, session);
}

// Returns the note only if it has not expired. An expired note is deleted,
// and so are the cached rosters, so student data does not linger.
export async function readOfflineSession(): Promise<OfflineSession | null> {
  const row = await readCache<OfflineSession>(SESSION_KEY);
  if (!row) return null;
  if (row.value.expiresAt <= Date.now()) {
    await clearCache(SESSION_KEY);
    await clearRosterCaches();
    return null;
  }
  return row.value;
}

// Called on sign-out: removes the note and the cached rosters.
export async function clearOfflineSession(): Promise<void> {
  await clearCache(SESSION_KEY);
  await clearRosterCaches();
}

// // src/lib/offline/cache.ts
// import { offlineDb } from "@/lib/offline/db";

// export const REFERENCE_KEY = "reference-data";
// const SESSION_KEY = "offline-session";

// export type OfflineSession = {
//   role: "admin" | "staff" | "teacher";
//   name: string;
//   expiresAt: number; // timestamp in ms; the offline page stops opening after this
// };

// export type CachedValue<T> = { value: T; savedAt: number };

// export async function saveCache(key: string, value: unknown): Promise<void> {
//   try {
//     await offlineDb.cache.put({ key, value, savedAt: Date.now() });
//   } catch (error) {
//     console.error("[offline] could not save cache:", key, error);
//   }
// }

// export async function readCache<T>(
//   key: string,
// ): Promise<CachedValue<T> | null> {
//   try {
//     const row = await offlineDb.cache.get(key);
//     return row ? { value: row.value as T, savedAt: row.savedAt } : null;
//   } catch (error) {
//     console.error("[offline] could not read cache:", key, error);
//     return null;
//   }
// }

// export async function clearCache(key: string): Promise<void> {
//   try {
//     await offlineDb.cache.delete(key);
//   } catch (error) {
//     console.error("[offline] could not clear cache:", key, error);
//   }
// }

// // --- Saved sign-in note (role + name + expiry only; no password or token is ever stored) ---

// export async function saveOfflineSession(
//   session: OfflineSession,
// ): Promise<void> {
//   await saveCache(SESSION_KEY, session);
// }

// // Returns the note only if it has not expired. An expired one is deleted.
// export async function readOfflineSession(): Promise<OfflineSession | null> {
//   const row = await readCache<OfflineSession>(SESSION_KEY);
//   if (!row) return null;
//   if (row.value.expiresAt <= Date.now()) {
//     await clearCache(SESSION_KEY);
//     return null;
//   }
//   return row.value;
// }

// export async function clearOfflineSession(): Promise<void> {
//   await clearCache(SESSION_KEY);
// }
