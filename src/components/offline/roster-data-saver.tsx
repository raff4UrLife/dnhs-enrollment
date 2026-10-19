// src/components/offline/roster-data-saver.tsx
"use client";

import { useEffect } from "react";
import { rosterKey, saveCache } from "@/lib/offline/cache";
import type { RosterData } from "@/lib/sections/types";

type Props = {
  data: RosterData;
};

// Renders nothing. Each time the Section Rosters page loads online (and again
// after a final average or a move refreshes the data), it saves a copy of the
// school year's roster in this browser, so the offline preview can open it later.
// The cached copy is wiped by cache.ts when the offline sign-in note expires
// or when the person logs out.
export default function RosterDataSaver({ data }: Props) {
  useEffect(() => {
    // The school year dropdown needs the server, so it is not saved.
    const copy: RosterData = { ...data };
    delete copy.schoolYears;

    void saveCache(rosterKey(data.schoolYearId, "all"), copy);
  }, [data]);

  return null;
}
