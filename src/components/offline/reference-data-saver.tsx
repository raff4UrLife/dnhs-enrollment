// src/components/offline/reference-data-saver.tsx
"use client";

import { useEffect } from "react";
import { REFERENCE_KEY, saveCache } from "@/lib/offline/cache";
import type { ReferenceData } from "@/lib/enrollment/load-reference-data";

type Props = {
  data: ReferenceData;
};

// Renders nothing. Each time the page loads online, it saves a copy of the form's
// dropdown data (school year, tracks, strands, barangays, modalities, SPED, documents)
// in this browser, so the offline walk-in form can use it later.
export default function ReferenceDataSaver({ data }: Props) {
  useEffect(() => {
    void saveCache(REFERENCE_KEY, data);
  }, [data]);

  return null;
}
