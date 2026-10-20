// src/components/offline/offline-session-saver.tsx
"use client";

import { useEffect } from "react";
import {
  //readCache,
  rosterKey,
  saveCache,
  saveOfflineSession,
} from "@/lib/offline/cache";
import type { RosterData } from "@/lib/sections/types";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
// Roster copies hold student names, so do not re-download on every page click.
//const ROSTER_REFRESH_MS = 15 * 60 * 1000;

type Props = {
  role: "admin" | "staff" | "teacher";
  name: string | null;
};

// The roster response has no school year list (the endpoint leaves it out).
type CachedRoster = Omit<RosterData, "schoolYears">;

// Renders nothing. Each time the portal loads online, it refreshes the saved
// note (role, name, expiry), then quietly loads the offline walk-in form once
// so the service worker keeps a copy, and saves a copy of the active school
// year's Section Rosters so /offline-sections works from any portal page.
export default function OfflineSessionSaver({ role, name }: Props) {
  useEffect(() => {
    // Only admin and staff get offline copies, so teachers do nothing here
    // and never erase a staff member's note.
    if (role !== "admin" && role !== "staff") return;

    let cancelled = false;

    void saveOfflineSession({
      role,
      name: name ?? "Staff",
      expiresAt: Date.now() + SEVEN_DAYS,
    });

    // Wait a moment so this never competes with the page the person is
    // actually looking at.
    const timer = window.setTimeout(async () => {
      if (cancelled || !navigator.onLine) return;

      // The response is not used. The service worker saves it as a side effect.
      fetch("/offline-walk-in", { credentials: "same-origin" }).catch(() => {
        // Offline or a network hiccup: try again on the next portal load.
      });

      // Same trick for the offline rosters page, so the service worker keeps
      // a copy of the page itself, not just the roster data.
      fetch("/offline-sections", { credentials: "same-origin" }).catch(() => {
        // Offline or a network hiccup: try again on the next portal load.
      });

      try {
        const response = await fetch("/api/offline/rosters", {
          credentials: "same-origin",
          cache: "no-store",
        });
        // 401/403/404 and similar: nothing to save, try again next load.
        if (!response.ok || cancelled) return;

        const roster = (await response.json()) as CachedRoster;
        if (cancelled || !roster?.schoolYearId) return;

        await saveCache(rosterKey(roster.schoolYearId, "all"), roster);
      } catch {
        // Offline or a network hiccup: try again on the next portal load.
      }
    }, 3000);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [role, name]);

  return null;
}
