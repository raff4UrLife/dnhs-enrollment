// src/components/offline/offline-session-saver.tsx
"use client";

import { useEffect } from "react";
import { saveOfflineSession } from "@/lib/offline/cache";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

type Props = {
  role: "admin" | "staff" | "teacher";
  name: string | null;
};

// Renders nothing. Each time the portal loads online, it refreshes the saved
// note (role, name, expiry) that lets this computer open the offline walk-in form.
export default function OfflineSessionSaver({ role, name }: Props) {
  useEffect(() => {
    // Only admin and staff can encode walk-ins, so only they get a note.
    // Teachers do nothing here, so they never erase a staff member's note.
    if (role !== "admin" && role !== "staff") return;

    void saveOfflineSession({
      role,
      name: name ?? "Staff",
      expiresAt: Date.now() + SEVEN_DAYS,
    });
  }, [role, name]);

  return null;
}
